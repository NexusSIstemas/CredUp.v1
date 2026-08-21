CREATE TABLE pagamentos_assinatura (
    id UUID PRIMARY KEY,
    assinatura_id UUID NOT NULL REFERENCES assinaturas(id),
    referencia_externa VARCHAR(100) NOT NULL UNIQUE,
    valor NUMERIC(12, 2) NOT NULL,
    pago_em TIMESTAMPTZ NOT NULL,
    acesso_valido_ate DATE NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    versao_entidade BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_pagamentos_assinatura_assinatura_pago
    ON pagamentos_assinatura(assinatura_id, pago_em DESC);

INSERT INTO pagamentos_assinatura (
    id,
    assinatura_id,
    referencia_externa,
    valor,
    pago_em,
    acesso_valido_ate,
    criado_em,
    atualizado_em,
    versao_entidade
)
SELECT
    gen_random_uuid(),
    id,
    pix_txid,
    pix_valor,
    pix_pago_em,
    proxima_cobranca,
    pix_pago_em,
    pix_pago_em,
    0
FROM assinaturas
WHERE pix_pago_em IS NOT NULL
  AND pix_txid IS NOT NULL
  AND pix_valor IS NOT NULL
  AND proxima_cobranca IS NOT NULL;
