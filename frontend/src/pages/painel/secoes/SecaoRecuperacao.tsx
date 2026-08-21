import type { SolicitacaoRedefinicaoSenha } from '../../../types'

interface Propriedades {
  solicitacoes: SolicitacaoRedefinicaoSenha[]
  senhaTemporaria: string
  dadosVisiveis: boolean
  aprovar: (id: string) => void
  rejeitar: (id: string) => void
  fecharSenha: () => void
}

export function SecaoRecuperacao({
  solicitacoes,
  senhaTemporaria,
  dadosVisiveis,
  aprovar,
  rejeitar,
  fecharSenha
}: Propriedades) {
  return <section className="visualizacao-secao animar-entrada">
    <div className="titulo-secao"><div><p className="sobretitulo">Segurança</p><h2>Recuperação de senha</h2></div><p>Confirme a identidade do responsável antes de gerar uma senha temporária.</p></div>
    {senhaTemporaria && <div className="senha-temporaria animar-entrada"><div><small>Senha temporária — exibida somente agora</small><strong>{dadosVisiveis ? senhaTemporaria : '••••••••••'}</strong></div>{dadosVisiveis && <button onClick={() => navigator.clipboard.writeText(senhaTemporaria)}>Copiar senha</button>}<button className="perigo" onClick={fecharSenha}>Fechar</button></div>}
    <section className="painel-conteudo">
      <div className="cabecalho-painel-conteudo"><div><h2>Solicitações pendentes</h2><p>Analise os dados e confirme a identidade fora do sistema.</p></div><span className="quantidade-solicitacoes">{solicitacoes.length} pendente(s)</span></div>
      <div className="cartoes">{solicitacoes.map(solicitacao => <article className="cartao-comercio" key={solicitacao.id}><div><strong className={!dadosVisiveis ? 'oculto' : ''}>{dadosVisiveis ? solicitacao.nome : 'Responsável protegido'}</strong><small className={!dadosVisiveis ? 'oculto' : ''}>{dadosVisiveis ? `${solicitacao.nomeComercio} · ${solicitacao.cpfMascarado} · ${solicitacao.telefoneMascarado}` : `${solicitacao.nomeComercio} · ***.***.***-** · (**) *****-****`}</small></div><div><button className="pequeno" onClick={() => aprovar(solicitacao.id)}>Gerar senha</button><button className="pequeno perigo" onClick={() => rejeitar(solicitacao.id)}>Rejeitar</button></div></article>)}
        {!solicitacoes.length && <p className="vazio">Nenhuma solicitação pendente.</p>}</div>
    </section>
  </section>
}
