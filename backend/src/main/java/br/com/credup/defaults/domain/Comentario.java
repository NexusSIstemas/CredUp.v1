package br.com.credup.defaults.domain;

import br.com.credup.identity.domain.Comerciante;
import br.com.credup.shared.domain.EntidadeBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "comentarios")
public class Comentario extends EntidadeBase {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "autor_id") private Comerciante author;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id") private ClienteInadimplente client;
    @Column(name = "texto", nullable = false, columnDefinition = "text") private String text;
}
