-- Mantém os nomes já existentes e substitui nome/sobrenome por um único campo.
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS nome_completo VARCHAR(240);

UPDATE usuarios
SET nome_completo = BTRIM(CONCAT_WS(' ', nome, sobrenome))
WHERE nome_completo IS NULL OR BTRIM(nome_completo) = '';

ALTER TABLE usuarios
    ALTER COLUMN nome_completo SET NOT NULL,
    DROP COLUMN IF EXISTS nome,
    DROP COLUMN IF EXISTS sobrenome;

ALTER TABLE clientes_inadimplentes
    ADD COLUMN IF NOT EXISTS nome_completo VARCHAR(240);

UPDATE clientes_inadimplentes
SET nome_completo = BTRIM(CONCAT_WS(' ', nome, sobrenome))
WHERE nome_completo IS NULL OR BTRIM(nome_completo) = '';

ALTER TABLE clientes_inadimplentes
    ALTER COLUMN nome_completo SET NOT NULL,
    DROP COLUMN IF EXISTS nome,
    DROP COLUMN IF EXISTS sobrenome;

DROP INDEX IF EXISTS idx_clientes_inadimplentes_nome;
DROP INDEX IF EXISTS idx_clientes_inadimplentes_nome_trgm;

CREATE INDEX IF NOT EXISTS idx_clientes_inadimplentes_nome
    ON clientes_inadimplentes(nome_completo);

CREATE INDEX IF NOT EXISTS idx_clientes_inadimplentes_nome_trgm
    ON clientes_inadimplentes USING gin (lower(nome_completo) gin_trgm_ops);
