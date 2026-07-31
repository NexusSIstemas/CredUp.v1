CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE usuarios (
    id UUID PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    sobrenome VARCHAR(120) NOT NULL,
    telefone VARCHAR(30),
    cpf VARCHAR(11) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil_acesso VARCHAR(30) NOT NULL,
    data_cadastro TIMESTAMPTZ NOT NULL,
    data_nascimento DATE
);

CREATE TABLE comerciantes (
    id UUID PRIMARY KEY REFERENCES usuarios(id)
);

CREATE TABLE comercios (
    id UUID PRIMARY KEY,
    nome_comercio VARCHAR(180) NOT NULL,
    cnpj VARCHAR(14) NOT NULL UNIQUE,
    rua VARCHAR(255),
    cidade VARCHAR(120),
    cep VARCHAR(8),
    numero_comercio VARCHAR(30),
    ponto_referencia VARCHAR(255),
    comerciante_id UUID NOT NULL REFERENCES comerciantes(id),
    status VARCHAR(20) NOT NULL
);

CREATE TABLE clientes_inadimplentes (
    id UUID PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    sobrenome VARCHAR(120) NOT NULL,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    telefone VARCHAR(30),
    residencia VARCHAR(255),
    descricao TEXT
);

CREATE INDEX idx_clientes_inadimplentes_nome ON clientes_inadimplentes(nome, sobrenome);
CREATE INDEX idx_clientes_inadimplentes_nome_trgm
    ON clientes_inadimplentes USING gin ((lower(nome || ' ' || sobrenome)) gin_trgm_ops);

CREATE TABLE dividas (
    id UUID PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES clientes_inadimplentes(id),
    comercio_id UUID NOT NULL REFERENCES comercios(id),
    valor_divida NUMERIC(15,2) NOT NULL CHECK (valor_divida > 0),
    data_divida DATE NOT NULL,
    descricao TEXT,
    possui_juros BOOLEAN NOT NULL DEFAULT FALSE,
    taxa_juros NUMERIC(7,4),
    status VARCHAR(30) NOT NULL
);

CREATE INDEX idx_dividas_cliente ON dividas(cliente_id);
CREATE INDEX idx_dividas_comercio_status ON dividas(comercio_id, status);
CREATE INDEX idx_dividas_valor ON dividas(valor_divida);

CREATE TABLE comentarios (
    id UUID PRIMARY KEY,
    autor_id UUID NOT NULL REFERENCES comerciantes(id),
    cliente_id UUID NOT NULL REFERENCES clientes_inadimplentes(id),
    texto TEXT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL
);

CREATE TABLE notificacoes (
    id UUID PRIMARY KEY,
    divida_id UUID NOT NULL REFERENCES dividas(id),
    canal VARCHAR(20) NOT NULL,
    enviado_em TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL
);

CREATE TABLE contestacoes (
    id UUID PRIMARY KEY,
    divida_id UUID NOT NULL UNIQUE REFERENCES dividas(id),
    motivo TEXT NOT NULL,
    aberto_em TIMESTAMPTZ NOT NULL,
    resolvido_em TIMESTAMPTZ,
    resolucao TEXT
);

CREATE TABLE registros_auditoria (
    id UUID PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    acao VARCHAR(100) NOT NULL,
    entidade_alvo VARCHAR(120) NOT NULL,
    alvo_id UUID NOT NULL,
    autor_nome VARCHAR(220),
    autor_perfil VARCHAR(50),
    alvo_descricao VARCHAR(300),
    detalhes TEXT,
    data_hora TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_registros_auditoria_alvo ON registros_auditoria(entidade_alvo, alvo_id);

CREATE TABLE pagamentos (
    id UUID PRIMARY KEY,
    data_inicio DATE NOT NULL,
    plano VARCHAR(80) NOT NULL,
    proximo_pagamento DATE,
    comerciante_id UUID NOT NULL UNIQUE REFERENCES comerciantes(id),
    status VARCHAR(20) NOT NULL
);
