package br.com.credup.auth.api;

import br.com.credup.auth.application.ServicoAutenticacao;
import br.com.credup.auth.api.DtosAutenticacao.*;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import br.com.credup.identity.domain.Usuario;
import java.util.*;

@RestController
@RequestMapping("/api/auth")
public class ControladorAutenticacao {
    private final ServicoAutenticacao service;
    public ControladorAutenticacao(ServicoAutenticacao service) {
        this.service = service;
    }

    @PostMapping("/register")
    ResponseEntity<RespostaAutenticacao> register(@Valid @RequestBody SolicitacaoCadastro request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.register(request));
    }
    @PostMapping("/login")
    RespostaAutenticacao login(@Valid @RequestBody SolicitacaoEntrada request) {
        return service.login(request);
    }

    @PostMapping("/forgot-password")
    RespostaMensagem recuperarSenha(@Valid @RequestBody SolicitacaoRecuperacaoSenha request) {
        return service.solicitarRedefinicao(request);
    }

    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    RespostaAutenticacao alterarSenha(@AuthenticationPrincipal Usuario user,
                                @Valid @RequestBody SolicitacaoAlteracaoSenha request) {
        return service.alterarSenha(user, request);
    }

    @GetMapping("/password-resets")
    @PreAuthorize("hasRole('ADMIN_REDE')")
    List<RespostaSolicitacaoRedefinicao> redefinicoesPendentes() {
        return service.redefinicoesPendentes();
    }

    @PostMapping("/password-resets/{id}/approve")
    @PreAuthorize("hasRole('ADMIN_REDE')")
    RespostaDecisaoRedefinicao approve(@PathVariable UUID id) {
        return service.aprovarRedefinicao(id);
    }

    @PostMapping("/password-resets/{id}/reject")
    @PreAuthorize("hasRole('ADMIN_REDE')")
    ResponseEntity<Void> reject(@PathVariable UUID id) {
        service.rejeitarRedefinicao(id);
        return ResponseEntity.noContent().build();
    }
}
