package br.com.credup.billing.application;

import br.com.credup.audit.domain.RegistroAuditoria;
import br.com.credup.audit.repository.RepositorioRegistroAuditoria;
import br.com.credup.billing.api.DtosAssinatura.RespostaAssinatura;
import br.com.credup.billing.domain.*;
import br.com.credup.billing.repository.RepositorioAssinatura;
import br.com.credup.identity.domain.*;
import br.com.credup.shared.domain.PerfilAcesso;
import br.com.credup.shared.exception.ExcecaoApi;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class ServicoAssinatura {
    public static final int DIAS_TESTE = 30;
    public static final int DIAS_PLANO_MENSAL = 30;

    private final RepositorioAssinatura assinaturas;
    private final RepositorioRegistroAuditoria auditoria;

    public ServicoAssinatura(
            RepositorioAssinatura assinaturas,
            RepositorioRegistroAuditoria auditoria) {
        this.assinaturas = assinaturas;
        this.auditoria = auditoria;
    }

    @Transactional
    public void criarPara(Comerciante comerciante) {
        if (assinaturas.findByComercianteId(comerciante.getId()).isPresent()) {
            return;
        }
        var assinatura = new Assinatura();
        assinatura.setComerciante(comerciante);
        assinatura.setPlano(PlanoAssinatura.TESTE);
        assinatura.setStatus(StatusAssinatura.AGUARDANDO_APROVACAO);
        assinaturas.save(assinatura);
    }

    @Transactional
    public void iniciarTeste(Comerciante comerciante) {
        var assinatura = obterPorComerciante(comerciante);
        if (assinatura.getStatus() != StatusAssinatura.AGUARDANDO_APROVACAO) {
            return;
        }
        var hoje = LocalDate.now();
        assinatura.setPlano(PlanoAssinatura.TESTE);
        assinatura.setStatus(StatusAssinatura.EM_TESTE);
        assinatura.setInicioTeste(hoje);
        assinatura.setFimTeste(hoje.plusDays(DIAS_TESTE));
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

    @Transactional
    public RespostaAssinatura solicitarAtivacao(Usuario usuario) {
        if (usuario.getPerfilAcesso() != PerfilAcesso.MERCHANT_OWNER) {
            throw new ExcecaoApi(
                    HttpStatus.FORBIDDEN,
                    "Somente o dono pode solicitar a ativação da assinatura");
        }
        var assinatura = obterDoUsuario(usuario);
        atualizarStatus(assinatura);
        if (assinatura.getStatus() == StatusAssinatura.ATIVA) {
            throw new ExcecaoApi(HttpStatus.CONFLICT, "A assinatura já está ativa");
        }
        if (assinatura.getSolicitacaoAtivacaoEm() != null) {
            throw new ExcecaoApi(HttpStatus.CONFLICT, "A ativação já foi solicitada");
        }
        assinatura.setSolicitacaoAtivacaoEm(Instant.now());
        auditoria.save(RegistroAuditoria.of(
                usuario,
                "SOLICITAR_ATIVACAO_ASSINATURA",
                "Assinatura",
                assinatura.getId(),
                usuario.getName() + " " + usuario.getSurname(),
                "Solicitou a ativação do plano profissional"));
        return mapear(assinatura);
    }

    @Transactional
    public RespostaAssinatura ativar(Usuario administrador, UUID id) {
        var assinatura = obter(id);
        var hoje = LocalDate.now();
        assinatura.setPlano(PlanoAssinatura.PROFISSIONAL);
        assinatura.setStatus(StatusAssinatura.ATIVA);
        if (assinatura.getInicioAssinatura() == null) {
            assinatura.setInicioAssinatura(hoje);
        }
        assinatura.setProximaCobranca(hoje.plusDays(DIAS_PLANO_MENSAL));
        assinatura.setSolicitacaoAtivacaoEm(null);
        assinatura.setCanceladaEm(null);
        auditoria.save(RegistroAuditoria.of(
                administrador,
                "ATIVAR_ASSINATURA",
                "Assinatura",
                assinatura.getId(),
                nomeComerciante(assinatura),
                "Ativou o plano profissional por 30 dias"));
        return mapear(assinatura);
    }

    @Transactional
    public RespostaAssinatura renovar(Usuario administrador, UUID id) {
        var assinatura = obter(id);
        var hoje = LocalDate.now();
        var baseRenovacao = assinatura.getProximaCobranca() != null
                && assinatura.getProximaCobranca().isAfter(hoje)
                        ? assinatura.getProximaCobranca()
                        : hoje;
        assinatura.setPlano(PlanoAssinatura.PROFISSIONAL);
        assinatura.setStatus(StatusAssinatura.ATIVA);
        if (assinatura.getInicioAssinatura() == null) {
            assinatura.setInicioAssinatura(hoje);
        }
        assinatura.setProximaCobranca(baseRenovacao.plusDays(DIAS_PLANO_MENSAL));
        assinatura.setSolicitacaoAtivacaoEm(null);
        assinatura.setCanceladaEm(null);
        auditoria.save(RegistroAuditoria.of(
                administrador,
                "RENOVAR_ASSINATURA",
                "Assinatura",
                assinatura.getId(),
                nomeComerciante(assinatura),
                "Renovou o plano profissional por mais 30 dias"));
        return mapear(assinatura);
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
                    "Seu período de teste terminou. Ative o plano profissional para continuar usando o CredUp");
        }
    }

    @Transactional
    public void exigirGerenciamentoComercio(Usuario usuario) {
        if (usuario.getPerfilAcesso() == PerfilAcesso.ADMIN_REDE) {
            return;
        }
        var assinatura = obterDoUsuario(usuario);
        atualizarStatus(assinatura);
        if (assinatura.getStatus() == StatusAssinatura.EXPIRADA
                || assinatura.getStatus() == StatusAssinatura.ATRASADA
                || assinatura.getStatus() == StatusAssinatura.CANCELADA) {
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
        if (assinatura.getStatus() != StatusAssinatura.ATIVA) {
            throw new ExcecaoApi(
                    HttpStatus.FORBIDDEN,
                    "Relatórios em PDF estão disponíveis somente no plano pago");
        }
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
                    assinatura.setPlano(PlanoAssinatura.TESTE);
                    assinatura.setStatus(StatusAssinatura.AGUARDANDO_APROVACAO);
                    return assinaturas.save(assinatura);
                });
    }

    private Assinatura obter(UUID id) {
        return assinaturas.findById(id)
                .orElseThrow(() -> new ExcecaoApi(HttpStatus.NOT_FOUND, "Assinatura não encontrada"));
    }

    private void atualizarStatus(Assinatura assinatura) {
        var hoje = LocalDate.now();
        if (assinatura.getStatus() == StatusAssinatura.EM_TESTE
                && assinatura.getFimTeste() != null
                && !hoje.isBefore(assinatura.getFimTeste())) {
            assinatura.setStatus(StatusAssinatura.EXPIRADA);
        }
        if (assinatura.getStatus() == StatusAssinatura.ATIVA
                && assinatura.getProximaCobranca() != null
                && hoje.isAfter(assinatura.getProximaCobranca())) {
            assinatura.setStatus(StatusAssinatura.ATRASADA);
        }
    }

    private boolean temAcessoOperacional(Assinatura assinatura) {
        return assinatura.getStatus() == StatusAssinatura.EM_TESTE
                || assinatura.getStatus() == StatusAssinatura.ATIVA;
    }

    private RespostaAssinatura mapear(Assinatura assinatura) {
        LocalDate limite = assinatura.getStatus() == StatusAssinatura.EM_TESTE
                ? assinatura.getFimTeste()
                : assinatura.getStatus() == StatusAssinatura.ATIVA
                        ? assinatura.getProximaCobranca()
                        : null;
        long diasRestantes = limite == null
                ? 0
                : Math.max(0, ChronoUnit.DAYS.between(LocalDate.now(), limite));
        boolean ativa = assinatura.getStatus() == StatusAssinatura.ATIVA;
        return new RespostaAssinatura(
                assinatura.getId(),
                assinatura.getComerciante().getId(),
                nomeComerciante(assinatura),
                mascararEmail(assinatura.getComerciante().getEmail()),
                assinatura.getPlano(),
                assinatura.getStatus(),
                assinatura.getInicioTeste(),
                assinatura.getFimTeste(),
                assinatura.getInicioAssinatura(),
                assinatura.getProximaCobranca(),
                assinatura.getSolicitacaoAtivacaoEm(),
                diasRestantes,
                temAcessoOperacional(assinatura),
                ativa,
                !ativa && assinatura.getSolicitacaoAtivacaoEm() == null);
    }

    private String nomeComerciante(Assinatura assinatura) {
        return assinatura.getComerciante().getName()
                + " "
                + assinatura.getComerciante().getSurname();
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
