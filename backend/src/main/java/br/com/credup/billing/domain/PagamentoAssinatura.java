package br.com.credup.billing.domain;

import br.com.credup.shared.domain.EntidadeBase;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "pagamentos_assinatura")
public class PagamentoAssinatura extends EntidadeBase {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assinatura_id", nullable = false)
    private Assinatura assinatura;

    @Column(name = "referencia_externa", nullable = false, unique = true, length = 100)
    private String referenciaExterna;

    @Column(name = "valor", nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;

    @Column(name = "pago_em", nullable = false)
    private Instant pagoEm;

    @Column(name = "acesso_valido_ate", nullable = false)
    private LocalDate acessoValidoAte;

    public Assinatura getAssinatura() {
        return assinatura;
    }

    public void setAssinatura(Assinatura assinatura) {
        this.assinatura = assinatura;
    }

    public String getReferenciaExterna() {
        return referenciaExterna;
    }

    public void setReferenciaExterna(String referenciaExterna) {
        this.referenciaExterna = referenciaExterna;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }

    public Instant getPagoEm() {
        return pagoEm;
    }

    public void setPagoEm(Instant pagoEm) {
        this.pagoEm = pagoEm;
    }

    public LocalDate getAcessoValidoAte() {
        return acessoValidoAte;
    }

    public void setAcessoValidoAte(LocalDate acessoValidoAte) {
        this.acessoValidoAte = acessoValidoAte;
    }
}
