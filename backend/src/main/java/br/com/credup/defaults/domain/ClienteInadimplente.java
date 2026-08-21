package br.com.credup.defaults.domain;

import jakarta.persistence.*;
import br.com.credup.shared.domain.EntidadeBase;
import java.util.UUID;

@Entity
@Table(name = "clientes_inadimplentes", indexes = {
        @Index(name = "idx_clientes_inadimplentes_nome", columnList = "nome,sobrenome")
})
public class ClienteInadimplente extends EntidadeBase {
    @Column(name = "nome", nullable = false) private String name;
    @Column(name = "sobrenome", nullable = false) private String surname;
    @Column(name = "apelido", nullable = false, length = 120) private String nickname;
    @Column(unique = true, length = 11) private String cpf;
    @Column(name = "telefone") private String telephone;
    @Column(name = "residencia") private String residence;
    @Column(name = "descricao", columnDefinition = "text") private String description;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSurname() {
        return surname;
    }

    public void setSurname(String surname) {
        this.surname = surname;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getTelephone() {
        return telephone;
    }

    public void setTelephone(String telephone) {
        this.telephone = telephone;
    }

    public String getResidence() {
        return residence;
    }

    public void setResidence(String residence) {
        this.residence = residence;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
