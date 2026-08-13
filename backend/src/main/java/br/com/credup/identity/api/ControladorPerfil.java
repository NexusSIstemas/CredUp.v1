package br.com.credup.identity.api;

import br.com.credup.identity.api.DtosPerfil.*;
import br.com.credup.identity.application.ServicoPerfil;
import br.com.credup.identity.domain.Usuario;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ControladorPerfil {
    private final ServicoPerfil service;
    public ControladorPerfil(ServicoPerfil service) {
        this.service = service;
    }

    @GetMapping
    RespostaPerfil get(@AuthenticationPrincipal Usuario user) {
        return service.get(user);
    }

    @PatchMapping
    RespostaPerfil update(@AuthenticationPrincipal Usuario user,
            @Valid @RequestBody SolicitacaoAtualizacaoPerfil request) {
        return service.update(user, request);
    }


    @PutMapping("/recovery-pin")
    RespostaPerfil configurarPin(@AuthenticationPrincipal Usuario user,
            @Valid @RequestBody SolicitacaoPinRecuperacao request) {
        return service.configurarPin(user, request);
    }
}
