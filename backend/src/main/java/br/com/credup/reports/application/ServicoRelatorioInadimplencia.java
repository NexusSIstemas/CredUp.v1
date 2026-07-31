package br.com.credup.reports.application;

import br.com.credup.audit.domain.RegistroAuditoria;
import br.com.credup.audit.repository.RepositorioRegistroAuditoria;
import br.com.credup.commerce.application.ServicoComercio;
import br.com.credup.defaults.domain.Divida;
import br.com.credup.defaults.repository.RepositorioDivida;
import br.com.credup.identity.domain.Usuario;
import br.com.credup.shared.domain.*;
import br.com.credup.shared.exception.ExcecaoApi;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ServicoRelatorioInadimplencia {
    private static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private final RepositorioDivida dividas;
    private final RepositorioRegistroAuditoria auditoria;
    private final ServicoComercio servicoComercio;
    private final TemplateEngine templates;

    public ServicoRelatorioInadimplencia(
            RepositorioDivida dividas,
            RepositorioRegistroAuditoria auditoria,
            ServicoComercio servicoComercio,
            TemplateEngine templates) {
        this.dividas = dividas;
        this.auditoria = auditoria;
        this.servicoComercio = servicoComercio;
        this.templates = templates;
    }

    @Transactional
    public byte[] gerar(
            Usuario usuario,
            LocalDate dataInicio,
            LocalDate dataFim,
            UUID idComercio,
            StatusDivida status) {
        servicoComercio.exigirComercioAprovadoParaConsulta(usuario);
        validarPeriodo(dataInicio, dataFim);
        validarAcessoAoComercioSelecionado(usuario, idComercio);
        UUID comercioFiltro = idComercio;
        List<Divida> resultado = consultar(
                dataInicio,
                dataFim,
                comercioFiltro,
                status);
        List<LinhaRelatorio> linhas = resultado.stream().map(this::mapear).toList();
        BigDecimal total = resultado.stream()
                .map(Divida::getDividaValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Context contexto = new Context(new Locale("pt", "BR"));
        contexto.setVariable("geradoEm", DATA_HORA.format(LocalDateTime.now(ZoneId.of("America/Sao_Paulo"))));
        contexto.setVariable("geradoPor", usuario.getName() + " " + usuario.getSurname());
        contexto.setVariable("periodo", formatarPeriodo(dataInicio, dataFim));
        contexto.setVariable("statusFiltro", status == null ? "Todos" : rotuloStatus(status));
        contexto.setVariable(
                "comercioFiltro",
                obterComercioFiltro(resultado, comercioFiltro));
        contexto.setVariable("linhas", linhas);
        contexto.setVariable("quantidade", linhas.size());
        contexto.setVariable("total", total);

        String html = templates.process("relatorio-inadimplencias", contexto);
        byte[] pdf = renderizar(html);
        String detalhes = "Gerou relatório de inadimplências; período: "
                + formatarPeriodo(dataInicio, dataFim)
                + "; status: " + (status == null ? "todos" : status)
                + "; quantidade: " + linhas.size();
        auditoria.save(RegistroAuditoria.of(usuario, "GERAR_RELATORIO_INADIMPLENCIAS",
                "Relatorio", usuario.getId(), "Relatório de inadimplências", detalhes));
        return pdf;
    }

    private void validarAcessoAoComercioSelecionado(
            Usuario usuario,
            UUID idComercio) {
        if (usuario.getPerfilAcesso() != PerfilAcesso.MERCHANT_OWNER
                || idComercio == null) {
            return;
        }

        var comercio = servicoComercio.get(idComercio);
        servicoComercio.requireAccess(usuario, comercio);
    }

    private List<Divida> consultar(
            LocalDate dataInicio,
            LocalDate dataFim,
            UUID idComercio,
            StatusDivida status) {
        Specification<Divida> especificacao = (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            if (idComercio != null)
                filtros.add(cb.equal(root.get("commerce").get("id"), idComercio));
            if (dataInicio != null)
                filtros.add(cb.greaterThanOrEqualTo(root.get("dateValue"), dataInicio));
            if (dataFim != null)
                filtros.add(cb.lessThanOrEqualTo(root.get("dateValue"), dataFim));
            if (status != null)
                filtros.add(cb.equal(root.get("status"), status));
            query.orderBy(cb.desc(root.get("dateValue")), cb.asc(root.get("client").get("name")));
            return cb.and(filtros.toArray(Predicate[]::new));
        };
        return dividas.findAll(especificacao);
    }

    private LinhaRelatorio mapear(Divida divida) {
        var cliente = divida.getClient();
        return new LinhaRelatorio(
                cliente.getName() + " " + cliente.getSurname(),
                mascararCpf(cliente.getCpf()),
                divida.getComercio().getComercioName(),
                DATA.format(divida.getDateValue()),
                divida.getDividaValue(),
                rotuloStatus(divida.getStatus()));
    }

    private byte[] renderizar(String html) {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(output);
            builder.run();
            return output.toByteArray();
        } catch (Exception exception) {
            throw new ExcecaoApi(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Não foi possível gerar o relatório em PDF");
        }
    }

    private void validarPeriodo(LocalDate inicio, LocalDate fim) {
        if (inicio == null || fim == null)
            throw new ExcecaoApi(
                    HttpStatus.BAD_REQUEST,
                    "Informe a data inicial e a data final do relatório");
        if (inicio.isAfter(fim))
            throw new ExcecaoApi(HttpStatus.BAD_REQUEST,
                    "A data inicial não pode ser posterior à data final");
    }

    private String formatarPeriodo(LocalDate inicio, LocalDate fim) {
        return DATA.format(inicio) + " até " + DATA.format(fim);
    }

    private String obterComercioFiltro(List<Divida> resultado, UUID idComercio) {
        if (idComercio == null)
            return "Todos";
        return resultado.stream()
                .map(divida -> divida.getComercio().getComercioName())
                .findFirst()
                .orElse("Comércio selecionado sem registros");
    }

    private String mascararCpf(String cpf) {
        return cpf.substring(0, 3) + ".***.***-" + cpf.substring(9);
    }

    private String rotuloStatus(StatusDivida status) {
        return switch (status) {
            case PENDING -> "Pendente";
            case DISPUTED -> "Contestado";
            case NEGOTIATING -> "Em negociação";
            case PARTIALLY_PAID -> "Parcialmente pago";
            case PAID -> "Pago";
            case CANCELED -> "Cancelado";
        };
    }

    public record LinhaRelatorio(
            String cliente,
            String cpf,
            String comercio,
            String data,
            BigDecimal valor,
            String status) {
    }
}
