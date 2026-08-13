package br.com.credup.commerce.domain;

import br.com.credup.identity.domain.Comerciante;
import br.com.credup.shared.domain.EntidadeBase;
import br.com.credup.shared.domain.StatusComercio;
import jakarta.persistence.*;

@Entity
@Table(name = "solicitacoes_comercio")
public class SolicitacaoComercio extends EntidadeBase {
    @Column(name = "nome_comercio", nullable = false)
    private String nomeComercio;

    @Column(nullable = false, length = 14)
    private String cnpj;

    @Embedded
    private Endereco endereco;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "comerciante_id", nullable = false)
    private Comerciante comerciante;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusComercio status = StatusComercio.PENDING;

    public String getNomeComercio() { return nomeComercio; }
    public void setNomeComercio(String nomeComercio) { this.nomeComercio = nomeComercio; }
    public String getCnpj() { return cnpj; }
    public void setCnpj(String cnpj) { this.cnpj = cnpj; }
    public Endereco getEndereco() { return endereco; }
    public void setEndereco(Endereco endereco) { this.endereco = endereco; }
    public Comerciante getComerciante() { return comerciante; }
    public void setComerciante(Comerciante comerciante) { this.comerciante = comerciante; }
    public StatusComercio getStatus() { return status; }
    public void setStatus(StatusComercio status) { this.status = status; }
}
