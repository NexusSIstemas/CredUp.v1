package br.com.credup.billing.api;

import br.com.credup.billing.domain.*;
import java.time.*;
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
            boolean acessoOperacional,
            boolean podeGerarRelatorio) {
    }
}
