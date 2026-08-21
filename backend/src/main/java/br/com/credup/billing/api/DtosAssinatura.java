package br.com.credup.billing.api;

import br.com.credup.billing.domain.*;
import java.time.*;
import java.math.BigDecimal;
import java.util.UUID;

public final class DtosAssinatura {
    private DtosAssinatura() {
    }

    public record RespostaAssinatura(
            UUID id,
            UUID idComerciante,
            String nomeComerciante,
            String emailMascarado,
            PlanoAssinatura plano,
            StatusAssinatura status,
            LocalDate inicioAssinatura,
            LocalDate proximaCobranca,
            Instant solicitacaoAtivacaoEm,
            BigDecimal valorUltimoPagamento,
            Instant ultimoPagamentoEm,
            Instant criadaEm,
            Instant atualizadaEm,
            boolean acessoOperacional,
            boolean podeGerarRelatorio) {
    }

    public record RespostaPagamentoAssinatura(
            UUID id,
            String nomeGestor,
            String emailMascarado,
            BigDecimal valor,
            Instant pagoEm,
            LocalDate acessoValidoAte) {
    }
}
