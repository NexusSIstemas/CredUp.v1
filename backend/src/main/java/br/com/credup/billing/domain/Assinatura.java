package br.com.credup.billing.domain;

import br.com.credup.identity.domain.Comerciante;
import br.com.credup.shared.domain.EntidadeBase;
import jakarta.persistence.*;
import java.time.*;
import java.math.BigDecimal;

@Entity
@Table(name = "assinaturas")
public class Assinatura extends EntidadeBase {
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "comerciante_id", nullable = false, unique = true)
    private Comerciante comerciante;

    @Enumerated(EnumType.STRING)
    @Column(name = "plano", nullable = false, length = 30)
    private PlanoAssinatura plano;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private StatusAssinatura status;

    @Column(name = "inicio_assinatura")
    private LocalDate inicioAssinatura;

    @Column(name = "proxima_cobranca")
    private LocalDate proximaCobranca;

    @Column(name = "solicitacao_ativacao_em")
    private Instant solicitacaoAtivacaoEm;

    @Column(name = "cancelada_em")
    private Instant canceladaEm;

    @Column(name = "pix_txid", unique = true, length = 35)
    private String pixTxid;

    @Column(name = "pix_status", length = 30)
    private String pixStatus;

    @Column(name = "pix_valor", precision = 12, scale = 2)
    private BigDecimal pixValor;

    @Column(name = "pix_criado_em")
    private Instant pixCriadoEm;

    @Column(name = "pix_pago_em")
    private Instant pixPagoEm;

    public Comerciante getComerciante() {
        return comerciante;
    }

    public void setComerciante(Comerciante comerciante) {
        this.comerciante = comerciante;
    }

    public PlanoAssinatura getPlano() {
        return plano;
    }

    public void setPlano(PlanoAssinatura plano) {
        this.plano = plano;
    }

    public StatusAssinatura getStatus() {
        return status;
    }

    public void setStatus(StatusAssinatura status) {
        this.status = status;
    }

    public LocalDate getInicioAssinatura() {
        return inicioAssinatura;
    }

    public void setInicioAssinatura(LocalDate inicioAssinatura) {
        this.inicioAssinatura = inicioAssinatura;
    }

    public LocalDate getProximaCobranca() {
        return proximaCobranca;
    }

    public void setProximaCobranca(LocalDate proximaCobranca) {
        this.proximaCobranca = proximaCobranca;
    }

    public Instant getSolicitacaoAtivacaoEm() {
        return solicitacaoAtivacaoEm;
    }

    public void setSolicitacaoAtivacaoEm(Instant solicitacaoAtivacaoEm) {
        this.solicitacaoAtivacaoEm = solicitacaoAtivacaoEm;
    }

    public Instant getCanceladaEm() {
        return canceladaEm;
    }

    public void setCanceladaEm(Instant canceladaEm) {
        this.canceladaEm = canceladaEm;
    }

    public String getPixTxid() { return pixTxid; }
    public void setPixTxid(String pixTxid) { this.pixTxid = pixTxid; }
    public String getPixStatus() { return pixStatus; }
    public void setPixStatus(String pixStatus) { this.pixStatus = pixStatus; }
    public BigDecimal getPixValor() { return pixValor; }
    public void setPixValor(BigDecimal pixValor) { this.pixValor = pixValor; }
    public Instant getPixCriadoEm() { return pixCriadoEm; }
    public void setPixCriadoEm(Instant pixCriadoEm) { this.pixCriadoEm = pixCriadoEm; }
    public Instant getPixPagoEm() { return pixPagoEm; }
    public void setPixPagoEm(Instant pixPagoEm) { this.pixPagoEm = pixPagoEm; }
}
