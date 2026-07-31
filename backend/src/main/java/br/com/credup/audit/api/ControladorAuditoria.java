package br.com.credup.audit.api;

import br.com.credup.audit.application.ServicoAuditoria;
import br.com.credup.audit.application.ServicoAuditoria.RespostaRegistroAuditoria;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/auditoria")
@PreAuthorize("hasRole('ADMIN_REDE')")
public class ControladorAuditoria {
    private final ServicoAuditoria servico;

    public ControladorAuditoria(ServicoAuditoria servico) {
        this.servico = servico;
    }

    @GetMapping
    List<RespostaRegistroAuditoria> listar(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            Instant desde) {
        return servico.listar(desde);
    }
}
