package br.com.credup.billing.api;

import br.com.credup.billing.api.DtosAssinatura.RespostaAssinatura;
import br.com.credup.billing.application.ServicoAssinatura;
import br.com.credup.identity.domain.Usuario;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/assinaturas")
public class ControladorAssinatura {
    private final ServicoAssinatura servico;
    private final br.com.credup.billing.application.ServicoCobrancaPix cobrancasPix;

    public ControladorAssinatura(
            ServicoAssinatura servico,
            br.com.credup.billing.application.ServicoCobrancaPix cobrancasPix) {
        this.servico = servico;
        this.cobrancasPix = cobrancasPix;
    }

    @PostMapping("/minha/cobranca-pix")
    @PreAuthorize("hasRole('MERCHANT_OWNER')")
    DtosPix.RespostaCobrancaPix gerarCobrancaPix(
            @AuthenticationPrincipal Usuario usuario) {
        return cobrancasPix.gerar(usuario);
    }

    @GetMapping("/minha/cobranca-pix/{txid}")
    @PreAuthorize("hasRole('MERCHANT_OWNER')")
    DtosPix.RespostaStatusPix consultarCobrancaPix(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable String txid) {
        return cobrancasPix.consultar(usuario, txid);
    }

    @GetMapping("/minha")
    @PreAuthorize("hasRole('MERCHANT_OWNER')")
    RespostaAssinatura minha(@AuthenticationPrincipal Usuario usuario) {
        return servico.minha(usuario);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN_REDE')")
    List<RespostaAssinatura> listar() {
        return servico.listarTodas();
    }

    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasRole('ADMIN_REDE')")
    RespostaAssinatura cancelar(
            @AuthenticationPrincipal Usuario administrador,
            @PathVariable UUID id) {
        return servico.cancelar(administrador, id);
    }
}
