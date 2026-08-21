package br.com.credup.billing.application;

import br.com.credup.audit.domain.RegistroAuditoria;
import br.com.credup.audit.repository.RepositorioRegistroAuditoria;
import br.com.credup.billing.api.DtosAssinatura.RespostaAssinatura;
import br.com.credup.billing.api.DtosAssinatura.RespostaPagamentoAssinatura;
import br.com.credup.billing.domain.*;
import br.com.credup.billing.repository.RepositorioAssinatura;
import br.com.credup.billing.repository.RepositorioPagamentoAssinatura;
import br.com.credup.identity.domain.*;
import br.com.credup.shared.domain.PerfilAcesso;
import br.com.credup.shared.exception.ExcecaoApi;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.math.BigDecimal;
import java.util.*;

@Service
public class ServicoAssinatura {
    private final RepositorioAssinatura assinaturas;
    private final RepositorioPagamentoAssinatura pagamentos;
    private final RepositorioRegistroAuditoria auditoria;
    private final ServicoConfiguracaoSistema configuracoes;

    public ServicoAssinatura(
            RepositorioAssinatura assinaturas,
            RepositorioPagamentoAssinatura pagamentos,
            RepositorioRegistroAuditoria auditoria,
            ServicoConfiguracaoSistema configuracoes) {
        this.assinaturas = assinaturas;
        this.pagamentos = pagamentos;
        this.auditoria = auditoria;
        this.configuracoes = configuracoes;
    }

    @Transactional
    public void criarPara(Comerciante comerciante) {
        if (assinaturas.findByComercianteId(comerciante.getId()).isPresent()) {
            return;
        }
        var assinatura = new Assinatura();
        assinatura.setComerciante(comerciante);
        assinatura.setPlano(PlanoAssinatura.PROFISSIONAL);
        assinatura.setStatus(StatusAssinatura.AGUARDANDO_APROVACAO);
        assinaturas.save(assinatura);
    }

    @Transactional
    public void liberarPagamento(Comerciante comerciante) {
        var assinatura = obterPorComerciante(comerciante);
        if (assinatura.getStatus() != StatusAssinatura.AGUARDANDO_APROVACAO) {
            return;
        }
        assinatura.setPlano(PlanoAssinatura.PROFISSIONAL);
        assinatura.setStatus(StatusAssinatura.AGUARDANDO_PAGAMENTO);
    }

    @Transactional
    public RespostaAssinatura minha(Usuario usuario) {
        var assinatura = obterDoUsuario(usuario);
        atualizarStatus(assinatura);
        return mapear(assinatura);
    }

