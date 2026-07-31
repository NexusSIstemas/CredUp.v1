package br.com.credup.billing.domain;

import br.com.credup.identity.domain.Comerciante;
import br.com.credup.shared.domain.StatusPagamento;
import br.com.credup.shared.domain.EntidadeBase;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "pagamentos")
public class Pagamento extends EntidadeBase {
    @Column(name = "data_inicio", nullable = false) private LocalDate startDate;
    @Column(name = "plano", nullable = false) private String plan;
    @Column(name = "proximo_pagamento") private LocalDate nextPagamento;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "comerciante_id") private Comerciante merchant;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private StatusPagamento status;
}
