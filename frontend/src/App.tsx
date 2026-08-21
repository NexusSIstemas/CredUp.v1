import { PaginaAutenticacao } from './pages/PaginaAutenticacao'
import { PaginaPainel } from './pages/PaginaPainel'
import { useSessao } from './hooks/useSessao'
import { PaginaAlteracaoSenha } from './pages/PaginaAlteracaoSenha'

export default function Aplicacao() {
  const { sessao, setSessao, validando, sair } = useSessao()

  if (validando) {
    return <main className="pagina-centralizada">
      <p className="sobretitulo">Verificando acesso seguro…</p>
    </main>
  }

  if (!sessao) return <PaginaAutenticacao onAuth={setSessao} />
  if (sessao.deveAlterarSenha) {
    return <PaginaAlteracaoSenha onChanged={setSessao} onLogout={sair} />
  }
  return <PaginaPainel sessao={sessao} onSessaoChange={setSessao} onLogout={sair} />
}
