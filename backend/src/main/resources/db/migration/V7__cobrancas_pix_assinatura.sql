ALTER TABLE assinaturas
    ADD COLUMN pix_txid VARCHAR(35),
    ADD COLUMN pix_status VARCHAR(30),
    ADD COLUMN pix_valor NUMERIC(12, 2),
    ADD COLUMN pix_criado_em TIMESTAMPTZ,
    ADD COLUMN pix_pago_em TIMESTAMPTZ;

CREATE UNIQUE INDEX idx_assinaturas_pix_txid
    ON assinaturas(pix_txid)
    WHERE pix_txid IS NOT NULL;
