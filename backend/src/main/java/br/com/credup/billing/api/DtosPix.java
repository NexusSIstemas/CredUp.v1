package br.com.credup.billing.api;

import java.math.BigDecimal;
import java.time.Instant;

public final class DtosPix {
    private DtosPix() {
    }

    public record RespostaCobrancaPix(
            BigDecimal valor,
            String txid,
            String nomeRecebedor,
            String pixCopiaECola,
            String qrCodeBase64,
            Instant geradoEm,
            String status,
            int expiracaoSegundos,
            String avisoConfirmacao) {
    }

    public record RespostaStatusPix(
            String txid,
            String status,
            boolean pago,
            Instant confirmadoEm) {
    }
}
