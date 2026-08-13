package br.com.credup.identity.domain;

import br.com.credup.shared.domain.PerfilAcesso;
import br.com.credup.shared.domain.EntidadeBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "usuarios")
@Inheritance(strategy = InheritanceType.JOINED)
public class Usuario extends EntidadeBase {
    @Column(name = "nome", nullable = false) private String name;
    @Column(name = "sobrenome", nullable = false) private String surname;
    @Column(name = "telefone") private String telephone;
    @Column(nullable = false, unique = true, length = 11) private String cpf;
    @Column(nullable = false, unique = true) private String email;
    @Column(name = "senha", nullable = false) private String senha;
    @Enumerated(EnumType.STRING)
    @Column(name = "perfil_acesso", nullable = false) private PerfilAcesso role;
    @Column(name = "data_cadastro", nullable = false) private Instant dateRegister;
    @Column(name = "data_nascimento") private LocalDate dateBirth;
    @Column(name = "deve_alterar_senha", nullable = false) private boolean deveAlterarSenha;
    @Column(name = "ativo", nullable = false) private boolean enabled = true;
    @Column(name = "pin_recuperacao_hash") private String pinRecuperacaoHash;
    @Column(name = "versao_credenciais", nullable = false) private long versaoCredenciais;

    @PrePersist
    void prePersist() {
        if (dateRegister == null) dateRegister = Instant.now();
    }

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

    public String getTelephone() {
        return telephone;
    }

    public void setTelephone(String telephone) {
        this.telephone = telephone;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }

    public PerfilAcesso getPerfilAcesso() {
        return role;
    }

    public void setPerfilAcesso(PerfilAcesso role) {
        this.role = role;
    }

    public Instant getDateRegister() {
        return dateRegister;
    }

    public LocalDate getDateBirth() {
        return dateBirth;
    }

    public void setDateBirth(LocalDate dateBirth) {
        this.dateBirth = dateBirth;
    }

    public boolean deveAlterarSenha() {
        return deveAlterarSenha;
    }

    public void setDeveAlterarSenha(boolean deveAlterarSenha) {
        this.deveAlterarSenha = deveAlterarSenha;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getPinRecuperacaoHash() {
        return pinRecuperacaoHash;
    }

    public void setPinRecuperacaoHash(String pinRecuperacaoHash) {
        this.pinRecuperacaoHash = pinRecuperacaoHash;
    }

    public boolean possuiPinRecuperacao() {
        return pinRecuperacaoHash != null && !pinRecuperacaoHash.isBlank();
    }

    public long getVersaoCredenciais() {
        return versaoCredenciais;
    }

    public void invalidarSessoes() {
        versaoCredenciais++;
    }
}
