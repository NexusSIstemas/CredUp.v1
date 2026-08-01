CREATE TABLE assinaturas (
    id UUID PRIMARY KEY,
    comerciante_id UUID NOT NULL UNIQUE REFERENCES comerciantes(id),
    plano VARCHAR(30) NOT NULL,
    status VARCHAR(40) NOT NULL,
    inicio_teste DATE,
    fim_teste DATE,
    inicio_assinatura DATE,
    proxima_cobranca DATE,
    solicitacao_ativacao_em TIMESTAMPTZ,
    cancelada_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    versao_entidade BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_assinaturas_status
    ON assinaturas(status);

INSERT INTO assinaturas (
    id,
    comerciante_id,
    plano,
    status
)
SELECT
    gen_random_uuid(),
    comerciante.id,
    'TESTE',
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM comercios comercio
            WHERE comercio.comerciante_id = comerciante.id
              AND comercio.status = 'APPROVED'
        ) THEN 'EM_TESTE'
        ELSE 'AGUARDANDO_APROVACAO'
    END
FROM comerciantes comerciante;

UPDATE assinaturas
SET inicio_teste = CURRENT_DATE,
    fim_teste = CURRENT_DATE + 30
WHERE status = 'EM_TESTE';
