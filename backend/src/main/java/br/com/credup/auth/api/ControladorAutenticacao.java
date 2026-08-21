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
import jakarta.servlet.http.*;
import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
public class ControladorAutenticacao {
    private final ServicoAutenticacao service;
    private final boolean cookieSeguro;
    public ControladorAutenticacao(ServicoAutenticacao service,
            @org.springframework.beans.factory.annotation.Value("${app.jwt.refresh-cookie-secure}") boolean cookieSeguro) {
        this.service = service;
        this.cookieSeguro = cookieSeguro;
    }

    @PostMapping("/register")
    ResponseEntity<RespostaAutenticacao> register(@Valid @RequestBody SolicitacaoCadastro request) {
        return resposta(service.register(request), HttpStatus.CREATED);
    }
    @PostMapping("/login")
    ResponseEntity<RespostaAutenticacao> login(@Valid @RequestBody SolicitacaoEntrada request) {
        return resposta(service.login(request), HttpStatus.OK);
    }

    @PostMapping("/refresh")
    ResponseEntity<RespostaAutenticacao> refresh(
            @CookieValue(name = "credup_refresh", required = false) String refreshToken) {
        return resposta(service.atualizarSessao(refreshToken), HttpStatus.OK);
    }

    @PostMapping("/logout")
    ResponseEntity<Void> logout(
            @CookieValue(name = "credup_refresh", required = false) String refreshToken) {
        service.sair(refreshToken);
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, limparCookie().toString()).build();
    }

    @PostMapping("/forgot-password")
    RespostaMensagem recuperarSenha(@Valid @RequestBody SolicitacaoRecuperacaoSenha request) {
        return service.solicitarRedefinicao(request);
    }

    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<RespostaAutenticacao> alterarSenha(@AuthenticationPrincipal Usuario user,
                                @Valid @RequestBody SolicitacaoAlteracaoSenha request) {
        return resposta(service.alterarSenha(user, request), HttpStatus.OK);
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

    private ResponseEntity<RespostaAutenticacao> resposta(
            ServicoAutenticacao.ResultadoAutenticacao resultado, HttpStatus status) {
        Duration duracao = Duration.between(java.time.Instant.now(), resultado.refreshToken().expiraEm());
        var cookie = ResponseCookie.from("credup_refresh", resultado.refreshToken().valor())
                .httpOnly(true).secure(cookieSeguro).sameSite("Strict")
                .path("/api/auth").maxAge(duracao).build();
        return ResponseEntity.status(status).header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(resultado.resposta());
    }

    private ResponseCookie limparCookie() {
        return ResponseCookie.from("credup_refresh", "").httpOnly(true).secure(cookieSeguro)
                .sameSite("Strict").path("/api/auth").maxAge(Duration.ZERO).build();
    }
}
