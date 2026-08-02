package br.com.credup.billing.application;

import br.com.credup.billing.api.DtosPix.RespostaCobrancaPix;
import br.com.credup.billing.api.DtosPix.RespostaStatusPix;
import br.com.credup.identity.domain.Usuario;
import br.com.credup.shared.exception.ExcecaoApi;
import com.fasterxml.jackson.databind.JsonNode;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service
public class ServicoCobrancaPix {
    private final ServicoAssinatura assinaturas;
    private final RestClient http;
    private final String appKey;
    private final String clientId;
    private final String clientSecret;
    private final String chavePix;
    private final BigDecimal valorMensal;
    private final int expiracaoSegundos;
    private final String oauthUrl;
    private final String apiUrl;
    private String tokenEmCache;
    private Instant tokenExpiraEm = Instant.EPOCH;

    public ServicoCobrancaPix(
            ServicoAssinatura assinaturas,
            RestClient.Builder construtorHttp,
            @Value("${app.pix.bb.ambiente}") String ambiente,
            @Value("${app.pix.bb.app-key}") String appKey,
            @Value("${app.pix.bb.client-id}") String clientId,
            @Value("${app.pix.bb.client-secret}") String clientSecret,
            @Value("${app.pix.bb.chave}") String chavePix,
            @Value("${app.pix.bb.valor-mensal}") BigDecimal valorMensal,
            @Value("${app.pix.bb.expiracao-segundos}") int expiracaoSegundos) {
        this.assinaturas = assinaturas;
        this.http = construtorHttp.build();
        this.appKey = appKey;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.chavePix = chavePix;
        this.valorMensal = valorMensal.setScale(2);
        this.expiracaoSegundos = expiracaoSegundos;
        boolean producao = "producao".equalsIgnoreCase(ambiente)
                || "production".equalsIgnoreCase(ambiente);
        this.oauthUrl = producao
                ? "https://oauth.bb.com.br/oauth/token"
                : "https://oauth.hm.bb.com.br/oauth/token";
        this.apiUrl = producao
                ? "https://api.bb.com.br/pix/v2"
                : "https://api.hm.bb.com.br/pix/v2";
    }

    public RespostaCobrancaPix gerar(Usuario usuario) {
        validarConfiguracao();
        String txid = gerarTxid();
        JsonNode resposta = chamarBb(
                HttpMethod.PUT,
                "/cob/" + txid,
                Map.of(
                        "calendario", Map.of("expiracao", expiracaoSegundos),
                        "valor", Map.of("original", valorMensal.toPlainString()),
                        "chave", chavePix,
                        "solicitacaoPagador", "Assinatura mensal CredUp"));
        String copiaECola = textoObrigatorio(resposta, "pixCopiaECola");
        String status = resposta.path("status").asText("ATIVA");
        assinaturas.registrarCobrancaPix(usuario, txid, valorMensal);
        return new RespostaCobrancaPix(
                valorMensal,
                txid,
                "Banco do Brasil",
                copiaECola,
                gerarQrCode(copiaECola),
                Instant.now(),
                status,
                expiracaoSegundos,
                "A assinatura será ativada somente após a confirmação do Banco do Brasil."  );
    }

    public RespostaStatusPix consultar(Usuario usuario, String txid) {
        validarTxid(txid);
        var assinatura = assinaturas.validarCobrancaDoUsuario(usuario, txid);
        if (assinatura.getPixPagoEm() != null) {
            return new RespostaStatusPix(txid, "CONCLUIDA", true, assinatura.getPixPagoEm());
        }
        JsonNode resposta = chamarBb(HttpMethod.GET, "/cob/" + txid, null);
        String status = resposta.path("status").asText("DESCONHECIDO");
        boolean pago = "CONCLUIDA".equalsIgnoreCase(status);
        Instant confirmadoEm = pago
                ? assinaturas.confirmarPagamentoPix(usuario, txid)
                : null;
        return new RespostaStatusPix(txid, status, pago, confirmadoEm);
    }

    private JsonNode chamarBb(HttpMethod metodo, String caminho, Object corpo) {
        try {
            String url = UriComponentsBuilder
                    .fromUriString(apiUrl + caminho)
                    .queryParam("gw-dev-app-key", appKey)
                    .build()
                    .encode()
                    .toUriString();
            var requisicao = http.method(metodo)
                    .uri(url)
                    .headers(cabecalhos -> cabecalhos.setBearerAuth(obterToken()))
                    .accept(MediaType.APPLICATION_JSON);
            if (corpo != null) {
                requisicao.contentType(MediaType.APPLICATION_JSON).body(corpo);
            }
            JsonNode resposta = requisicao.retrieve().body(JsonNode.class);
            if (resposta == null) {
                throw new ExcecaoApi(HttpStatus.BAD_GATEWAY, "O Banco do Brasil retornou uma resposta vazia");
            }
            return resposta;
        } catch (RestClientResponseException erro) {
            throw new ExcecaoApi(
                    HttpStatus.BAD_GATEWAY,
                    "O Banco do Brasil não aceitou a operação Pix (código "
                            + erro.getStatusCode().value()
                            + ")");
        }
    }

    private synchronized String obterToken() {
        if (tokenEmCache != null && Instant.now().isBefore(tokenExpiraEm)) {
            return tokenEmCache;
        }
        try {
            JsonNode resposta = http.post()
                    .uri(oauthUrl)
                    .headers(cabecalhos -> cabecalhos.setBasicAuth(clientId, clientSecret))
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .accept(MediaType.APPLICATION_JSON)
                    .body("grant_type=client_credentials&scope=cob.write%20cob.read%20pix.read")
                    .retrieve()
                    .body(JsonNode.class);
            if (resposta == null || resposta.path("access_token").asText().isBlank()) {
                throw new ExcecaoApi(HttpStatus.BAD_GATEWAY, "O Banco do Brasil não forneceu o token de acesso");
            }
            tokenEmCache = resposta.path("access_token").asText();
            long validade = resposta.path("expires_in").asLong(300);
            tokenExpiraEm = Instant.now().plusSeconds(Math.max(30, validade - 30));
            return tokenEmCache;
        } catch (RestClientResponseException erro) {
            throw new ExcecaoApi(
                    HttpStatus.BAD_GATEWAY,
                    "Não foi possível autenticar a integração Pix no Banco do Brasil");
        }
    }

    private void validarConfiguracao() {
        if (appKey.isBlank() || clientId.isBlank() || clientSecret.isBlank() || chavePix.isBlank()) {
            throw new ExcecaoApi(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "A integração Pix ainda não foi configurada");
        }
    }

    private String gerarTxid() {
        return "CREDUP" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
    }

    private void validarTxid(String txid) {
        if (txid == null || !txid.matches("[A-Za-z0-9]{26,35}")) {
            throw new ExcecaoApi(HttpStatus.BAD_REQUEST, "Identificador Pix inválido");
        }
    }

    private String textoObrigatorio(JsonNode resposta, String campo) {
        String valor = resposta.path(campo).asText();
        if (valor.isBlank()) {
            throw new ExcecaoApi(HttpStatus.BAD_GATEWAY, "O Banco do Brasil não retornou o Pix Copia e Cola");
        }
        return valor;
    }

    private String gerarQrCode(String payload) {
        try {
            var matriz = new QRCodeWriter().encode(payload, BarcodeFormat.QR_CODE, 360, 360);
            var saida = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matriz, "PNG", saida);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(saida.toByteArray());
        } catch (Exception erro) {
            throw new ExcecaoApi(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível gerar o QR Code Pix");
        }
    }
}
