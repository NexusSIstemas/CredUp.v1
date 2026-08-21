package br.com.credup.billing.domain;

import br.com.credup.shared.domain.EntidadeBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "configuracoes_sistema")
public class ConfiguracaoSistema extends EntidadeBase {
    @Column(name = "nome_plano", nullable = false, length = 80)
    private String nomePlano;

    @Column(name = "valor_mensal", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorMensal;

    @Column(name = "dias_tolerancia_pagamento", nullable = false)
    private int diasToleranciaPagamento;

    public String getNomePlano() {
        return nomePlano;
    }

    public BigDecimal getValorMensal() {
        return valorMensal;
    }

    public int getDiasToleranciaPagamento() {
        return diasToleranciaPagamento;
    }
}
