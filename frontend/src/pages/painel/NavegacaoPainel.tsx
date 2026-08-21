import type { Assinatura, Perfil, Sessao } from '../../types'
import {
  ROTULOS_PERFIL,
  ROTULOS_STATUS_ASSINATURA,
  type SecaoPainel
} from './constantes'

export interface PropriedadesNavegacao {
  sessao: Sessao
  perfil: Perfil | null
  assinatura: Assinatura | null
  secao: SecaoPainel
  quantidadeRecuperacoes: number
  dadosVisiveis: boolean
  administrador: boolean
  dono: boolean
  funcionario: boolean
  abrirSecao: (secao: SecaoPainel) => void
  alternarPrivacidade: () => void
  sair: () => void
}

export function BarraLateralPainel({
  sessao,
  perfil,
  assinatura,
  secao,
  quantidadeRecuperacoes,
  dadosVisiveis,
  administrador,
  dono,
  funcionario,
  abrirSecao,
  alternarPrivacidade,
  sair
}: PropriedadesNavegacao) {
  const nome = perfil?.nome ?? sessao.nome

  return <aside>
      <a className="marca" href="#"><span>C</span> CredUp</a>
      <div className="mensagem-lateral"><small>Ambiente protegido</small><p>Gestão colaborativa para decisões de crédito mais seguras.</p></div>
      {!funcionario && <button className={`botao-assinatura-lateral ${secao === 'assinatura' ? 'ativo' : ''}`} onClick={() => abrirSecao('assinatura')}>
        <span className="icone-assinatura-lateral">A</span>
        <span><strong>{administrador ? 'Assinaturas' : 'Minha assinatura'}</strong><small>{administrador ? 'Gerenciar planos' : assinatura ? ROTULOS_STATUS_ASSINATURA[assinatura.status] : 'Ver meu plano'}</small></span>
      </button>}
      <button className="perfil botao-perfil" onClick={() => abrirSecao('perfil')}><div className="avatar">{nome[0]}</div><div><strong>{nome}</strong><small>{ROTULOS_PERFIL[sessao.perfilAcesso]}</small></div></button>
      <button className="fantasma" onClick={sair}>Sair</button>
    </aside>
}

export function CabecalhoPainel({
  sessao,
  perfil,
  secao,
  quantidadeRecuperacoes,
  dadosVisiveis,
  administrador,
  dono,
  funcionario,
  abrirSecao,
  alternarPrivacidade
}: PropriedadesNavegacao) {
  const nome = perfil?.nome ?? sessao.nome

  return <header className="cabecalho-painel">
      <div><p className="sobretitulo">Rede CredUp</p></div>
      <div className="acoes-cabecalho">
        <nav className="navegacao-superior" aria-label="Seções principais">
          <button className={secao === 'overview' ? 'ativo' : ''} onClick={() => abrirSecao('overview')}>Visão geral</button>
          {!funcionario && <button className={secao === 'commerces' ? 'ativo' : ''} onClick={() => abrirSecao('commerces')}>Comércios</button>}
          <button className={secao === 'defaults' ? 'ativo' : ''} onClick={() => abrirSecao('defaults')}>Inadimplentes</button>
          {dono && <button className={secao === 'staff' ? 'ativo' : ''} onClick={() => abrirSecao('staff')}>Operadores</button>}
          {administrador && <button className={secao === 'recovery' ? 'ativo' : ''} onClick={() => abrirSecao('recovery')}>
            Recuperação {quantidadeRecuperacoes > 0 && <span>{quantidadeRecuperacoes}</span>}
          </button>}
          {administrador && <button className={secao === 'auditoria' ? 'ativo' : ''} onClick={() => abrirSecao('auditoria')}>Logs</button>}
          <button className={`botao-perfil-navegacao ${secao === 'perfil' ? 'ativo' : ''}`} onClick={() => abrirSecao('perfil')} aria-label="Abrir meu perfil">
            <b className="avatar-perfil-navegacao">{nome[0]}</b><small>Meu perfil</small>
          </button>
        </nav>
        <button className={`alternar-privacidade ${dadosVisiveis ? 'visivel' : ''}`} onClick={alternarPrivacidade}
          aria-label={dadosVisiveis ? 'Ocultar todos os dados sensíveis' : 'Exibir dados sensíveis'}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
            <circle cx="12" cy="12" r="2.75" />
            {!dadosVisiveis && <path d="m4 4 16 16" />}
          </svg>
          {dadosVisiveis ? 'Ocultar dados' : 'Exibir dados'}
        </button>
      </div>
    </header>
}
