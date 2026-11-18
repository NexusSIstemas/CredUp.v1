import { useEffect, useState } from 'react'
import type { SolicitacaoRedefinicaoSenha, UsuarioRecuperacao } from '../../../types'

interface Propriedades {
  solicitacoes: SolicitacaoRedefinicaoSenha[]
  senhaTemporaria: string
  emailSenhaTemporaria: string
  dadosVisiveis: boolean
  buscaUsuarios: string
  usuariosEncontrados: UsuarioRecuperacao[]
  buscandoUsuarios: boolean
  aprovar: (id: string) => void
  rejeitar: (id: string) => void
  alterarBuscaUsuarios: (valor: string) => void
  gerarSenhaDireta: (idUsuario: string) => void
  fecharSenha: () => void
}

const rotulosPerfil: Record<UsuarioRecuperacao['perfilAcesso'], string> = {
  ADMIN_REDE: 'Administrador',
  MERCHANT_OWNER: 'Gestor',
  MERCHANT_STAFF: 'Operador'
}

export function SecaoRecuperacao({
  solicitacoes,
  senhaTemporaria,
  emailSenhaTemporaria,
  dadosVisiveis,
  buscaUsuarios,
  usuariosEncontrados,
  buscandoUsuarios,
  aprovar,
  rejeitar,
  alterarBuscaUsuarios,
  gerarSenhaDireta,
  fecharSenha
}: Propriedades) {
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioRecuperacao | null>(null)

  useEffect(() => {
    setUsuarioSelecionado(null)
  }, [buscaUsuarios])

  return <section className="visualizacao-secao animar-entrada">
    <div className="titulo-secao"><div><p className="sobretitulo">Segurança</p><h2>Recuperação de senha</h2></div><p>Confirme a identidade do responsável antes de gerar uma senha temporária.</p></div>
    {senhaTemporaria && <div className="senha-temporaria animar-entrada"><div><small>Senha temporária — exibida somente agora</small><strong>{senhaTemporaria}</strong>{emailSenhaTemporaria && <small>Conta: {emailSenhaTemporaria}</small>}</div><button type="button" onClick={() => navigator.clipboard.writeText(senhaTemporaria)}>Copiar senha</button><button type="button" className="perigo" onClick={fecharSenha}>Fechar</button></div>}
    <section className="painel-conteudo">
      <div className="cabecalho-painel-conteudo"><div><h2 id="titulo-busca-recuperacao">Localizar conta</h2><p>Digite o nome completo para encontrar um gestor ou operador e selecione a conta correta.</p></div></div>
      <search>
        <form className="formulario-compacto" aria-labelledby="titulo-busca-recuperacao" onSubmit={event => event.preventDefault()}>
          <label htmlFor="busca-usuario-recuperacao">Nome completo</label>
          <input id="busca-usuario-recuperacao" name="nome" type="search" value={buscaUsuarios} onChange={event => alterarBuscaUsuarios(event.target.value)} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} enterKeyHint="search" placeholder="Digite o nome do gestor ou operador" />
          <p id="status-busca-recuperacao" role="status" aria-live="polite">{buscaUsuarios.trim() ? buscandoUsuarios ? 'Buscando contas…' : `${usuariosEncontrados.length} conta(s) encontrada(s).` : 'Digite ao menos uma letra para buscar.'}</p>
        </form>
      </search>
      {buscaUsuarios.trim() && !buscandoUsuarios && <div className="cartoes" role="list" aria-describedby="status-busca-recuperacao">{usuariosEncontrados.map(usuario => <article className="cartao-comercio" role="listitem" key={usuario.id}><div><strong>{usuario.nomeCompleto}</strong><small>{usuario.email} · {rotulosPerfil[usuario.perfilAcesso]}</small></div><button type="button" className={usuarioSelecionado?.id === usuario.id ? 'pequeno ativo' : 'pequeno'} aria-pressed={usuarioSelecionado?.id === usuario.id} onClick={() => setUsuarioSelecionado(usuario)}>{usuarioSelecionado?.id === usuario.id ? 'Selecionado' : 'Selecionar'}</button></article>)}{!usuariosEncontrados.length && <p className="vazio">Nenhuma conta encontrada.</p>}</div>}
      {usuarioSelecionado && <div className="senha-temporaria animar-entrada"><div><small>Conta selecionada</small><strong>{usuarioSelecionado.nomeCompleto}</strong><small>{usuarioSelecionado.email} · {rotulosPerfil[usuarioSelecionado.perfilAcesso]}</small></div><button type="button" onClick={() => gerarSenhaDireta(usuarioSelecionado.id)}>Gerar senha temporária</button></div>}
    </section>
    <section className="painel-conteudo">
      <div className="cabecalho-painel-conteudo"><div><h2>Solicitações pendentes</h2><p>Analise os dados e confirme a identidade fora do sistema.</p></div><span className="quantidade-solicitacoes">{solicitacoes.length} pendente(s)</span></div>
      <div className="cartoes">{solicitacoes.map(solicitacao => <article className="cartao-comercio" key={solicitacao.id}><div><strong className={!dadosVisiveis ? 'oculto' : ''}>{dadosVisiveis ? solicitacao.nome : 'Responsável protegido'}</strong><small>{solicitacao.email} · {solicitacao.telefone} · {dadosVisiveis ? solicitacao.cpfMascarado : '***.***.***-**'}</small><small>{solicitacao.nomeComercio}</small></div><div><button type="button" className="pequeno" onClick={() => aprovar(solicitacao.id)}>Gerar senha</button><button type="button" className="pequeno perigo" onClick={() => rejeitar(solicitacao.id)}>Rejeitar</button></div></article>)}
        {!solicitacoes.length && <p className="vazio">Nenhuma solicitação pendente.</p>}</div>
    </section>
  </section>
}
