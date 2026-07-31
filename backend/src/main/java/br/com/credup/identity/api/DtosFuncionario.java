package br.com.credup.identity.api;

import jakarta.validation.constraints.*;
import org.hibernate.validator.constraints.br.CPF;
import java.time.LocalDate;
import java.util.UUID;

public final class DtosFuncionario {
    private DtosFuncionario() {
    }

    public record SolicitacaoCriacaoFuncionario(
            @NotBlank String nome,
            @NotBlank String sobrenome,
            @NotBlank @Pattern(regexp = "\\d{10,11}") String telefone,
            @NotBlank
            @CPF(message = "CPF inválido")
            String cpf,
            @NotBlank
            @Email(message = "E-mail inválido")
            String email,
            @Past(message = "Data de nascimento inválida")
            LocalDate dataNascimento) {
    }

    public record RespostaFuncionario(
            UUID id,
            String nome,
            String sobrenome,
            String emailMascarado,
            String cpfMascarado,
            String telefoneMascarado,
            LocalDate dataNascimento,
            boolean ativo) {
    }

    public record RespostaFuncionarioCriado(
            RespostaFuncionario funcionario,
            String senhaTemporaria) {
    }

    public record RespostaSenhaFuncionario(
            String senhaTemporaria) {
    }

    public record SolicitacaoStatusFuncionario(
            boolean ativo) {
    }
}
