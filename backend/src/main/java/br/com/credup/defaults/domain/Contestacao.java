package br.com.credup.defaults.domain;

import jakarta.persistence.*;
import br.com.credup.shared.domain.EntidadeBase;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "contestacoes")
public class Contestacao extends EntidadeBase {
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "divida_id") private Divida debt;
    @Column(name = "motivo", nullable = false, columnDefinition = "text") private String reason;
    @Column(name = "aberto_em", nullable = false) private Instant openedAt;
    @Column(name = "resolvido_em") private Instant resolvedAt;
    @Column(name = "resolucao", columnDefinition = "text") private String resolution;
}
