package br.com.credup.billing.application;

import br.com.credup.shared.exception.ExcecaoApi;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class ServicoCobrancaPixTest {
    private static final String SEGREDO = "segredo-webhook-teste";
    private static final String ID_ORDEM = "ORD12345678901234567890";
    private static final String ID_REQUISICAO = "request-123";

    @Test
    void rejeitaWebhookComAssinaturaInvalida() {
        var assinaturas = mock(ServicoAssinatura.class);
        var servico = criarServico(assinaturas, RestClient.builder());

        var erro = assertThrows(
                ExcecaoApi.class,
                () -> servico.processarWebhook(
                        "ts=1,v1=invalida",
                        ID_REQUISICAO,
                        ID_ORDEM,
                        "order"));

        assertEquals(401, erro.getStatus().value());
        verifyNoInteractions(assinaturas);
    }

    @Test
    void ignoraOrdemQueNaoPertenceAoCredup() throws Exception {
        var assinaturas = mock(ServicoAssinatura.class);
        when(assinaturas.obterValorCobrancaPix(ID_ORDEM))
                .thenReturn(Optional.empty());
        var servico = criarServico(assinaturas, RestClient.builder());

        servico.processarWebhook(
                gerarAssinatura(),
                ID_REQUISICAO,
                ID_ORDEM,
                "order");

        verify(assinaturas).obterValorCobrancaPix(ID_ORDEM);
        verifyNoMoreInteractions(assinaturas);
    }

    @Test
    void ativaAssinaturaSomenteAposPagamentoPixAcreditado() throws Exception {
        var assinaturas = mock(ServicoAssinatura.class);
        when(assinaturas.obterValorCobrancaPix(ID_ORDEM))
                .thenReturn(Optional.of(new java.math.BigDecimal("39.90")));
        var construtor = RestClient.builder();
        var servidor = MockRestServiceServer.bindTo(construtor).build();
        servidor.expect(once(), requestTo("https://api.mercadopago.com/v1/orders/" + ID_ORDEM))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(respostaPaga(), MediaType.APPLICATION_JSON));
        var servico = criarServico(assinaturas, construtor);

        servico.processarWebhook(
                gerarAssinatura(),
                ID_REQUISICAO,
                ID_ORDEM,
                "order");

        servidor.verify();
        verify(assinaturas).confirmarPagamentoPixPorWebhook(ID_ORDEM);
    }

    private ServicoCobrancaPix criarServico(
            ServicoAssinatura assinaturas,
            RestClient.Builder construtor) {
        var configuracao = mock(br.com.credup.billing.domain.ConfiguracaoSistema.class);
        when(configuracao.getValorMensal())
                .thenReturn(new java.math.BigDecimal("39.90"));
        var configuracoes = mock(ServicoConfiguracaoSistema.class);
        when(configuracoes.obter()).thenReturn(configuracao);
        return new ServicoCobrancaPix(
                assinaturas,
                configuracoes,
                construtor,
                "sandbox",
                "APP_USR-token-teste",
                3600,
                "https://api.mercadopago.com",
                SEGREDO);
    }

    private String gerarAssinatura() throws Exception {
        String timestamp = String.valueOf(Instant.now().getEpochSecond());
        String manifesto = "id:" + ID_ORDEM
                + ";request-id:" + ID_REQUISICAO
                + ";ts:" + timestamp
                + ";";
        Mac hmac = Mac.getInstance("HmacSHA256");
        hmac.init(new SecretKeySpec(
                SEGREDO.getBytes(StandardCharsets.UTF_8),
                "HmacSHA256"));
        String hash = HexFormat.of().formatHex(
                hmac.doFinal(manifesto.getBytes(StandardCharsets.UTF_8)));
        return "ts=" + timestamp + ",v1=" + hash;
    }

    private String respostaPaga() {
        return """
                {
                  "id": "ORD12345678901234567890",
                  "status": "processed",
                  "status_detail": "accredited",
                  "total_amount": "39.90",
                  "transactions": {
                    "payments": [
                      {
                        "payment_method": {
                          "id": "pix"
                        }
                      }
                    ]
                  }
                }
                """;
    }
}
