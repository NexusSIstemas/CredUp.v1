ALTER TABLE clientes_inadimplentes
    ADD COLUMN apelido VARCHAR(120);

CREATE INDEX idx_clientes_inadimplentes_apelido_trgm
    ON clientes_inadimplentes
    USING gin (lower(apelido) gin_trgm_ops);
