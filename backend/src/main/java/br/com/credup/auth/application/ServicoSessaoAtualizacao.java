package br.com.credup.auth.application;

import br.com.credup.auth.domain.SessaoAtualizacao;
import br.com.credup.auth.repository.RepositorioSessaoAtualizacao;
import br.com.credup.identity.domain.Usuario;
import br.com.credup.identity.repository.RepositorioUsuario;
import br.com.credup.shared.exception.ExcecaoApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;

@Service
public class ServicoSessaoAtualizacao {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final RepositorioSessaoAtualizacao sessoes;
    private final RepositorioUsuario usuarios;
    private final Duration duracao;

    public ServicoSessaoAtualizacao(RepositorioSessaoAtualizacao sessoes,
            RepositorioUsuario usuarios,
            @Value("${app.jwt.refresh-expiration-hours}") long horas) {
        this.sessoes = sessoes;
        this.usuarios = usuarios;
        this.duracao = Duration.ofHours(horas);
    }

    @Transactional
    public TokenAtualizacao criar(Usuario usuario) {
        return criar(usuario, UUID.randomUUID());
    }

    @Transactional(noRollbackFor = ExcecaoApi.class)
    public ResultadoRotacao rotacionar(String token) {
        if (token == null || token.isBlank()) throw naoAutorizado();
        String hash = hash(token);
        var atual = sessoes.findByTokenHash(hash)
                .orElseThrow(this::naoAutorizado);
        if (atual.estaRevogada()) {
            if (atual.getRevogadoEm().isBefore(Instant.now().minusSeconds(10))) {
                sessoes.revogarFamilia(atual.getFamiliaId(), Instant.now());
                atual.getUsuario().invalidarSessoes();
                usuarios.save(atual.getUsuario());
            }
            throw naoAutorizado();
        }
        if (atual.getExpiraEm().isBefore(Instant.now()) || !atual.getUsuario().isEnabled()) {
            atual.setRevogadoEm(Instant.now());
            throw naoAutorizado();
        }
        TokenAtualizacao novo = criar(
                atual.getUsuario(),
                atual.getFamiliaId(),
                atual.getExpiraEm());
        atual.setRevogadoEm(Instant.now());
        atual.setSubstituidoPorHash(hash(novo.valor()));
        return new ResultadoRotacao(atual.getUsuario(), novo);
    }

    @Transactional
    public void revogar(String token) {
        if (token == null || token.isBlank()) return;
        sessoes.findByTokenHash(hash(token)).ifPresent(sessao ->
                sessoes.revogarFamilia(sessao.getFamiliaId(), Instant.now()));
    }

    @Transactional
    public void revogarTodas(Usuario usuario) {
        sessoes.revogarDoUsuario(usuario.getId(), Instant.now());
    }

    private TokenAtualizacao criar(Usuario usuario, UUID familia) {
        return criar(usuario, familia, Instant.now().plus(duracao));
    }

    private TokenAtualizacao criar(Usuario usuario, UUID familia, Instant expiraEm) {
        byte[] bytes = new byte[48];
        RANDOM.nextBytes(bytes);
        String valor = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        var sessao = new SessaoAtualizacao();
        sessao.setUsuario(usuario);
        sessao.setFamiliaId(familia);
        sessao.setTokenHash(hash(valor));
        sessao.setExpiraEm(expiraEm);
        sessoes.save(sessao);
        return new TokenAtualizacao(valor, expiraEm);
    }

    private String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 indisponível", exception);
        }
    }

    private ExcecaoApi naoAutorizado() {
        return new ExcecaoApi(HttpStatus.UNAUTHORIZED, "Sessão expirada ou inválida");
    }

    public record TokenAtualizacao(String valor, Instant expiraEm) {}
    public record ResultadoRotacao(Usuario usuario, TokenAtualizacao token) {}
}
