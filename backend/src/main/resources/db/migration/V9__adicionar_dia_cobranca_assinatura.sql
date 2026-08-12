ALTER TABLE assinaturas
    ADD COLUMN dia_cobranca INTEGER;

UPDATE assinaturas
SET dia_cobranca = EXTRACT(
        DAY FROM (pix_pago_em AT TIME ZONE 'America/Sao_Paulo')::DATE
    ),
    proxima_cobranca = (
        (pix_pago_em AT TIME ZONE 'America/Sao_Paulo')::DATE
        + INTERVAL '1 month'
    )::DATE
WHERE status = 'ATIVA'
  AND pix_pago_em IS NOT NULL;

UPDATE assinaturas
SET dia_cobranca = EXTRACT(DAY FROM COALESCE(proxima_cobranca, inicio_assinatura))
WHERE dia_cobranca IS NULL
  AND COALESCE(proxima_cobranca, inicio_assinatura) IS NOT NULL;

ALTER TABLE assinaturas
    ADD CONSTRAINT chk_assinaturas_dia_cobranca
    CHECK (dia_cobranca BETWEEN 1 AND 31);
