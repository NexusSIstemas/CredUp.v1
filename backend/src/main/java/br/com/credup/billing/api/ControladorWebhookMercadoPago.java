package br.com.credup.billing.api;

import br.com.credup.billing.application.ServicoCobrancaPix;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/webhooks/mercado-pago")
public class ControladorWebhookMercadoPago {
    private final ServicoCobrancaPix cobrancasPix;

    public ControladorWebhookMercadoPago(ServicoCobrancaPix cobrancasPix) {
        this.cobrancasPix = cobrancasPix;
    }

    @PostMapping
    ResponseEntity<Void> receber(
            @RequestHeader("x-signature") String assinatura,
            @RequestHeader("x-request-id") String identificadorRequisicao,
            @RequestParam(name = "data.id") String idOrdem,
            @RequestParam String type) {
        cobrancasPix.processarWebhook(
                assinatura,
                identificadorRequisicao,
                idOrdem,
                type);
        return ResponseEntity.ok().build();
    }
}
