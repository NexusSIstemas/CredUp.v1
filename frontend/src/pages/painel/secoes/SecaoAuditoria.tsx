import type { RegistroAuditoria } from '../../../types'
import { ROTULOS_PERFIL, descreverAcaoAuditoria } from '../constantes'

interface Propriedades {
  registros: RegistroAuditoria[]
  online: boolean
}

export function SecaoAuditoria({ registros, online }: Propriedades) {
  return <section className="visualizacao-secao animar-entrada">
    <div className="titulo-secao"><div><p className="sobretitulo">Segurança e rastreabilidade</p><h2>Logs do sistema</h2></div>
      <p><span className={`indicador ${online ? 'aprovado' : 'rejeitado'}`}>{online ? 'Atualização em tempo real' : 'Reconectando…'}</span></p></div>
    <section className="painel-conteudo">
      <div className="cabecalho-painel-conteudo"><div><h2>Atividades recentes</h2><p>Últimos 200 eventos de auditoria, atualizados automaticamente.</p></div><span>{registros.length} evento(s)</span></div>
      <div className="envoltorio-tabela"><table><thead><tr><th>Data e hora</th><th>Quem fez</th><th>O que fez</th><th>Para quem/qual item</th><th>Detalhes</th></tr></thead>
        <tbody>{registros.map(registro => <tr key={registro.id}>
          <td>{new Date(registro.dataHora).toLocaleString('pt-BR')}</td>
          <td><strong>{registro.nomeUsuario}</strong><br /><small>{ROTULOS_PERFIL[registro.perfilAcesso]}</small></td>
          <td>{descreverAcaoAuditoria(registro)}</td>
          <td><strong>{registro.alvoDescricao ?? registro.entidade}</strong><br /><small>{registro.entidade} · <code>{registro.alvoId}</code></small></td>
          <td>{registro.detalhes ?? 'Sem detalhes adicionais'}</td>
        </tr>)}
        {!registros.length && <tr><td colSpan={5} className="vazio">Nenhum evento de auditoria registrado.</td></tr>}</tbody></table></div>
    </section>
  </section>
}