    @Transactional
    public List<RespostaAssinatura> listarTodas() {
        return assinaturas.findAllByOrderByCreatedAtDesc().stream()
                .peek(this::atualizarStatus)
                .map(this::mapear)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RespostaPagamentoAssinatura> listarMeuHistorico(Usuario usuario) {
        var assinatura = obterDoUsuario(usuario);
        return pagamentos.findByAssinaturaIdOrderByPagoEmDesc(assinatura.getId())
                .stream()
                .map(this::mapearPagamento)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RespostaPagamentoAssinatura> listarHistoricoCompleto() {
        return pagamentos.findAllByOrderByPagoEmDesc()
                .stream()
                .map(this::mapearPagamento)
                .toList();
    }

    @Transactional
    public Assinatura registrarCobrancaPix(
            Usuario usuario,
            String txid,
            BigDecimal valor) {
        if (usuario.getPerfilAcesso() != PerfilAcesso.MERCHANT_OWNER) {
            throw new ExcecaoApi(HttpStatus.FORBIDDEN, "Somente o dono pode gerar a cobrança Pix");
        }
        var assinatura = obterDoUsuario(usuario);
        atualizarStatus(assinatura);
        if (assinatura.getStatus() == StatusAssinatura.AGUARDANDO_APROVACAO) {
            throw new ExcecaoApi(
                    HttpStatus.FORBIDDEN,
                    "A cobrança estará disponível após a aprovação do primeiro comércio");
        }
        assinatura.setPixTxid(txid);
        assinatura.setPixStatus("ATIVA");
        assinatura.setPixValor(valor);
        assinatura.setPixCriadoEm(Instant.now());
        assinatura.setPixPagoEm(null);
        assinatura.setSolicitacaoAtivacaoEm(Instant.now());
        auditoria.save(RegistroAuditoria.of(
                usuario,
                "GERAR_COBRANCA_PIX",
                "Assinatura",
                assinatura.getId(),
                nomeComerciante(assinatura),
                "Gerou cobrança Pix para o plano profissional"));
        return assinatura;
    }

    @Transactional(readOnly = true)
    public Assinatura validarCobrancaDoUsuario(Usuario usuario, String txid) {
        var assinatura = obterDoUsuario(usuario);
        if (!Objects.equals(assinatura.getPixTxid(), txid)) {
            throw new ExcecaoApi(HttpStatus.NOT_FOUND, "Cobrança Pix não encontrada");
        }
        return assinatura;
    }

    @Transactional
    public Instant confirmarPagamentoPix(Usuario usuario, String txid) {
        var assinatura = obterDoUsuario(usuario);
        if (!Objects.equals(assinatura.getPixTxid(), txid)) {
            throw new ExcecaoApi(HttpStatus.NOT_FOUND, "Cobrança Pix não encontrada");
        }
        return confirmarPagamentoPix(assinatura, usuario);
    }

    @Transactional
    public void confirmarPagamentoPixPorWebhook(String txid) {
        assinaturas.findByPixTxid(txid).ifPresent(assinatura ->
                confirmarPagamentoPix(assinatura, assinatura.getComerciante()));
    }

    @Transactional(readOnly = true)
    public Optional<BigDecimal> obterValorCobrancaPix(String txid) {
        return assinaturas.findByPixTxid(txid)
                .map(Assinatura::getPixValor);
    }

    private Instant confirmarPagamentoPix(Assinatura assinatura, Usuario usuario) {
        if (assinatura.getPixPagoEm() != null) {
            return assinatura.getPixPagoEm();
        }

        var hoje = LocalDate.now();
        var confirmadoEm = Instant.now();
        assinatura.setPlano(PlanoAssinatura.PROFISSIONAL);
        assinatura.setStatus(StatusAssinatura.ATIVA);
        if (assinatura.getInicioAssinatura() == null) {
            assinatura.setInicioAssinatura(hoje);
        }
        atualizarCicloCobranca(assinatura, hoje);
        assinatura.setSolicitacaoAtivacaoEm(null);
        assinatura.setCanceladaEm(null);
        assinatura.setPixStatus("CONCLUIDA");
        assinatura.setPixPagoEm(confirmadoEm);
        registrarPagamentoConfirmado(assinatura, confirmadoEm);
        auditoria.save(RegistroAuditoria.of(
                usuario,
                "CONFIRMAR_PAGAMENTO_PIX",
                "Assinatura",
                assinatura.getId(),
                nomeComerciante(assinatura),
                "Pagamento Pix confirmado pelo Mercado Pago; assinatura ativada por um ciclo mensal"));
        return confirmadoEm;
    }

    private void registrarPagamentoConfirmado(
            Assinatura assinatura,
            Instant confirmadoEm) {
        if (pagamentos.existsByReferenciaExterna(assinatura.getPixTxid())) {
            return;
        }
        var pagamento = new PagamentoAssinatura();
        pagamento.setAssinatura(assinatura);
        pagamento.setReferenciaExterna(assinatura.getPixTxid());
        pagamento.setValor(assinatura.getPixValor());
        pagamento.setPagoEm(confirmadoEm);
        pagamento.setAcessoValidoAte(assinatura.getProximaCobranca());
        pagamentos.save(pagamento);
    }

    private void atualizarCicloCobranca(Assinatura assinatura, LocalDate pagamentoEm) {
        int diasToleranciaPagamento = configuracoes.obter()
                .getDiasToleranciaPagamento();
        var vencimentoAtual = assinatura.getProximaCobranca();
        boolean renovacaoDentroDaTolerancia = vencimentoAtual != null
                && !pagamentoEm.isAfter(vencimentoAtual.plusDays(diasToleranciaPagamento));

        if (assinatura.getDiaCobranca() == null || !renovacaoDentroDaTolerancia) {
            assinatura.setDiaCobranca(pagamentoEm.getDayOfMonth());
        }

        var mesBase = renovacaoDentroDaTolerancia
                ? YearMonth.from(vencimentoAtual)
                : YearMonth.from(pagamentoEm);
        assinatura.setProximaCobranca(calcularVencimento(
                mesBase.plusMonths(1),
                assinatura.getDiaCobranca()));
    }

    static LocalDate calcularVencimento(YearMonth mes, int diaCobranca) {
        return mes.atDay(Math.min(diaCobranca, mes.lengthOfMonth()));
    }

    @Transactional
    public RespostaAssinatura cancelar(Usuario administrador, UUID id) {
        var assinatura = obter(id);
        assinatura.setStatus(StatusAssinatura.CANCELADA);
        assinatura.setCanceladaEm(Instant.now());
        assinatura.setSolicitacaoAtivacaoEm(null);
        auditoria.save(RegistroAuditoria.of(
                administrador,
                "CANCELAR_ASSINATURA",
                "Assinatura",
                assinatura.getId(),
                nomeComerciante(assinatura),
                "Cancelou a assinatura do comerciante"));
        return mapear(assinatura);
    }

    @Transactional
    public void exigirAcessoOperacional(Usuario usuario) {
        if (usuario.getPerfilAcesso() == PerfilAcesso.ADMIN_REDE) {
            return;
        }
        var assinatura = obterDoUsuario(usuario);
        atualizarStatus(assinatura);
        if (!temAcessoOperacional(assinatura)) {
            throw new ExcecaoApi(
                    HttpStatus.FORBIDDEN,
                    "Pagamento pendente. Quite a assinatura para continuar usando o CredUp");
        }
    }

    @Transactional
    public void exigirGerenciamentoComercio(Usuario usuario) {
        if (usuario.getPerfilAcesso() == PerfilAcesso.ADMIN_REDE) {
            return;
        }
        var assinatura = obterDoUsuario(usuario);
        atualizarStatus(assinatura);
        if (!temAcessoOperacional(assinatura)) {
            throw new ExcecaoApi(
                    HttpStatus.FORBIDDEN,
                    "Ative o plano profissional para gerenciar seus comércios");
        }
    }

    @Transactional
    public void exigirRelatorio(Usuario usuario) {
        if (usuario.getPerfilAcesso() == PerfilAcesso.ADMIN_REDE) {
            return;
        }
        var assinatura = obterDoUsuario(usuario);
        atualizarStatus(assinatura);
        if (!temAcessoOperacional(assinatura)) {
            throw new ExcecaoApi(
                    HttpStatus.FORBIDDEN,
                    "Relatórios em PDF estão disponíveis somente no plano pago");
        }
    }

    @Scheduled(cron = "0 0 * * * *", zone = "America/Sao_Paulo")
    @Transactional
    public void atualizarAssinaturasVencidas() {
        assinaturas.findAll().forEach(this::atualizarStatus);
    }

    private Assinatura obterDoUsuario(Usuario usuario) {
        Comerciante comerciante = usuario instanceof FuncionarioComercio funcionario
                ? funcionario.getResponsavel()
                : usuario instanceof Comerciante dono
                        ? dono
                        : null;
        if (comerciante == null) {
            throw new ExcecaoApi(HttpStatus.FORBIDDEN, "Este perfil não possui assinatura comercial");
        }
        return obterPorComerciante(comerciante);
    }

    private Assinatura obterPorComerciante(Comerciante comerciante) {
        return assinaturas.findByComercianteId(comerciante.getId())
                .orElseGet(() -> {
                    var assinatura = new Assinatura();
                    assinatura.setComerciante(comerciante);
                    assinatura.setPlano(PlanoAssinatura.PROFISSIONAL);
                    assinatura.setStatus(StatusAssinatura.AGUARDANDO_APROVACAO);
                    return assinaturas.save(assinatura);
                });
    }

    private Assinatura obter(UUID id) {
        return assinaturas.findById(id)
                .orElseThrow(() -> new ExcecaoApi(HttpStatus.NOT_FOUND, "Assinatura não encontrada"));
    }

    private void atualizarStatus(Assinatura assinatura) {
        int diasToleranciaPagamento = configuracoes.obter()
                .getDiasToleranciaPagamento();
        var hoje = LocalDate.now();
        if (assinatura.getStatus() == StatusAssinatura.ATIVA
                && assinatura.getProximaCobranca() != null
                && hoje.isAfter(assinatura.getProximaCobranca())) {
            assinatura.setStatus(StatusAssinatura.AGUARDANDO_PAGAMENTO);
        }
        if (assinatura.getStatus() == StatusAssinatura.AGUARDANDO_PAGAMENTO
                && assinatura.getProximaCobranca() != null
                && hoje.isAfter(assinatura.getProximaCobranca()
                        .plusDays(diasToleranciaPagamento))) {
            assinatura.setStatus(StatusAssinatura.ATRASADA);
        }
    }

    private boolean temAcessoOperacional(Assinatura assinatura) {
        if (assinatura.getStatus() == StatusAssinatura.ATIVA) {
            return true;
        }
        return assinatura.getStatus() == StatusAssinatura.AGUARDANDO_PAGAMENTO
                && assinatura.getProximaCobranca() != null
                && !LocalDate.now().isAfter(assinatura.getProximaCobranca()
                        .plusDays(configuracoes.obter()
                                .getDiasToleranciaPagamento()));
    }

    private RespostaAssinatura mapear(Assinatura assinatura) {
        boolean ativa = temAcessoOperacional(assinatura);
        return new RespostaAssinatura(
                assinatura.getId(),
                assinatura.getComerciante().getId(),
                nomeComerciante(assinatura),
                mascararEmail(assinatura.getComerciante().getEmail()),
                assinatura.getPlano(),
                assinatura.getStatus(),
                assinatura.getInicioAssinatura(),
                assinatura.getProximaCobranca(),
                assinatura.getSolicitacaoAtivacaoEm(),
                assinatura.getPixPagoEm() == null ? null : assinatura.getPixValor(),
                assinatura.getPixPagoEm(),
                assinatura.getCreatedAt(),
                assinatura.getUpdatedAt(),
                temAcessoOperacional(assinatura),
                ativa);
    }

    private String nomeComerciante(Assinatura assinatura) {
        return assinatura.getComerciante().getName()
                + " "
                + assinatura.getComerciante().getSurname();
    }

    private RespostaPagamentoAssinatura mapearPagamento(
            PagamentoAssinatura pagamento) {
        var assinatura = pagamento.getAssinatura();
        return new RespostaPagamentoAssinatura(
                pagamento.getId(),
                nomeComerciante(assinatura),
                mascararEmail(assinatura.getComerciante().getEmail()),
                pagamento.getValor(),
                pagamento.getPagoEm(),
                pagamento.getAcessoValidoAte());
    }

    private String mascararEmail(String email) {
        int separador = email.indexOf('@');
        if (separador <= 0) {
            return "***";
        }
        String usuario = email.substring(0, separador);
        return usuario.substring(0, Math.min(2, usuario.length()))
                + "***"
                + email.substring(separador);
    }
}
