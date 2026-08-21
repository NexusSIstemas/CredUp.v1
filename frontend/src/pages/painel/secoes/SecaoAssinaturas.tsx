import { CampoFlutuante } from '../../../components/CampoFlutuante'
import type { Assinatura, CobrancaPix, ConfiguracaoPublica, PagamentoAssinatura } from '../../../types'
import { ROTULOS_STATUS_ASSINATURA } from '../constantes'

interface PropriedadesSecaoAssinaturas {
  administrador: boolean
  gestor: boolean
  assinatura: Assinatura | null
  assinaturas: Assinatura[]
  assinaturasFiltradas: Assinatura[]
  historico: PagamentoAssinatura[]
  configuracao: ConfiguracaoPublica | null
  busca: string
  situacao: string
  cobrancaPix: CobrancaPix | null
  gerandoPix: boolean
  alterarBusca: (valor: string) => void
  alterarSituacao: (valor: string) => void
  gerarCobrancaPix: () => void
  cancelarAssinatura: (id: string) => void
  copiarPix: (codigo: string) => void
}

const formatarData = (data: string | null | undefined, alternativa = '—') =>
  data
    ? new Date(data.includes('T') ? data : `${data}T12:00:00`).toLocaleDateString('pt-BR')
    : alternativa

const formatarDataHora = (data: string | null | undefined) =>
  data ? new Date(data).toLocaleString('pt-BR') : '—'

