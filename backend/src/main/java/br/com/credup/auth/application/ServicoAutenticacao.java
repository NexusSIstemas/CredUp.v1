package br.com.credup.auth.application;

import br.com.credup.auth.api.DtosAutenticacao.*;
import br.com.credup.audit.domain.RegistroAuditoria;
import br.com.credup.audit.repository.RepositorioRegistroAuditoria;
import br.com.credup.identity.domain.Comerciante;
import br.com.credup.identity.domain.Usuario;
import br.com.credup.identity.repository.*;
import br.com.credup.auth.domain.SolicitacaoRedefinicaoSenha;
import br.com.credup.auth.repository.RepositorioSolicitacaoRedefinicaoSenha;
import br.com.credup.billing.application.ServicoAssinatura;
import br.com.credup.commerce.repository.RepositorioComercio;
import br.com.credup.security.ServicoJwt;
import br.com.credup.shared.domain.PerfilAcesso;
import br.com.credup.shared.domain.StatusRedefinicaoSenha;
import br.com.credup.shared.exception.ExcecaoApi;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Service
public class ServicoAutenticacao {
    private final RepositorioUsuario users;
    private final RepositorioComerciante merchants;
    private final PasswordEncoder codificador;
    private final ServicoJwt jwt;
    private final RepositorioComercio commerces;
    private final RepositorioSolicitacaoRedefinicaoSenha solicitacoesRedefinicao;
    private final ServicoAssinatura assinaturas;
    private final ServicoSessaoAtualizacao sessoesAtualizacao;
    private final RepositorioRegistroAuditoria auditoria;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String TEMP_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

    public ServicoAutenticacao(RepositorioUsuario users, RepositorioComerciante merchants, PasswordEncoder codificador, ServicoJwt jwt,
                       RepositorioComercio commerces, RepositorioSolicitacaoRedefinicaoSenha solicitacoesRedefinicao,
                       ServicoAssinatura assinaturas, ServicoSessaoAtualizacao sessoesAtualizacao,
                       RepositorioRegistroAuditoria auditoria) {
        this.users = users;
        this.merchants = merchants;
        this.codificador = codificador;
        this.jwt = jwt;
        this.commerces = commerces;
        this.solicitacoesRedefinicao = solicitacoesRedefinicao;
        this.assinaturas = assinaturas;
        this.sessoesAtualizacao = sessoesAtualizacao;
        this.auditoria = auditoria;
    }

    @Transactional
    public ResultadoAutenticacao register(SolicitacaoCadastro request) {
        if (request.dataNascimento() != null
                && request.dataNascimento().isAfter(LocalDate.now().minusYears(18)))
            throw new ExcecaoApi(HttpStatus.UNPROCESSABLE_ENTITY,
                    "O usuário deve ter pelo menos 18 anos");
        if (users.existsByEmailIgnoreCase(request.email()))
            throw new ExcecaoApi(HttpStatus.CONFLICT, "E-mail já cadastrado");
        if (users.existsByCpf(request.cpf()))
            throw new ExcecaoApi(HttpStatus.CONFLICT, "CPF já cadastrado");
        var merchant = new Comerciante();
        merchant.setFullname(request.nomeCompleto());
        merchant.setTelephone(request.telefone());
        merchant.setCpf(request.cpf());
        merchant.setEmail(request.email().toLowerCase());
        merchant.setSenha(codificador.encode(request.senha()));
        merchant.setPinRecuperacaoHash(codificador.encode(request.pinRecuperacao()));
        merchant.setDateBirth(request.dataNascimento());
        merchant.setPerfilAcesso(PerfilAcesso.MERCHANT_OWNER);
        merchants.save(merchant);
        assinaturas.criarPara(merchant);
        return criarSessao(merchant);
    }

