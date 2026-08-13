CREATE TABLE solicitacoes_comercio (
    id UUID PRIMARY KEY,
    nome_comercio VARCHAR(180) NOT NULL,
    cnpj VARCHAR(14) NOT NULL,
    rua VARCHAR(255),
    cidade VARCHAR(120),
    cep VARCHAR(8),
    numero_comercio VARCHAR(30),
    ponto_referencia VARCHAR(255),
    comerciante_id UUID NOT NULL REFERENCES comerciantes(id),
    status VARCHAR(20) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    versao_entidade BIGINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX idx_solicitacoes_comercio_cnpj_pendente
    ON solicitacoes_comercio(cnpj)
    WHERE status = 'PENDING';

INSERT INTO solicitacoes_comercio (
    id,
    nome_comercio,
    cnpj,
    rua,
    cidade,
    cep,
    numero_comercio,
    ponto_referencia,
    comerciante_id,
    status,
    criado_em,
    atualizado_em,
    versao_entidade
)
SELECT
    id,
    nome_comercio,
    cnpj,
    rua,
    cidade,
    cep,
    numero_comercio,
    ponto_referencia,
    comerciante_id,
    status,
    criado_em,
    atualizado_em,
    versao_entidade
FROM comercios
WHERE status IN ('PENDING', 'REJECTED')
  AND NOT EXISTS (
      SELECT 1
      FROM dividas
      WHERE dividas.comercio_id = comercios.id
  );

DELETE FROM comercios
WHERE status IN ('PENDING', 'REJECTED')
  AND NOT EXISTS (
      SELECT 1
      FROM dividas
      WHERE dividas.comercio_id = comercios.id
  );

ALTER TABLE comercios
    ALTER COLUMN status SET DEFAULT 'APPROVED';
