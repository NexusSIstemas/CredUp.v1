package br.com.credup.defaults.domain;

import br.com.credup.commerce.domain.Comercio;
import br.com.credup.shared.domain.StatusDivida;
import br.com.credup.shared.domain.EntidadeBase;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "dividas", indexes = {
        @Index(name = "idx_dividas_cliente", columnList = "cliente_id"),
        @Index(name = "idx_dividas_comercio_status", columnList = "comercio_id,status")
})
public class Divida extends EntidadeBase {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id") private ClienteInadimplente client;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "comercio_id") private Comercio commerce;
    @Column(name = "valor_divida", nullable = false, precision = 15, scale = 2) private BigDecimal debtValue;
    @Column(name = "data_divida", nullable = false) private LocalDate dateValue;
    @Column(name = "descricao", columnDefinition = "text") private String description;
    @Column(name = "possui_juros", nullable = false) private boolean hasInterest;
    @Column(name = "taxa_juros", precision = 7, scale = 4) private BigDecimal interestRate;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false) private StatusDivida status = StatusDivida.PENDING;

    public ClienteInadimplente getClient() {
        return client;
    }

    public void setClient(ClienteInadimplente client) {
        this.client = client;
    }

    public Comercio getComercio() {
        return commerce;
    }

    public void setComercio(Comercio commerce) {
        this.commerce = commerce;
    }

    public BigDecimal getDividaValue() {
        return debtValue;
    }

    public void setDividaValue(BigDecimal debtValue) {
        this.debtValue = debtValue;
    }

    public LocalDate getDateValue() {
        return dateValue;
    }

    public void setDateValue(LocalDate dateValue) {
        this.dateValue = dateValue;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isHasInterest() {
        return hasInterest;
    }

    public void setHasInterest(boolean hasInterest) {
        this.hasInterest = hasInterest;
    }

    public BigDecimal getInterestRate() {
        return interestRate;
    }

    public void setInterestRate(BigDecimal interestRate) {
        this.interestRate = interestRate;
    }

    public StatusDivida getStatus() {
        return status;
    }

    public void setStatus(StatusDivida status) {
        this.status = status;
    }
}
