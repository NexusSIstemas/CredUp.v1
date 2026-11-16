package br.com.credup.defaults.domain;

import jakarta.persistence.*;
import br.com.credup.shared.domain.EntidadeBase;
import java.util.UUID;

@Entity
@Table(name = "clientes_inadimplentes", indexes = {
        @Index(name = "idx_clientes_inadimplentes_nome", columnList = "nome_completo")
})
public class ClienteInadimplente extends EntidadeBase {
    @Column(name = "nome_completo", nullable = false) private String fullname;
    @Column(name = "apelido", nullable = false, length = 120) private String nickname;
    @Column(unique = true, length = 11) private String cpf;
    @Column(name = "telefone") private String telephone;
    @Column(name = "residencia") private String residence;
    @Column(name = "descricao", columnDefinition = "text") private String description;

    public String getFullname() {
        return fullname;
    }

    public void setFullname(String name) {
        this.fullname = name;
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
