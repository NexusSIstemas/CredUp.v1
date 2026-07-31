package br.com.credup.audit.domain;

import br.com.credup.identity.domain.Usuario;
import br.com.credup.shared.domain.EntidadeBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "registros_auditoria")
public class RegistroAuditoria extends EntidadeBase {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id") private Usuario user;
    @Column(name = "acao", nullable = false) private String action;
    @Column(name = "entidade_alvo", nullable = false) private String targetEntity;
    @Column(name = "alvo_id", nullable = false) private UUID targetId;
    @Column(name = "autor_nome") private String authorName;
    @Column(name = "autor_perfil") private String authorRole;
    @Column(name = "alvo_descricao") private String targetDescription;
    @Column(name = "detalhes", columnDefinition = "text") private String details;
    @Column(name = "data_hora", nullable = false) private Instant timestamp;

    public static RegistroAuditoria of(Usuario user, String action, String targetEntity, UUID targetId) {
        return of(user, action, targetEntity, targetId, targetEntity + " " + targetId, null);
    }

    public static RegistroAuditoria of(Usuario user, String action, String targetEntity, UUID targetId,
            String targetDescription, String details) {
        var log = new RegistroAuditoria();
        log.user = user;
        log.action = action;
        log.targetEntity = targetEntity;
        log.targetId = targetId;
        log.authorName = user.getName() + " " + user.getSurname();
        log.authorRole = user.getPerfilAcesso().name();
        log.targetDescription = targetDescription;
        log.details = details;
        log.timestamp = Instant.now();
        return log;
    }

    public Usuario getUsuario() {
        return user;
    }

    public String getAcao() {
        return action;
    }

    public String getEntidadeAlvo() {
        return targetEntity;
    }

    public UUID getAlvoId() {
        return targetId;
    }

    public Instant getDataHora() {
        return timestamp;
    }

    public String getAutorNome() {
        return authorName;
    }

    public String getAutorPerfil() {
        return authorRole;
    }

    public String getAlvoDescricao() {
        return targetDescription;
    }

    public String getDetalhes() {
        return details;
    }
}
