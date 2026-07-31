package br.com.credup.identity.api;

import br.com.credup.shared.domain.PerfilAcesso;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;

public final class DtosPerfil {
    private DtosPerfil() {
    }

    public record RespostaPerfil(
            UUID id,
            String nome,
            String sobrenome,
            String telefoneMascarado,
            String cpfMascarado,
            String emailMascarado,
            LocalDate dataNascimento,
            PerfilAcesso perfilAcesso) {
    }

    public record SolicitacaoAtualizacaoPerfil(
            @NotBlank String nome,
            @NotBlank String sobrenome,
            @Pattern(regexp = "^$|\\d{10,11}", message = "Telefone inválido") String telefone,
            @Email(message = "E-mail inválido") String email,
            @Past(message = "Data de nascimento inválida")
            LocalDate dataNascimento) {
    }
}
