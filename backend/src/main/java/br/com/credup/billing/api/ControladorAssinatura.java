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

    public ControladorAssinatura(ServicoAssinatura servico) {
        this.servico = servico;
    }

    @GetMapping("/minha")
    @PreAuthorize("hasAnyRole('MERCHANT_OWNER','MERCHANT_STAFF')")
    RespostaAssinatura minha(@AuthenticationPrincipal Usuario usuario) {
        return servico.minha(usuario);
    }

    @PostMapping("/minha/solicitar-ativacao")
    @PreAuthorize("hasRole('MERCHANT_OWNER')")
    RespostaAssinatura solicitar(@AuthenticationPrincipal Usuario usuario) {
        return servico.solicitarAtivacao(usuario);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN_REDE')")
    List<RespostaAssinatura> listar() {
        return servico.listarTodas();
    }

    @PatchMapping("/{id}/ativar")
    @PreAuthorize("hasRole('ADMIN_REDE')")
    RespostaAssinatura ativar(
            @AuthenticationPrincipal Usuario administrador,
            @PathVariable UUID id) {
        return servico.ativar(administrador, id);
    }

    @PatchMapping("/{id}/renovar")
    @PreAuthorize("hasRole('ADMIN_REDE')")
    RespostaAssinatura renovar(
            @AuthenticationPrincipal Usuario administrador,
            @PathVariable UUID id) {
        return servico.renovar(administrador, id);
    }

    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasRole('ADMIN_REDE')")
    RespostaAssinatura cancelar(
            @AuthenticationPrincipal Usuario administrador,
            @PathVariable UUID id) {
        return servico.cancelar(administrador, id);
    }
}
