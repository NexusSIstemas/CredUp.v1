package br.com.credup.reports.api;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.credup.identity.domain.Usuario;
import br.com.credup.billing.application.ServicoAssinatura;
import br.com.credup.reports.application.ServicoRelatorioInadimplencia;
import br.com.credup.shared.domain.StatusDivida;

@RestController
@RequestMapping("/api/relatorios")
public class ControladorRelatorio {
    private final ServicoRelatorioInadimplencia servico;
    private final ServicoAssinatura assinaturas;

    public ControladorRelatorio(ServicoRelatorioInadimplencia servico, ServicoAssinatura assinaturas) {
        this.servico = servico;
        this.assinaturas = assinaturas;
    }

    @GetMapping(value = "/inadimplencias.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN_REDE','MERCHANT_OWNER')")
    ResponseEntity<byte[]> gerarInadimplencias(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataInicio, @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataFim,
            @RequestParam(required = false) UUID idComercio,
            @RequestParam(required = false) StatusDivida status) {
        assinaturas.exigirRelatorio(usuario);
        byte[] pdf = servico.gerar(usuario, dataInicio, dataFim, idComercio, status);
        String nome = "relatorio-inadimplencias-" + LocalDate.now(ZoneId.of("America/Sao_Paulo")) + ".pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nome + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdf.length)
                .body(pdf);
    }
}
