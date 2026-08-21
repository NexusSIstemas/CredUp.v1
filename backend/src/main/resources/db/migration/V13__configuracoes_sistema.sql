CREATE TABLE configuracoes_sistema (
    id UUID PRIMARY KEY,
    nome_plano VARCHAR(80) NOT NULL,
    valor_mensal NUMERIC(10, 2) NOT NULL CHECK (valor_mensal > 0),
    dias_tolerancia_pagamento INTEGER NOT NULL
        CHECK (dias_tolerancia_pagamento BETWEEN 0 AND 30),
    criado_em TIMESTAMPTZ NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL,
    versao_entidade BIGINT NOT NULL DEFAULT 0
);

INSERT INTO configuracoes_sistema (
    id,
    nome_plano,
    valor_mensal,
    dias_tolerancia_pagamento,
    criado_em,
    atualizado_em,
    versao_entidade
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Profissional',
    39.90,
    3,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    0
);
