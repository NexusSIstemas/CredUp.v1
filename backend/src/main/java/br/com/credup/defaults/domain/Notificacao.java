package br.com.credup.defaults.domain;

import br.com.credup.shared.domain.*;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notificacoes")
public class Notificacao extends EntidadeBase {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "divida_id") private Divida debt;
    @Enumerated(EnumType.STRING) @Column(name = "canal", nullable = false) private CanalNotificacao channel;
    @Column(name = "enviado_em") private Instant sentAt;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private StatusNotificacao status;
}
