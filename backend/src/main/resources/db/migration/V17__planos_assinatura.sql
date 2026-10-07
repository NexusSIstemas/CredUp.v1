CREATE TABLE planos_assinatura (
    id UUID PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nome VARCHAR(80) NOT NULL,
    valor_mensal NUMERIC(10, 2) NOT NULL CHECK (valor_mensal > 0),
    limite_operadores INTEGER NOT NULL CHECK (limite_operadores BETWEEN 1 AND 1000),
    meses_historico INTEGER NOT NULL CHECK (meses_historico BETWEEN 0 AND 1200),
    relatorios_completos BOOLEAN NOT NULL,
    central_cobranca BOOLEAN NOT NULL,
    indicadores_avancados BOOLEAN NOT NULL,
    importacao_exportacao BOOLEAN NOT NULL,
    ativo BOOLEAN NOT NULL,
    ordem_exibicao INTEGER NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL,
    versao_entidade BIGINT NOT NULL DEFAULT 0
);

INSERT INTO planos_assinatura (
    id, codigo, nome, valor_mensal, limite_operadores, meses_historico,
    relatorios_completos, central_cobranca, indicadores_avancados,
    importacao_exportacao, ativo, ordem_exibicao, criado_em, atualizado_em
) VALUES
    ('10000000-0000-0000-0000-000000000001', 'ESSENCIAL', 'Essencial', 39.90, 3, 6, FALSE, FALSE, FALSE, FALSE, TRUE, 1, NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000002', 'GESTAO', 'Gestão', 69.90, 6, 24, TRUE, TRUE, TRUE, FALSE, TRUE, 2, NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000003', 'REDE', 'Rede', 99.90, 10, 0, TRUE, TRUE, TRUE, TRUE, TRUE, 3, NOW(), NOW());

ALTER TABLE assinaturas ADD COLUMN plano_id UUID;
ALTER TABLE assinaturas ADD COLUMN proximo_plano_id UUID;

UPDATE assinaturas
SET plano_id = '10000000-0000-0000-0000-000000000001';

ALTER TABLE assinaturas
    ALTER COLUMN plano_id SET NOT NULL,
    ADD CONSTRAINT fk_assinaturas_plano
        FOREIGN KEY (plano_id) REFERENCES planos_assinatura(id),
    ADD CONSTRAINT fk_assinaturas_proximo_plano
        FOREIGN KEY (proximo_plano_id) REFERENCES planos_assinatura(id),
    DROP COLUMN plano;
