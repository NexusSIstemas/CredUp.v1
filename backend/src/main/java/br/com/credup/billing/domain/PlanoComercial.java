package br.com.credup.billing.domain;

import br.com.credup.shared.domain.EntidadeBase;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "planos_assinatura")
public class PlanoComercial extends EntidadeBase {
    @Column(name = "codigo", nullable = false, unique = true, length = 30)
    private String codigo;

    @Column(name = "nome", nullable = false, length = 80)
    private String nome;

    @Column(name = "valor_mensal", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorMensal;

    @Column(name = "limite_operadores", nullable = false)
    private int limiteOperadores;

    @Column(name = "meses_historico", nullable = false)
    private int mesesHistorico;

    @Column(name = "relatorios_completos", nullable = false)
    private boolean relatoriosCompletos;

    @Column(name = "central_cobranca", nullable = false)
    private boolean centralCobranca;

    @Column(name = "indicadores_avancados", nullable = false)
    private boolean indicadoresAvancados;

    @Column(name = "importacao_exportacao", nullable = false)
    private boolean importacaoExportacao;

    @Column(name = "ativo", nullable = false)
    private boolean ativo;

    @Column(name = "ordem_exibicao", nullable = false)
    private int ordemExibicao;

    public String getCodigo() { return codigo; }
    public String getNome() { return nome; }
    public BigDecimal getValorMensal() { return valorMensal; }
    public int getLimiteOperadores() { return limiteOperadores; }
    public int getMesesHistorico() { return mesesHistorico; }
    public boolean isRelatoriosCompletos() { return relatoriosCompletos; }
    public boolean isCentralCobranca() { return centralCobranca; }
    public boolean isIndicadoresAvancados() { return indicadoresAvancados; }
    public boolean isImportacaoExportacao() { return importacaoExportacao; }
    public boolean isAtivo() { return ativo; }
    public int getOrdemExibicao() { return ordemExibicao; }
}
