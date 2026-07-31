package br.com.credup.commerce.api;

import br.com.credup.shared.domain.StatusComercio;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.hibernate.validator.constraints.br.CNPJ;
import java.util.UUID;

public final class DtosComercio {
    private DtosComercio() {
    }
    public record SolicitacaoEndereco(@NotBlank String rua, @NotBlank String cidade,
            @NotBlank
            @Pattern(regexp = "\\d{8}", message = "CEP inválido")
            String cep,
            @NotBlank String numberComercio,
            String pontoReferencia) {
    }

    public record SolicitacaoCriacaoComercio(
            @NotBlank String nomeComercio,
            @NotBlank
            @CNPJ(message = "CNPJ inválido")
            String cnpj,
            @NotNull @Valid SolicitacaoEndereco endereco) {
    }

    public record SolicitacaoAtualizacaoComercio(
            @NotBlank String nomeComercio,
            @NotNull @Valid SolicitacaoEndereco endereco) {
    }

    public record RespostaComercio(
            UUID id,
            String nomeComercio,
            String cnpj,
            SolicitacaoEndereco endereco,
            UUID idComerciante,
            StatusComercio status) {
    }

    public record SolicitacaoRevisao(
            @NotNull StatusComercio status) {
    }
}
