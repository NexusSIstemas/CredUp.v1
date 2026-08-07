UPDATE assinaturas
SET plano = 'PROFISSIONAL',
    status = CASE
        WHEN status IN ('EM_TESTE', 'EXPIRADA') THEN 'AGUARDANDO_PAGAMENTO'
        ELSE status
    END,
    atualizado_em = CURRENT_TIMESTAMP;

ALTER TABLE assinaturas
    DROP COLUMN inicio_teste,
    DROP COLUMN fim_teste;
