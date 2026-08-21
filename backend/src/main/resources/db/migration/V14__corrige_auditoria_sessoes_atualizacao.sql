ALTER TABLE sessoes_atualizacao
    RENAME COLUMN created_at TO criado_em;

ALTER TABLE sessoes_atualizacao
    RENAME COLUMN updated_at TO atualizado_em;

ALTER TABLE sessoes_atualizacao
    ADD COLUMN versao_entidade BIGINT NOT NULL DEFAULT 0;
