package br.com.credup.defaults.api;

import br.com.credup.defaults.api.DtosInadimplencia.*;
import br.com.credup.defaults.application.ServicoInadimplencia;
import br.com.credup.identity.domain.Usuario;
import br.com.credup.shared.domain.StatusDivida;
import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@PreAuthorize("hasAnyRole('ADMIN_REDE','MERCHANT_OWNER','MERCHANT_STAFF')")
public class ControladorInadimplencia {
    private final ServicoInadimplencia service;
    public ControladorInadimplencia(ServicoInadimplencia service) {
        this.service = service;
    }

    @PostMapping("/debts")
    @PreAuthorize("hasRole('MERCHANT_OWNER')")
    ResponseEntity<RespostaDivida> create(@AuthenticationPrincipal Usuario user,
                                        @Valid @RequestBody SolicitacaoCriacaoDivida request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(user, request));
    }

    @GetMapping("/defaults")
    Page<RespostaDivida> list(@AuthenticationPrincipal Usuario user,
                            @RequestParam(required = false) String cpf,
                            @RequestParam(required = false) UUID commerceId,
                            @RequestParam(required = false) StatusDivida status,
                            @RequestParam(required = false) BigDecimal minValue,
                            @RequestParam(required = false) BigDecimal maxValue,
                            @PageableDefault(size = 20, sort = "dateValue", direction = Sort.Direction.DESC)
                            Pageable pageable) {
        return service.list(user, cpf, commerceId, status, minValue, maxValue, pageable);
    }

    @PostMapping("/get_inadimplentes")
    Page<RespostaDivida> searchNetwork(@AuthenticationPrincipal Usuario user,
            @Valid @RequestBody(required = false) SolicitacaoBuscaRede request,
            @PageableDefault(size = 20, sort = "dateValue", direction = Sort.Direction.DESC)
            Pageable pageable) {
        String busca = request == null ? null : request.busca();
        return service.list(user, busca, null, null, null, null, pageable);
    }

    @GetMapping("/clients/{id}")
    DetalhesCliente detail(@AuthenticationPrincipal Usuario user, @PathVariable UUID id) {
        return service.clientDetail(user, id);
    }

    @PatchMapping("/debts/{id}/settle")
    @PreAuthorize("hasRole('MERCHANT_OWNER')")
    RespostaDivida settle(@AuthenticationPrincipal Usuario user, @PathVariable UUID id) {
        return service.settle(user, id);
    }
}
