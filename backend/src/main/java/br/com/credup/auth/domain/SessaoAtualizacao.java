package br.com.credup.auth.domain;

import br.com.credup.identity.domain.Usuario;
import br.com.credup.shared.domain.EntidadeBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sessoes_atualizacao")
public class SessaoAtualizacao extends EntidadeBase {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "familia_id", nullable = false)
    private UUID familiaId;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "expira_em", nullable = false)
    private Instant expiraEm;

    @Column(name = "revogado_em")
    private Instant revogadoEm;

    @Column(name = "substituido_por_hash", length = 64)
    private String substituidoPorHash;

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public UUID getFamiliaId() { return familiaId; }
    public void setFamiliaId(UUID familiaId) { this.familiaId = familiaId; }
    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }
    public Instant getExpiraEm() { return expiraEm; }
    public void setExpiraEm(Instant expiraEm) { this.expiraEm = expiraEm; }
    public Instant getRevogadoEm() { return revogadoEm; }
    public void setRevogadoEm(Instant revogadoEm) { this.revogadoEm = revogadoEm; }
    public String getSubstituidoPorHash() { return substituidoPorHash; }
    public void setSubstituidoPorHash(String substituidoPorHash) { this.substituidoPorHash = substituidoPorHash; }
    public boolean estaRevogada() { return revogadoEm != null; }
}
