package br.com.credup.identity.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "funcionarios_comercio")
public class FuncionarioComercio extends Usuario {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "responsavel_id", nullable = false)
    private Comerciante responsavel;

    public Comerciante getResponsavel() {
        return responsavel;
    }

    public void setResponsavel(Comerciante responsavel) {
        this.responsavel = responsavel;
    }
}
