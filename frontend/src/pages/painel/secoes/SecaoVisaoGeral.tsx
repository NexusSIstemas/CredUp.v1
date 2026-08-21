import type { Comercio, Divida, Funcionario, SolicitacaoRedefinicaoSenha } from '../../../types'
import type { SecaoPainel } from '../constantes'

interface Propriedades {
  dividas: Divida[]
  comercios: Comercio[]
  funcionarios: Funcionario[]
  solicitacoes: SolicitacaoRedefinicaoSenha[]
  dadosVisiveis: boolean
  administrador: boolean
  dono: boolean
  funcionario: boolean
  abrirSecao: (secao: SecaoPainel) => void
}

export function SecaoVisaoGeral({
  dividas,
  comercios,
  funcionarios,
  solicitacoes,
  dadosVisiveis,
  administrador,
  dono,
  funcionario,
  abrirSecao
}: Propriedades) {
  const dividasAbertas = dividas.filter(
    divida => divida.status !== 'PAID' && divida.status !== 'CANCELED'
  )
  const valorAberto = dividasAbertas.reduce(
    (total, divida) => total + divida.valorDivida,
    0
  )

  return <section className="visualizacao-secao animar-entrada">
    <div className="titulo-secao"><div><p className="sobretitulo">Resumo da rede</p><h2>Visão geral</h2></div><p>Acompanhe os principais números antes de entrar nos detalhes.</p></div>
    <div className={`estatisticas ${funcionario ? 'duas-colunas' : ''}`}>
      <article><small>Registros encontrados</small><strong>{dividas.length}</strong><span>clientes na consulta atual</span></article>
      <article><small>Valor total em aberto</small><strong className={!dadosVisiveis ? 'oculto' : ''}>{dadosVisiveis ? valorAberto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ ••••••'}</strong><span>não inclui dívidas pagas ou canceladas</span></article>
      {!funcionario && <article><small>Comércios aprovados</small><strong>{comercios.filter(comercio => comercio.status === 'APPROVED').length}</strong><span>estabelecimentos ativos na rede</span></article>}
    </div>
    <div className="grade-visao-geral">
      {!funcionario && <button className="atalho-visao-geral" onClick={() => abrirSecao('commerces')}><span>01</span><div><strong>Gerenciar comércios</strong><small>Cadastros, aprovações e situação dos mercados</small></div><b>→</b></button>}
      <button className="atalho-visao-geral" onClick={() => abrirSecao('defaults')}><span>{funcionario ? '01' : '02'}</span><div><strong>Consultar inadimplentes</strong><small>Buscas, informações e situação dos clientes</small></div><b>→</b></button>
      {dono && <button className="atalho-visao-geral" onClick={() => abrirSecao('staff')}><span>03</span><div><strong>Gerenciar funcionários</strong><small>{funcionarios.length} funcionário(s) vinculado(s)</small></div><b>→</b></button>}
      {administrador && <button className="atalho-visao-geral" onClick={() => abrirSecao('recovery')}><span>03</span><div><strong>Recuperar acessos</strong><small>{solicitacoes.length} solicitação(ões) aguardando análise</small></div><b>→</b></button>}
    </div>
  </section>
}
