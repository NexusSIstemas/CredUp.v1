package br.com.credup.defaults.api;

import br.com.credup.shared.domain.StatusDivida;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.hibernate.validator.constraints.br.CPF;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class DtosInadimplencia {
    private DtosInadimplencia() {
    }

    public record SolicitacaoCliente(
            @NotBlank String nome,
            @NotBlank String sobrenome,
            @NotBlank
            @Size(max = 120)
            String apelido,
            @CPF(message = "CPF inválido")
            String cpf,
            @Pattern(
                    regexp = "^$|\\d{10,11}",
                    message = "Telefone inválido")
            String telefone,
            String residencia,
            String descricao) {
    }

    public record SolicitacaoCriacaoDivida(
            @NotNull UUID idComercio,
            @NotNull @Valid SolicitacaoCliente cliente,
            @NotNull @DecimalMin("0.01") BigDecimal valorDivida,
            @NotNull @PastOrPresent LocalDate dataDivida,
            String descricao,
            boolean possuiJuros,
            @DecimalMin("0.0") BigDecimal taxaJuros) {
    }

    public record ResumoCliente(
            UUID id,
            String nome,
            String sobrenome,
            String apelido,
            String cpfMascarado) {
    }

    public record DetalhesCliente(
            UUID id,
            String nome,
            String sobrenome,
            String apelido,
            String cpfMascarado,
            String telefoneMascarado,
            String residencia,
            String descricao) {
    }

    public record RespostaDivida(
            UUID id,
            ResumoCliente cliente,
            UUID idComercio,
            String nomeComercio,
            BigDecimal valorDivida,
            LocalDate dataDivida,
            Instant dataCadastro,
            String descricao,
            boolean possuiJuros,
            BigDecimal taxaJuros,
            StatusDivida status,
            boolean podeDarBaixa) {
    }

    public record SolicitacaoBuscaRede(
            @Size(
                    min = 3,
                    max = 120,
                    message = "Insira pelo menos 3 dígitos do CPF ou 3 caracteres do apelido")
            String busca) {
    }
}