    @Transactional(readOnly = true)
    public ResultadoAutenticacao login(SolicitacaoEntrada request) {
        var user = users.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ExcecaoApi(HttpStatus.UNAUTHORIZED, "Credenciais inválidas"));
        if (!user.isEnabled())
            throw new ExcecaoApi(HttpStatus.FORBIDDEN, "Acesso bloqueado pelo responsável");
        if (!codificador.matches(request.senha(), user.getSenha()))
            throw new ExcecaoApi(HttpStatus.UNAUTHORIZED, "Credenciais inválidas");
        return criarSessao(user);
    }

    private RespostaAutenticacao response(br.com.credup.identity.domain.Usuario user) {
        return new RespostaAutenticacao(jwt.generate(user), user.getId(), user.getFullname(), user.getPerfilAcesso(),
                user.deveAlterarSenha());
    }

    private ResultadoAutenticacao criarSessao(Usuario usuario) {
        return new ResultadoAutenticacao(response(usuario), sessoesAtualizacao.criar(usuario));
    }

    @Transactional
    public ResultadoAutenticacao atualizarSessao(String refreshToken) {
        var rotacao = sessoesAtualizacao.rotacionar(refreshToken);
        return new ResultadoAutenticacao(response(rotacao.usuario()), rotacao.token());
    }

    @Transactional
    public void sair(String refreshToken) {
        sessoesAtualizacao.revogar(refreshToken);
    }

    @Transactional
    public RespostaMensagem solicitarRedefinicao(SolicitacaoRecuperacaoSenha request) {
        var user = users.findByEmailIgnoreCase(request.email())
                .filter(Usuario::possuiPinRecuperacao)
                .filter(found -> codificador.matches(request.pin(), found.getPinRecuperacaoHash()))
                .orElseThrow(() -> new ExcecaoApi(HttpStatus.UNAUTHORIZED,
                        "Não foi possível confirmar os dados de recuperação"));
        user.setSenha(codificador.encode(request.novaSenha()));
        user.setDeveAlterarSenha(false);
        user.invalidarSessoes();
        sessoesAtualizacao.revogarTodas(user);
        users.save(user);
        return new RespostaMensagem("Senha redefinida. Entre novamente usando a nova senha.");
    }

    @Transactional(readOnly = true)
    public List<RespostaSolicitacaoRedefinicao> redefinicoesPendentes() {
        return solicitacoesRedefinicao.findByStatusOrderBySolicitadoEmAsc(StatusRedefinicaoSenha.PENDING).stream()
                .map(reset -> new RespostaSolicitacaoRedefinicao(reset.getId(),
                        reset.getUsuario().getFullname(),
                        maskCpf(reset.getUsuario().getCpf()), reset.getUsuario().getTelephone(),
                        reset.getUsuario().getEmail(),
                        reset.getComercioName(), reset.getSolicitadoEm()))
                .toList();
    }

    @Transactional
    public RespostaDecisaoRedefinicao aprovarRedefinicao(UUID id) {
        var reset = pending(id);
        String senhaTemporaria = senhaTemporaria();
        reset.getUsuario().setSenha(codificador.encode(senhaTemporaria));
        reset.getUsuario().setDeveAlterarSenha(true);
        reset.getUsuario().invalidarSessoes();
        sessoesAtualizacao.revogarTodas(reset.getUsuario());
        reset.setStatus(StatusRedefinicaoSenha.APPROVED);
        reset.setResolvedAt(Instant.now());
        return new RespostaDecisaoRedefinicao(
                reset.getUsuario().getEmail(), senhaTemporaria);
    }

    @Transactional
    public RespostaSenhaTemporariaAdministrativa gerarSenhaTemporariaAdministrativa(
            Usuario administrador, UUID idUsuario) {
        var usuario = users.findById(idUsuario)
                .orElseThrow(() -> new ExcecaoApi(
                        HttpStatus.NOT_FOUND, "Usuário não encontrado"));
        if (usuario.getPerfilAcesso() == PerfilAcesso.ADMIN_REDE) {
            throw new ExcecaoApi(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "A senha de outro administrador não pode ser redefinida por esta tela");
        }

        String senhaTemporaria = senhaTemporaria();
        usuario.setSenha(codificador.encode(senhaTemporaria));
        usuario.setDeveAlterarSenha(true);
        usuario.invalidarSessoes();
        sessoesAtualizacao.revogarTodas(usuario);
        auditoria.save(RegistroAuditoria.of(
                administrador,
                "GERAR_SENHA_TEMPORARIA_ADMINISTRATIVA",
                "Usuario",
                usuario.getId(),
                usuario.getFullname(),
                "Gerou uma senha temporária de recuperação para o usuário"));

        return new RespostaSenhaTemporariaAdministrativa(
                usuario.getId(),
                usuario.getFullname(),
                usuario.getEmail(),
                senhaTemporaria);
    }

    @Transactional(readOnly = true)
    public List<ResumoUsuarioRecuperacao> buscarUsuariosParaRecuperacao(
            String nome) {
        String termo = nome == null ? "" : nome.trim();
        if (termo.isEmpty()) {
            return List.of();
        }
        return users.findTop10ByFullnameContainingIgnoreCaseAndRoleNotOrderByFullnameAsc(
                termo, PerfilAcesso.ADMIN_REDE).stream()
                .map(usuario -> new ResumoUsuarioRecuperacao(
                        usuario.getId(),
                        usuario.getFullname(),
                        usuario.getEmail(),
                        usuario.getPerfilAcesso()))
                .toList();
    }

    @Transactional
    public void rejeitarRedefinicao(UUID id) {
        var reset = pending(id);
        reset.setStatus(StatusRedefinicaoSenha.REJECTED);
        reset.setResolvedAt(Instant.now());
    }

    @Transactional
    public ResultadoAutenticacao alterarSenha(br.com.credup.identity.domain.Usuario user, SolicitacaoAlteracaoSenha request) {
        if (!codificador.matches(request.senhaAtual(), user.getSenha()))
            throw new ExcecaoApi(HttpStatus.UNAUTHORIZED, "Senha temporária inválida");
        user.setSenha(codificador.encode(request.novaSenha()));
        if (request.pinRecuperacao() != null && !request.pinRecuperacao().isBlank())
            user.setPinRecuperacaoHash(codificador.encode(request.pinRecuperacao()));
        user.setDeveAlterarSenha(false);
        user.invalidarSessoes();
        sessoesAtualizacao.revogarTodas(user);
        users.save(user);
        return criarSessao(user);
    }

    private SolicitacaoRedefinicaoSenha pending(UUID id) {
        var reset = solicitacoesRedefinicao.findById(id)
                .orElseThrow(() -> new ExcecaoApi(HttpStatus.NOT_FOUND, "Solicitação não encontrada"));
        if (reset.getStatus() != StatusRedefinicaoSenha.PENDING)
            throw new ExcecaoApi(HttpStatus.CONFLICT, "Solicitação já analisada");
        return reset;
    }

    private String senhaTemporaria() {
        StringBuilder value = new StringBuilder("Cr3");
        while (value.length() < 10) value.append(TEMP_CHARS.charAt(RANDOM.nextInt(TEMP_CHARS.length())));
        return value.toString();
    }

    private String maskCpf(String cpf) {
        return "***." + cpf.substring(3, 6) + "." + cpf.substring(6, 9) + "-**";
    }

    public record ResultadoAutenticacao(
            RespostaAutenticacao resposta,
            ServicoSessaoAtualizacao.TokenAtualizacao refreshToken) {
    }
}
