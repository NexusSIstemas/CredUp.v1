package br.com.credup.auth.domain;

import br.com.credup.identity.domain.Usuario;
import br.com.credup.shared.domain.StatusRedefinicaoSenha;
import br.com.credup.shared.domain.EntidadeBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "solicitacoes_redefinicao_senha")
public class SolicitacaoRedefinicaoSenha extends EntidadeBase {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;
    @Column(name = "nome_comercio", nullable = false)
    private String commerceName;
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StatusRedefinicaoSenha status = StatusRedefinicaoSenha.PENDING;
    @Column(name = "solicitado_em", nullable = false)
    private Instant solicitadoEm;
    @Column(name = "resolvido_em")
    private Instant resolvedAt;

    @PrePersist
    void onCreate() {
        if (solicitadoEm == null) solicitadoEm = Instant.now();
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public String getComercioName() {
        return commerceName;
    }

    public void setComercioName(String commerceName) {
        this.commerceName = commerceName;
    }

    public StatusRedefinicaoSenha getStatus() {
        return status;
    }

    public void setStatus(StatusRedefinicaoSenha status) {
        this.status = status;
    }

    public Instant getSolicitadoEm() {
        return solicitadoEm;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}
