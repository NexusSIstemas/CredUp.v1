ALTER TABLE usuarios ADD COLUMN deve_alterar_senha BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE solicitacoes_redefinicao_senha (
    id UUID PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    nome_comercio VARCHAR(180) NOT NULL,
    status VARCHAR(20) NOT NULL,
    solicitado_em TIMESTAMPTZ NOT NULL,
    resolvido_em TIMESTAMPTZ
);

CREATE INDEX idx_redefinicao_senha_status ON solicitacoes_redefinicao_senha(status, solicitado_em);
CREATE UNIQUE INDEX idx_redefinicao_senha_unica_pendente
    ON solicitacoes_redefinicao_senha(usuario_id) WHERE status = 'PENDING';
