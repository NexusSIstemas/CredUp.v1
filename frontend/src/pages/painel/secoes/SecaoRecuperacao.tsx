import type { SolicitacaoRedefinicaoSenha } from '../../../types'

interface Propriedades {
  solicitacoes: SolicitacaoRedefinicaoSenha[]
  senhaTemporaria: string
  emailSenhaTemporaria: string
  dadosVisiveis: boolean
  aprovar: (id: string) => void
  rejeitar: (id: string) => void
  gerarSenhaDireta: (idUsuario: string) => void
  fecharSenha: () => void
}

export function SecaoRecuperacao({
  solicitacoes,
  senhaTemporaria,
  emailSenhaTemporaria,
  dadosVisiveis,
  aprovar,
  rejeitar,
  gerarSenhaDireta,
  fecharSenha
}: Propriedades) {
  return <section className="visualizacao-secao animar-entrada">
    <div className="titulo-secao"><div><p className="sobretitulo">Segurança</p><h2>Recuperação de senha</h2></div><p>Confirme a identidade do responsável antes de gerar uma senha temporária.</p></div>
    {senhaTemporaria && <div className="senha-temporaria animar-entrada"><div><small>Senha temporária — exibida somente agora</small><strong>{senhaTemporaria}</strong>{emailSenhaTemporaria && <small>Conta: {emailSenhaTemporaria}</small>}</div><button type="button" onClick={() => navigator.clipboard.writeText(senhaTemporaria)}>Copiar senha</button><button type="button" className="perigo" onClick={fecharSenha}>Fechar</button></div>}
    <section className="painel-conteudo">
      <div className="cabecalho-painel-conteudo"><div><h2>Gerar senha temporária</h2><p>Use apenas após validar a solicitação fora do sistema. A senha é exibida uma única vez.</p></div></div>
      <form className="formulario-compacto" aria-label="Gerar senha temporária por identificador" onSubmit={event => {
        event.preventDefault()
        const idUsuario = String(new FormData(event.currentTarget).get('idUsuario') ?? '').trim()
        if (idUsuario) gerarSenhaDireta(idUsuario)
      }}>
        <label htmlFor="id-usuario-recuperacao">Identificador do usuário</label>
        <input id="id-usuario-recuperacao" name="idUsuario" type="text" autoComplete="off" spellCheck={false} placeholder="00000000-0000-0000-0000-000000000000" required />
        <button type="submit">Gerar senha temporária</button>
      </form>
    </section>
    <section className="painel-conteudo">
      <div className="cabecalho-painel-conteudo"><div><h2>Solicitações pendentes</h2><p>Analise os dados e confirme a identidade fora do sistema.</p></div><span className="quantidade-solicitacoes">{solicitacoes.length} pendente(s)</span></div>
      <div className="cartoes">{solicitacoes.map(solicitacao => <article className="cartao-comercio" key={solicitacao.id}><div><strong className={!dadosVisiveis ? 'oculto' : ''}>{dadosVisiveis ? solicitacao.nome : 'Responsável protegido'}</strong><small>{solicitacao.email} · {solicitacao.telefone} · {dadosVisiveis ? solicitacao.cpfMascarado : '***.***.***-**'}</small><small>{solicitacao.nomeComercio}</small></div><div><button type="button" className="pequeno" onClick={() => aprovar(solicitacao.id)}>Gerar senha</button><button type="button" className="pequeno perigo" onClick={() => rejeitar(solicitacao.id)}>Rejeitar</button></div></article>)}
        {!solicitacoes.length && <p className="vazio">Nenhuma solicitação pendente.</p>}</div>
    </section>
  </section>
}
