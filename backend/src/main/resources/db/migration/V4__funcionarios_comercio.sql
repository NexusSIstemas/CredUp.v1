ALTER TABLE usuarios ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE funcionarios_comercio (
    id UUID PRIMARY KEY REFERENCES usuarios(id),
    responsavel_id UUID NOT NULL REFERENCES comerciantes(id)
);

CREATE INDEX idx_funcionarios_comercio_responsavel ON funcionarios_comercio(responsavel_id);
