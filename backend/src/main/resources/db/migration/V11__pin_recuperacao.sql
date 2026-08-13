ALTER TABLE usuarios
    ADD COLUMN pin_recuperacao_hash VARCHAR(100),
    ADD COLUMN versao_credenciais BIGINT NOT NULL DEFAULT 0;
