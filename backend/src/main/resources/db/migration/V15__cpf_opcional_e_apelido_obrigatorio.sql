UPDATE clientes_inadimplentes
SET apelido = nome
WHERE apelido IS NULL OR BTRIM(apelido) = '';

ALTER TABLE clientes_inadimplentes
    ALTER COLUMN apelido SET NOT NULL,
    ALTER COLUMN cpf DROP NOT NULL;
