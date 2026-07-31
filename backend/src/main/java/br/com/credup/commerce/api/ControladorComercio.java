package br.com.credup.commerce.api;

import br.com.credup.commerce.application.ServicoComercio;
import br.com.credup.commerce.api.DtosComercio.*;
import br.com.credup.identity.domain.Usuario;
import br.com.credup.shared.domain.StatusComercio;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/commerces")
public class ControladorComercio {
    private final ServicoComercio service;
    public ControladorComercio(ServicoComercio service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasRole('MERCHANT_OWNER')")
    ResponseEntity<RespostaComercio> create(@AuthenticationPrincipal Usuario user,
                                             @Valid @RequestBody SolicitacaoCriacaoComercio request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(user, request));
    }
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN_REDE','MERCHANT_OWNER')")
    List<RespostaComercio> list(@AuthenticationPrincipal Usuario user,
                                @RequestParam(required = false) StatusComercio status) {
        return service.list(user, status);
    }
    @PatchMapping("/{id}/review")
    @PreAuthorize("hasRole('ADMIN_REDE')")
    RespostaComercio review(@AuthenticationPrincipal Usuario user, @PathVariable UUID id,
            @Valid @RequestBody SolicitacaoRevisao request) {
        return service.review(user, id, request);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('MERCHANT_OWNER')")
    RespostaComercio update(@AuthenticationPrincipal Usuario user, @PathVariable UUID id,
            @Valid @RequestBody SolicitacaoAtualizacaoComercio request) {
        return service.update(user, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('MERCHANT_OWNER')")
    void delete(@AuthenticationPrincipal Usuario user, @PathVariable UUID id) {
        service.delete(user, id);
    }
}
