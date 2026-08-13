package br.com.credup.auth.api;

import br.com.credup.shared.domain.PerfilAcesso;
import jakarta.validation.constraints.*;
import org.hibernate.validator.constraints.br.CPF;
import java.time.LocalDate;
import java.util.UUID;
import java.time.Instant;

public final class DtosAutenticacao {
    private DtosAutenticacao() {
    }

    public record SolicitacaoCadastro(
            @NotBlank String nome,
            @NotBlank String sobrenome,
            @NotBlank
            @Pattern(regexp = "\\d{10,11}", message = "Telefone inválido")
            String telefone,
            @NotBlank
            @CPF(message = "CPF inválido")
            String cpf,
            @NotBlank
            @Email(message = "E-mail inválido")
            String email,
            @NotBlank
            @Size(min = 8, message = "A senha deve ter no mínimo 8 caracteres")
            @Pattern(
                    regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$",
                    message = "A senha deve conter letras e números")
            String senha,
            @NotBlank
            @Pattern(regexp = "\\d{6}", message = "O PIN deve conter exatamente 6 números")
            String pinRecuperacao,
            @Past(message = "Data de nascimento inválida")
            LocalDate dataNascimento) {
    }

    public record SolicitacaoEntrada(
            @NotBlank
            @Email(message = "E-mail inválido")
            String email,
            @NotBlank String senha) {
    }

    public record RespostaAutenticacao(
            String token,
            UUID idUsuario,
            String nome,
            PerfilAcesso perfilAcesso,
            boolean deveAlterarSenha) {
    }

    public record SolicitacaoRecuperacaoSenha(
            @NotBlank
            @Email(message = "E-mail inválido") String email,
            @NotBlank @Pattern(regexp = "\\d{6}", message = "O PIN deve conter exatamente 6 números") String pin,
            @NotBlank
            @Size(min = 8, message = "A senha deve ter no mínimo 8 caracteres")
            @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$", message = "A senha deve conter letras e números")
            String novaSenha) {
    }

    public record RespostaMensagem(
            String mensagem) {
    }

    public record SolicitacaoAlteracaoSenha(
            @NotBlank String senhaAtual,
            @NotBlank
            @Size(min = 8, message = "A senha deve ter no mínimo 8 caracteres")
            @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$",
                    message = "A senha deve conter letras e números")
            String novaSenha,
            @Pattern(regexp = "^$|\\d{6}", message = "O PIN deve conter exatamente 6 números")
            String pinRecuperacao) {
    }

    public record RespostaSolicitacaoRedefinicao(
            UUID id,
            String nome,
            String cpfMascarado,
            String telefoneMascarado,
            String nomeComercio,
            Instant solicitadoEm) {
    }

    public record RespostaDecisaoRedefinicao(
            String senhaTemporaria) {
    }
}
