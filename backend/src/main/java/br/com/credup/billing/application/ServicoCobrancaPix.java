package br.com.credup.billing.application;

import br.com.credup.billing.api.DtosPix.RespostaCobrancaPix;
import br.com.credup.billing.api.DtosPix.RespostaStatusPix;
import br.com.credup.identity.domain.Usuario;
import br.com.credup.shared.exception.ExcecaoApi;
import com.fasterxml.jackson.databind.JsonNode;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.qrcode.QRCodeWriter;
import com.mercadopago.exceptions.MPInvalidWebhookSignatureException;
import com.mercadopago.webhook.WebhookSignatureValidator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Service
public class ServicoCobrancaPix {
    private static final String CAMINHO_ORDENS = "/v1/orders";

    private final ServicoAssinatura assinaturas;
    private final RestClient http;
    private final String accessToken;
    private final BigDecimal valorMensal;
    private final int expiracaoSegundos;
    private final String apiUrl;
    private final String webhookSecret;
    private final boolean ambienteTeste;

    public ServicoCobrancaPix(
            ServicoAssinatura assinaturas,
            RestClient.Builder construtorHttp,
            @Value("${app.pix.mercado-pago.ambiente}") String ambiente,
            @Value("${app.pix.mercado-pago.access-token}") String accessToken,
            @Value("${app.pix.mercado-pago.valor-mensal}") BigDecimal valorMensal,
            @Value("${app.pix.mercado-pago.expiracao-segundos}") int expiracaoSegundos,
            @Value("${app.pix.mercado-pago.api-url}") String apiUrl,
            @Value("${app.pix.mercado-pago.webhook-secret}") String webhookSecret) {
        this.assinaturas = assinaturas;
        this.http = construtorHttp.build();
        this.accessToken = accessToken;
        this.valorMensal = valorMensal.setScale(2);
        this.expiracaoSegundos = expiracaoSegundos;
        this.apiUrl = removerBarraFinal(apiUrl);
        this.webhookSecret = webhookSecret;
        this.ambienteTeste = !"producao".equalsIgnoreCase(ambiente)
                && !"production".equalsIgnoreCase(ambiente);
    }

    public RespostaCobrancaPix gerar(Usuario usuario) {
        validarConfiguracao();
        String referenciaExterna = "CREDUP-" + UUID.randomUUID();
        JsonNode resposta = criarOrdem(usuario, referenciaExterna);
        String idOrdem = textoObrigatorio(resposta, "id", "identificador da cobrança");
        JsonNode pagamento = primeiroPagamento(resposta);
        JsonNode meioPagamento = pagamento.path("payment_method");
        String copiaECola = textoObrigatorio(
                meioPagamento,
                "qr_code",
                "Pix Copia e Cola");
        String qrCodeBase64 = meioPagamento.path("qr_code_base64").asText();
        if (qrCodeBase64.isBlank()) {
            qrCodeBase64 = gerarQrCode(copiaECola);
        } else if (!qrCodeBase64.startsWith("data:image/")) {
            qrCodeBase64 = "data:image/png;base64," + qrCodeBase64;
        }

        validarOrdem(resposta, referenciaExterna);
        assinaturas.registrarCobrancaPix(usuario, idOrdem, valorMensal);

        return new RespostaCobrancaPix(
                valorMensal,
                idOrdem,
                "Mercado Pago",
                copiaECola,
                qrCodeBase64,
                Instant.now(),
                resposta.path("status").asText("action_required"),
                expiracaoSegundos,
                "A assinatura será ativada somente após o Mercado Pago confirmar o crédito.");
    }

    public RespostaStatusPix consultar(Usuario usuario, String idOrdem) {
        validarIdOrdem(idOrdem);
        var assinatura = assinaturas.validarCobrancaDoUsuario(usuario, idOrdem);
        if (assinatura.getPixPagoEm() != null) {
            return new RespostaStatusPix(
                    idOrdem,
                    "processed",
                    true,
                    assinatura.getPixPagoEm());
        }

        JsonNode resposta = chamarMercadoPago("/v1/orders/" + idOrdem);
        validarOrdemConsultada(resposta, idOrdem, assinatura.getPixValor());
        String status = resposta.path("status").asText("unknown");
        String detalhe = resposta.path("status_detail").asText();
        boolean pago = "processed".equalsIgnoreCase(status)
                && "accredited".equalsIgnoreCase(detalhe);
        Instant confirmadoEm = pago
                ? assinaturas.confirmarPagamentoPix(usuario, idOrdem)
                : null;
        return new RespostaStatusPix(idOrdem, status, pago, confirmadoEm);
    }

