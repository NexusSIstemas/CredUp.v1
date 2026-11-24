-- A assinatura passa a vencer no instante exato do ciclo, sem período de tolerância.
-- Para registros existentes, preserva-se o horário do primeiro pagamento disponível.
ALTER TABLE assinaturas
    ADD COLUMN proxima_cobranca_exata TIMESTAMPTZ;

UPDATE assinaturas assinatura
SET proxima_cobranca_exata = (
    assinatura.proxima_cobranca::DATE
    + COALESCE(
        (
            SELECT MIN(pagamento.pago_em AT TIME ZONE 'America/Sao_Paulo')::TIME
            FROM pagamentos_assinatura pagamento
            WHERE pagamento.assinatura_id = assinatura.id
        ),
        (assinatura.pix_pago_em AT TIME ZONE 'America/Sao_Paulo')::TIME,
        TIME '00:00:00'
    )
) AT TIME ZONE 'America/Sao_Paulo'
WHERE assinatura.proxima_cobranca IS NOT NULL;

ALTER TABLE assinaturas
    DROP COLUMN proxima_cobranca;

ALTER TABLE assinaturas
    RENAME COLUMN proxima_cobranca_exata TO proxima_cobranca;

ALTER TABLE pagamentos_assinatura
    ALTER COLUMN acesso_valido_ate TYPE TIMESTAMPTZ
    USING (
        acesso_valido_ate::DATE
        + (pago_em AT TIME ZONE 'America/Sao_Paulo')::TIME
    ) AT TIME ZONE 'America/Sao_Paulo';

ALTER TABLE configuracoes_sistema
    DROP COLUMN dias_tolerancia_pagamento;
