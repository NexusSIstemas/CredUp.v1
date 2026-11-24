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
            String nomeCompleto,
            String telefone,
            String cpfMascarado,
            String email,
            LocalDate dataNascimento,
            PerfilAcesso perfilAcesso,
            boolean pinRecuperacaoConfigurado) {
    }

    public record SolicitacaoAtualizacaoPerfil(
            @NotBlank String nomeCompleto,
            @Pattern(regexp = "^$|\\d{10,11}", message = "Telefone inválido") String telefone,
            @Email(message = "E-mail inválido") String email,
            @Past(message = "Data de nascimento inválida")
            LocalDate dataNascimento,
            @Pattern(regexp = "^$|\\d{6}", message = "O PIN deve conter exatamente 6 números")
            String pinRecuperacao) {
    }
}