    public void processarWebhook(
            String assinaturaRecebida,
            String identificadorRequisicao,
            String idOrdem,
            String tipo) {
        validarAssinaturaWebhook(
                assinaturaRecebida,
                identificadorRequisicao,
                idOrdem);
        if (!"order".equalsIgnoreCase(tipo)) {
            return;
        }
        validarIdOrdem(idOrdem);
        var valorCobranca = assinaturas.obterValorCobrancaPix(idOrdem);
        if (valorCobranca.isEmpty()) {
            return;
        }
        JsonNode ordem = chamarMercadoPago("/v1/orders/" + idOrdem);
        String status = ordem.path("status").asText();
        String detalhe = ordem.path("status_detail").asText();
        if (!"processed".equalsIgnoreCase(status)
                || !"accredited".equalsIgnoreCase(detalhe)) {
            return;
        }
        validarOrdemConsultada(ordem, idOrdem, valorCobranca.get());
        assinaturas.confirmarPagamentoPixPorWebhook(idOrdem);
    }

    private void validarAssinaturaWebhook(
            String assinaturaRecebida,
            String identificadorRequisicao,
            String idOrdem) {
        if (webhookSecret.isBlank()) {
            throw new ExcecaoApi(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "O webhook do Mercado Pago ainda não foi configurado");
        }
        try {
            WebhookSignatureValidator.validate(
                    assinaturaRecebida,
                    identificadorRequisicao,
                    idOrdem,
                    webhookSecret,
                    Duration.ofMinutes(5));
        } catch (MPInvalidWebhookSignatureException | IllegalArgumentException erro) {
            throw new ExcecaoApi(
                    HttpStatus.UNAUTHORIZED,
                    "Assinatura do webhook do Mercado Pago inválida");
        }
    }

    private JsonNode criarOrdem(Usuario usuario, String referenciaExterna) {
        Map<String, Object> corpo = Map.of(
                "type", "online",
                "external_reference", referenciaExterna,
                "total_amount", valorMensal.toPlainString(),
                "payer", Map.of(
                        "email", ambienteTeste
                                ? "test_user_br@testuser.com"
                                : usuario.getEmail(),
                        "first_name", ambienteTeste ? "APRO" : usuario.getName()),
                "transactions", Map.of(
                        "payments", new Object[]{Map.of(
                                "amount", valorMensal.toPlainString(),
                                "payment_method", Map.of(
                                        "id", "pix",
                                        "type", "bank_transfer"))}));
        try {
            JsonNode resposta = http.post()
                    .uri(apiUrl + CAMINHO_ORDENS)
                    .headers(cabecalhos -> {
                        cabecalhos.setBearerAuth(accessToken);
                        cabecalhos.set("X-Idempotency-Key", UUID.randomUUID().toString());
                    })
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(corpo)
                    .retrieve()
                    .body(JsonNode.class);
            return exigirResposta(resposta);
        } catch (RestClientResponseException erro) {
            throw erroIntegracao(erro, "criar a cobrança Pix");
        }
    }

    private JsonNode chamarMercadoPago(String caminho) {
        try {
            JsonNode resposta = http.get()
                    .uri(apiUrl + caminho)
                    .headers(cabecalhos -> cabecalhos.setBearerAuth(accessToken))
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(JsonNode.class);
            return exigirResposta(resposta);
        } catch (RestClientResponseException erro) {
            throw erroIntegracao(erro, "consultar a cobrança Pix");
        }
    }

    private ExcecaoApi erroIntegracao(RestClientResponseException erro, String operacao) {
        return new ExcecaoApi(
                HttpStatus.BAD_GATEWAY,
                "O Mercado Pago não conseguiu " + operacao
                        + " (código " + erro.getStatusCode().value() + ")");
    }

