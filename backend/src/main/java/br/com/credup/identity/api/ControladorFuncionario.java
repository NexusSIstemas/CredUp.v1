package br.com.credup.identity.api;

import br.com.credup.identity.api.DtosFuncionario.*;
import br.com.credup.identity.application.ServicoFuncionario;
import br.com.credup.identity.domain.Usuario;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/staff")
@PreAuthorize("hasRole('MERCHANT_OWNER')")
public class ControladorFuncionario {
    private final ServicoFuncionario service;
    public ControladorFuncionario(ServicoFuncionario service) {
        this.service = service;
    }

    @GetMapping
    List<RespostaFuncionario> list(@AuthenticationPrincipal Usuario user) {
        return service.list(user);
    }

    @PostMapping
    RespostaFuncionarioCriado create(@AuthenticationPrincipal Usuario user,
            @Valid @RequestBody SolicitacaoCriacaoFuncionario request) {
        return service.create(user, request);
    }

    @PatchMapping("/{id}/status")
    RespostaFuncionario status(@AuthenticationPrincipal Usuario user, @PathVariable UUID id,
            @RequestBody SolicitacaoStatusFuncionario request) {
        return service.changeStatus(user, id, request);
    }

    @PostMapping("/{id}/reset-password")
    RespostaSenhaFuncionario reset(@AuthenticationPrincipal Usuario user, @PathVariable UUID id) {
        return service.resetSenha(user, id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    void delete(@AuthenticationPrincipal Usuario user, @PathVariable UUID id) {
        service.delete(user, id);
    }
}
