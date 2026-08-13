package br.com.credup.commerce.domain;

import br.com.credup.identity.domain.Comerciante;
import br.com.credup.shared.domain.StatusComercio;
import br.com.credup.shared.domain.EntidadeBase;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "comercios")
public class Comercio extends EntidadeBase {
    @Column(name = "nome_comercio", nullable = false) private String commerceName;
    @Column(nullable = false, unique = true, length = 14) private String cnpj;
    @Embedded private Endereco address;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "comerciante_id") private Comerciante comerciante;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false) private StatusComercio status = StatusComercio.APPROVED;

    public String getComercioName() {
        return commerceName;
    }

    public void setComercioName(String commerceName) {
        this.commerceName = commerceName;
    }

    public String getCnpj() {
        return cnpj;
    }

    public void setCnpj(String cnpj) {
        this.cnpj = cnpj;
    }

    public Endereco getEndereco() {
        return address;
    }

    public void setEndereco(Endereco address) {
        this.address = address;
    }

    public Comerciante getComerciante() {
        return comerciante;
    }

    public void setComerciante(Comerciante comerciante) {
        this.comerciante = comerciante;
    }

    public StatusComercio getStatus() {
        return status;
    }

    public void setStatus(StatusComercio status) {
        this.status = status;
    }
}