    private JsonNode exigirResposta(JsonNode resposta) {
        if (resposta == null || resposta.isNull()) {
            throw new ExcecaoApi(
                    HttpStatus.BAD_GATEWAY,
                    "O Mercado Pago retornou uma resposta vazia");
        }
        return resposta;
    }

    private void validarOrdem(JsonNode ordem, String referenciaEsperada) {
        if (!referenciaEsperada.equals(ordem.path("external_reference").asText())) {
            throw new ExcecaoApi(
                    HttpStatus.BAD_GATEWAY,
                    "A cobrança retornada pelo Mercado Pago não corresponde à solicitação");
        }
        validarValor(ordem.path("total_amount"), valorMensal);
        JsonNode pagamento = primeiroPagamento(ordem);
        if (!"pix".equalsIgnoreCase(pagamento.path("payment_method").path("id").asText())) {
            throw new ExcecaoApi(
                    HttpStatus.BAD_GATEWAY,
                    "O Mercado Pago não retornou uma cobrança Pix");
        }
    }

    private void validarOrdemConsultada(
            JsonNode ordem,
            String idEsperado,
            BigDecimal valorEsperado) {
        if (!idEsperado.equals(ordem.path("id").asText())) {
            throw new ExcecaoApi(
                    HttpStatus.BAD_GATEWAY,
                    "A cobrança consultada no Mercado Pago não corresponde à assinatura");
        }
        validarValor(ordem.path("total_amount"), valorEsperado);
        JsonNode pagamento = primeiroPagamento(ordem);
        if (!"pix".equalsIgnoreCase(pagamento.path("payment_method").path("id").asText())) {
            throw new ExcecaoApi(
                    HttpStatus.BAD_GATEWAY,
                    "A cobrança consultada não utiliza Pix");
        }
    }

    private void validarValor(JsonNode valorRecebido, BigDecimal valorEsperado) {
        try {
            BigDecimal valor = new BigDecimal(valorRecebido.asText());
            if (valorEsperado == null || valorEsperado.compareTo(valor) != 0) {
                throw new NumberFormatException();
            }
        } catch (NumberFormatException erro) {
            throw new ExcecaoApi(
                    HttpStatus.BAD_GATEWAY,
                    "O valor retornado pelo Mercado Pago não corresponde à assinatura");
        }
    }

    private JsonNode primeiroPagamento(JsonNode ordem) {
        JsonNode pagamentos = ordem.path("transactions").path("payments");
        if (!pagamentos.isArray() || pagamentos.isEmpty()) {
            throw new ExcecaoApi(
                    HttpStatus.BAD_GATEWAY,
                    "O Mercado Pago não retornou os dados do pagamento Pix");
        }
        return pagamentos.get(0);
    }

    private String textoObrigatorio(JsonNode resposta, String campo, String descricao) {
        String valor = resposta.path(campo).asText();
        if (valor.isBlank()) {
            throw new ExcecaoApi(
                    HttpStatus.BAD_GATEWAY,
                    "O Mercado Pago não retornou o " + descricao);
        }
        return valor;
    }

    private void validarConfiguracao() {
        if (accessToken.isBlank()) {
            throw new ExcecaoApi(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "A integração Pix do Mercado Pago ainda não foi configurada");
        }
        if (ambienteTeste && !accessToken.startsWith("APP_USR")) {
            throw new ExcecaoApi(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Configure um Access Token de teste do Mercado Pago");
        }
    }

    private void validarIdOrdem(String idOrdem) {
        if (idOrdem == null || !idOrdem.matches("ORD[A-Za-z0-9]{20,40}")) {
            throw new ExcecaoApi(
                    HttpStatus.BAD_REQUEST,
                    "Identificador da cobrança Pix inválido");
        }
    }

    private String gerarQrCode(String payload) {
        try {
            var matriz = new QRCodeWriter().encode(
                    payload,
                    BarcodeFormat.QR_CODE,
                    360,
                    360);
            var saida = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matriz, "PNG", saida);
            return "data:image/png;base64,"
                    + Base64.getEncoder().encodeToString(saida.toByteArray());
        } catch (Exception erro) {
            throw new ExcecaoApi(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Não foi possível gerar o QR Code Pix");
        }
    }

    private static String removerBarraFinal(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