const formatarMoeda = (valor: number | null | undefined) =>
  valor == null
    ? '—'
    : valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function SecaoAssinaturas({
  administrador,
  gestor,
  assinatura,
  assinaturas,
  assinaturasFiltradas,
  historico,
  configuracao,
  busca,
  situacao,
  cobrancaPix,
  gerandoPix,
  alterarBusca,
  alterarSituacao,
  gerarCobrancaPix,
  cancelarAssinatura,
  copiarPix
}: PropriedadesSecaoAssinaturas) {
  return <section className="visualizacao-secao animar-entrada" key="assinatura">
    <div className="titulo-secao">
      <div>
        <p className="sobretitulo">Plano e acesso</p>
        <h2>{administrador ? 'Relatório de assinaturas' : 'Minha assinatura'}</h2>
      </div>
      <p>{administrador
        ? 'Consulte em um só lugar a situação das assinaturas de todos os gestores.'
        : 'Esta é a área exclusiva para consultar seu plano, pagamento e vencimento.'}</p>
    </div>

    {!administrador && assinatura && <>
      <section className="painel-conteudo cartao-assinatura">
        <div className="cabecalho-relatorio-assinatura">
          <div>
            <small>VISUALIZANDO SUA ASSINATURA</small>
            <h2>{configuracao
              ? `Plano ${configuracao.nomePlano.toLocaleLowerCase('pt-BR')}`
              : 'Plano CredUp'}</h2>
          </div>
          <span className={`selo-assinatura ${assinatura.status.toLowerCase()}`}>
            {ROTULOS_STATUS_ASSINATURA[assinatura.status]}
          </span>
        </div>
        <p>{assinatura.status === 'AGUARDANDO_APROVACAO'
          ? 'O pagamento ficará disponível quando o administrador aprovar seu primeiro comércio.'
          : assinatura.status === 'ATIVA'
            ? 'Seu acesso completo está ativo, incluindo relatórios em PDF.'
            : assinatura.acessoOperacional
              ? `O pagamento está no período de tolerância de ${configuracao?.diasToleranciaPagamento ?? '—'} dias. Seu acesso permanece liberado enquanto aguardamos a confirmação.`
              : 'As funções operacionais estão bloqueadas até a confirmação do pagamento.'}</p>
        <dl className="detalhes-assinatura">
          <div><dt>Mensalidade</dt><dd>{formatarMoeda(configuracao?.valorMensal)}</dd></div>
          <div><dt>Próximo vencimento</dt><dd>{formatarData(assinatura.proximaCobranca, 'Após o primeiro pagamento')}</dd></div>
          <div><dt>Acesso ao sistema</dt><dd>{assinatura.acessoOperacional ? 'Liberado' : 'Bloqueado'}</dd></div>
        </dl>
        {gestor && ['AGUARDANDO_PAGAMENTO', 'EXPIRADA', 'ATRASADA', 'CANCELADA'].includes(assinatura.status) &&
          <button disabled={gerandoPix} onClick={gerarCobrancaPix}>
            {gerandoPix ? 'Gerando cobrança...' : 'Pagar assinatura com Pix'}
          </button>}
        {cobrancaPix && <div className="cobranca-pix animar-entrada">
          <h3>Pix de {formatarMoeda(cobrancaPix.valor)}</h3>
          <img src={cobrancaPix.qrCodeBase64} alt="QR Code da cobrança Pix" />
          <label>Pix Copia e Cola</label>
          <textarea readOnly value={cobrancaPix.pixCopiaECola} />
          <button className="pequeno" onClick={() => copiarPix(cobrancaPix.pixCopiaECola)}>Copiar código Pix</button>
          <p className={`status-pix ${['CONCLUIDA', 'processed'].includes(cobrancaPix.status) ? 'pago' : ''}`}>
            {['CONCLUIDA', 'processed'].includes(cobrancaPix.status)
              ? 'Pagamento confirmado pelo Mercado Pago'
              : 'Aguardando confirmação do Mercado Pago...'}
          </p>
          <small>{cobrancaPix.avisoConfirmacao}</small>
        </div>}
      </section>

      <section className="painel-conteudo">
        <div className="cabecalho-painel-conteudo">
          <div>
            <h2>Relatório da assinatura</h2>
            <p>Histórico acumulado de todos os seus pagamentos confirmados.</p>
          </div>
        </div>
        <div className="envoltorio-tabela">
          <table className="tabela-relatorio-assinaturas">
            <thead><tr><th>Pagamento confirmado em</th><th>Valor pago</th><th>Acesso renovado até</th></tr></thead>
            <tbody>{historico.map(pagamento => <tr key={pagamento.id}>
              <td>{formatarDataHora(pagamento.pagoEm)}</td>
              <td>{formatarMoeda(pagamento.valor)}</td>
              <td>{formatarData(pagamento.acessoValidoAte)}</td>
            </tr>)}{!historico.length && <tr><td colSpan={3} className="vazio">Nenhum pagamento confirmado até o momento.</td></tr>}</tbody>
          </table>
        </div>
        <small className="nota-relatorio-assinatura">Assinatura cadastrada em {formatarDataHora(assinatura.criadaEm)}. Por segurança, identificadores internos do pagamento não são exibidos.</small>
      </section>
    </>}

    {administrador && <>
      <div className="estatisticas estatisticas-assinaturas">
        <article><small>Total de assinaturas</small><strong>{assinaturas.length}</strong><span>gestores cadastrados</span></article>
        <article><small>Acessos liberados</small><strong>{assinaturas.filter(item => item.acessoOperacional).length}</strong><span>assinaturas com acesso</span></article>
        <article><small>Pagamentos confirmados</small><strong>{assinaturas.filter(item => item.ultimoPagamentoEm).length}</strong><span>último pagamento registrado</span></article>
      </div>
      <section className="painel-conteudo">
        <div className="cabecalho-painel-conteudo">
          <div><h2>Todas as assinaturas</h2><p>Relatório consolidado dos gestores cadastrados na rede.</p></div>
          <div className="filtros-assinaturas">
            <CampoFlutuante label="Buscar gestor"><input value={busca} onChange={event => alterarBusca(event.target.value)} placeholder=" " /></CampoFlutuante>
            <CampoFlutuante label="Situação"><select value={situacao} onChange={event => alterarSituacao(event.target.value)}><option value="TODAS">Todas</option>{Object.entries(ROTULOS_STATUS_ASSINATURA).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}</select></CampoFlutuante>
          </div>
        </div>
        <div className="envoltorio-tabela">
          <table className="tabela-relatorio-assinaturas">
            <thead><tr><th>Gestor</th><th>Situação</th><th>Início</th><th>Último pagamento</th><th>Valor pago</th><th>Vencimento</th><th>Acesso</th><th></th></tr></thead>
            <tbody>{assinaturasFiltradas.map(item => <tr key={item.id}>
              <td><strong>{item.nomeComerciante}</strong><small>{item.emailMascarado}</small></td>
              <td><span className={`indicador ${item.acessoOperacional ? 'aprovado' : 'rejeitado'}`}>{ROTULOS_STATUS_ASSINATURA[item.status]}</span></td>
              <td>{formatarData(item.inicioAssinatura)}</td>
              <td>{formatarDataHora(item.ultimoPagamentoEm)}</td>
              <td>{formatarMoeda(item.valorUltimoPagamento)}</td>
              <td>{formatarData(item.proximaCobranca)}</td>
              <td>{item.acessoOperacional ? 'Liberado' : 'Bloqueado'}</td>
              <td><button className="pequeno perigo" disabled={item.status === 'CANCELADA'} onClick={() => cancelarAssinatura(item.id)}>Cancelar</button></td>
            </tr>)}{!assinaturasFiltradas.length && <tr><td colSpan={8} className="vazio">Nenhuma assinatura encontrada com esses filtros.</td></tr>}</tbody>
          </table>
        </div>
      </section>
      <section className="painel-conteudo">
        <div className="cabecalho-painel-conteudo">
          <div><h2>Histórico de pagamentos</h2><p>Todos os pagamentos de assinatura confirmados na rede.</p></div>
        </div>
        <div className="envoltorio-tabela">
          <table className="tabela-relatorio-assinaturas">
            <thead><tr><th>Gestor</th><th>Pagamento confirmado em</th><th>Valor pago</th><th>Acesso renovado até</th></tr></thead>
            <tbody>{historico.map(pagamento => <tr key={pagamento.id}>
              <td><strong>{pagamento.nomeGestor}</strong><small>{pagamento.emailMascarado}</small></td>
              <td>{formatarDataHora(pagamento.pagoEm)}</td>
              <td>{formatarMoeda(pagamento.valor)}</td>
              <td>{formatarData(pagamento.acessoValidoAte)}</td>
            </tr>)}{!historico.length && <tr><td colSpan={4} className="vazio">Nenhum pagamento confirmado até o momento.</td></tr>}</tbody>
          </table>
        </div>
      </section>
    </>}
  </section>
}
