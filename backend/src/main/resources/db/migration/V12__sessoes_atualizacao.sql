CREATE TABLE sessoes_atualizacao (
    id UUID PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    familia_id UUID NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expira_em TIMESTAMPTZ NOT NULL,
    revogado_em TIMESTAMPTZ,
    substituido_por_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_sessoes_atualizacao_usuario ON sessoes_atualizacao(usuario_id);
CREATE INDEX idx_sessoes_atualizacao_familia ON sessoes_atualizacao(familia_id);
CREATE INDEX idx_sessoes_atualizacao_expiracao ON sessoes_atualizacao(expira_em);
