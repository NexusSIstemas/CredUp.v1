import { FormEvent, useEffect, useState } from 'react'
import { api, baixarArquivo } from '../services/api'
import {
  confirmarExclusao,
  mostrarAlerta,
  type TomAlerta
} from '../services/alertas'
import type {
  Assinatura,
  CobrancaPix,
  StatusCobrancaPix,
  ConfiguracaoPublica,
  Divida,
  Funcionario,
  PagamentoAssinatura,
  Pagina,
  PlanoComercial,
  SolicitacaoRedefinicaoSenha,
  Perfil,
  RegistroAuditoria,
  Sessao,
  UsuarioRecuperacao
} from '../types'
import type { SecaoPainel } from './painel/constantes'
import {
  obterValorMoeda,
  somenteDigitos
} from './painel/formatadores'
import { SecaoAuditoria } from './painel/secoes/SecaoAuditoria'
import { SecaoRecuperacao } from './painel/secoes/SecaoRecuperacao'
import { SecaoVisaoGeral } from './painel/secoes/SecaoVisaoGeral'
import { SecaoFuncionarios } from './painel/secoes/SecaoFuncionarios'
import { SecaoAssinaturas } from './painel/secoes/SecaoAssinaturas'
import { SecaoComercios } from './painel/secoes/SecaoComercios'
import { SecaoPerfil } from './painel/secoes/SecaoPerfil'
import { SecaoInadimplentes } from './painel/secoes/SecaoInadimplentes'
import { BarraLateralPainel, CabecalhoPainel } from './painel/NavegacaoPainel'
import { useComercios } from './painel/hooks/useComercios'

export function PaginaPainel({ sessao, onSessaoChange, onLogout }: {
  sessao: Sessao
  onSessaoChange: (sessao: Sessao) => void
  onLogout: () => void
}) {
  const [section, setSecao] = useState<SecaoPainel>('overview')
  const [sidebarCollapsed, setBarraLateralRecolhida] = useState(false)
  const [privacyVisible, setPrivacyVisible] = useState(false)
  const {
    comercios: commerces,
    carregados: commercesLoaded,
    emEdicao: editingCommerce,
    definirEmEdicao: setEditingCommerce,
    carregar: loadComercios,
    solicitarCadastro: createComercio,
    salvarEdicao: updateComercio,
    excluir: deleteComercio,
    avaliar: review
  } = useComercios()
  const [debts, setDividas] = useState<Divida[]>([])
  const [query, setQuery] = useState('')
  const [resetRequests, setResetRequests] = useState<SolicitacaoRedefinicaoSenha[]>([])
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [temporaryPasswordEmail, setEmailSenhaTemporaria] = useState('')
  const [userRecoveryQuery, setBuscaUsuarioRecuperacao] = useState('')
  const [recoveryUsers, setUsuariosRecuperacao] = useState<UsuarioRecuperacao[]>([])
  const [recoveryUsersLoading, setBuscandoUsuariosRecuperacao] = useState(false)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [employees, setFuncionarios] = useState<Funcionario[]>([])
  const [staffPassword, setStaffPassword] = useState('')
  const [auditRecords, setRegistrosAuditoria] = useState<RegistroAuditoria[]>([])
  const [auditOnline, setAuditoriaOnline] = useState(false)
  const [generatingReport, setGerandoRelatorio] = useState(false)
  const [subscription, setAssinatura] = useState<Assinatura | null>(null)
  const [subscriptions, setAssinaturas] = useState<Assinatura[]>([])
  const [subscriptionHistory, setHistoricoAssinaturas] = useState<PagamentoAssinatura[]>([])
  const [subscriptionQuery, setBuscaAssinatura] = useState('')
  const [subscriptionStatus, setStatusAssinatura] = useState('TODAS')
  const [subscriptionLoaded, setAssinaturaCarregada] = useState(false)
  const [pixCharge, setCobrancaPix] = useState<CobrancaPix | null>(null)
  const [pixLoading, setPixCarregando] = useState(false)
  const [systemConfig, setConfiguracaoSistema] = useState<ConfiguracaoPublica | null>(null)
  const [plans, setPlanos] = useState<PlanoComercial[]>([])
  const admin = sessao.perfilAcesso === 'ADMIN_REDE'
  const owner = sessao.perfilAcesso === 'MERCHANT_OWNER'
  const staff = sessao.perfilAcesso === 'MERCHANT_STAFF'
  const hasApprovedCommerce = commerces.some(
    commerce => commerce.status === 'APPROVED'
  )

  const showAlert = (text: string, tone: TomAlerta = 'informacao') => {
    void mostrarAlerta(text, tone)
  }
  const showError = (erro: unknown) => showAlert(erro instanceof Error ? erro.message : 'Erro inesperado', 'erro')
  const loadDividas = (busca = '') => api<Pagina<Divida>>('/get_inadimplentes', {
    method: 'POST',
    body: JSON.stringify({ busca: busca.trim() || null })
  }).then(page => setDividas(
    [...page.content].sort(
      (primeira, segunda) =>
        segunda.dataDivida.localeCompare(primeira.dataDivida)
    )
  )).catch(showError)
  const loadResets = () => api<SolicitacaoRedefinicaoSenha[]>('/auth/password-resets').then(setResetRequests).catch(showError)
  const loadPerfil = () => api<Perfil>('/profile').then(setPerfil).catch(showError)
  const loadStaff = () => api<Funcionario[]>('/staff').then(setFuncionarios).catch(showError)
  const loadAuditoria = () => api<RegistroAuditoria[]>('/auditoria')
    .then(records => {
      setRegistrosAuditoria(records)
      setAuditoriaOnline(true)
    })
    .catch(() => setAuditoriaOnline(false))
  const loadSubscription = () => api<Assinatura>('/assinaturas/minha')
    .then(setAssinatura)
    .catch(showError)
    .finally(() => setAssinaturaCarregada(true))
  const loadSubscriptions = () => api<Assinatura[]>('/assinaturas')
    .then(setAssinaturas)
    .catch(showError)
  const loadSubscriptionHistory = () => api<PagamentoAssinatura[]>(
    admin ? '/assinaturas/historico' : '/assinaturas/minha/historico'
  ).then(setHistoricoAssinaturas).catch(showError)
  const loadSystemConfig = () => api<ConfiguracaoPublica>('/configuracoes/publicas')
    .then(setConfiguracaoSistema)
    .catch(showError)
  const loadPlans = () => api<PlanoComercial[]>('/assinaturas/planos')
    .then(setPlanos)
    .catch(showError)

  useEffect(() => {
    loadSystemConfig()
    loadPlans()
    loadComercios()
    if (admin) {
      loadResets()
      loadSubscriptions()
      loadSubscriptionHistory()
    } else if (owner) {
      loadSubscription()
      loadSubscriptionHistory()
    }
  }, [])

  useEffect(() => {
    if (owner && subscription?.acessoOperacional) loadStaff()
  }, [owner, subscription?.acessoOperacional])

  useEffect(() => {
    const busca = query.trim()
    if (owner && !subscriptionLoaded) return
    if (owner && !subscription?.acessoOperacional) {
      setDividas([])
      return
    }
    if (owner && !commercesLoaded) return
    if (owner && !hasApprovedCommerce) {
      setDividas([])
      return
    }
    if (busca.length > 0 && busca.length < 3) return
    const timer = window.setTimeout(() => loadDividas(busca), 500)
    return () => window.clearTimeout(timer)
  }, [query, owner, admin, commercesLoaded, hasApprovedCommerce, subscriptionLoaded, subscription?.acessoOperacional])

  useEffect(() => {
    if (!admin || section !== 'auditoria') return
    loadAuditoria()
    const interval = window.setInterval(loadAuditoria, 2_000)
    return () => window.clearInterval(interval)
  }, [admin, section])

  useEffect(() => {
    const nome = userRecoveryQuery.trim()
    if (!admin || section !== 'recovery' || !nome) {
      setUsuariosRecuperacao([])
      setBuscandoUsuariosRecuperacao(false)
      return
    }
    setBuscandoUsuariosRecuperacao(true)
    const timer = window.setTimeout(() => {
      api<UsuarioRecuperacao[]>(`/auth/users/search?nome=${encodeURIComponent(nome)}`)
        .then(setUsuariosRecuperacao)
        .catch(showError)
        .finally(() => setBuscandoUsuariosRecuperacao(false))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [admin, section, userRecoveryQuery])

  useEffect(() => {
    if (!pixCharge) return
    const txid = pixCharge.txid
    let ativo = true
    let consultando = false
    const interval = window.setInterval(async () => {
      if (consultando) return
      consultando = true
      try {
        const status = await api<StatusCobrancaPix>(`/assinaturas/minha/cobranca-pix/${txid}`)
        if (!ativo) return
        if (status.pago) {
          window.clearInterval(interval)
          setCobrancaPix(atual => atual?.txid === txid ? null : atual)
          showAlert('Pagamento confirmado. Sua assinatura foi ativada.', 'sucesso')
          loadSubscription()
          loadSubscriptionHistory()
        } else {
          setCobrancaPix(atual => atual?.txid === txid
            ? { ...atual, status: status.status }
            : atual)
        }
      } catch {
        // Uma falha temporária não interrompe a tela nem duplica a cobrança.
      } finally {
        consultando = false
      }
    }, 5_000)
    return () => {
      ativo = false
      window.clearInterval(interval)
    }
  }, [pixCharge?.txid])

  function openSecao(next: SecaoPainel) {
    if (owner && subscriptionLoaded && !subscription?.acessoOperacional
      && ['defaults', 'staff'].includes(next)) {
      showAlert('Seu acesso operacional está bloqueado. Consulte sua assinatura.', 'alerta')
      setSecao('assinatura')
      return
    }
    if (owner && next === 'defaults' && !commercesLoaded) {
      showAlert('Aguarde enquanto verificamos seus comércios.', 'informacao')
      return
    }
    if (owner && next === 'defaults' && !hasApprovedCommerce) {
      showAlert(
        commerces.length === 0
          ? 'Cadastre um comércio e aguarde a aprovação do administrador para consultar inadimplentes.'
          : 'Aguarde o administrador aprovar pelo menos um comércio para consultar inadimplentes.',
        'alerta'
      )
      setSecao('commerces')
      return
    }
    setSecao(next)
    setTemporaryPassword('')
    setStaffPassword('')
    setBuscaUsuarioRecuperacao('')
    setUsuariosRecuperacao([])
    if (next === 'perfil') loadPerfil()
    if (next === 'staff') loadStaff()
    if (next === 'auditoria') loadAuditoria()
    if (next === 'assinatura') {
      if (admin) loadSubscriptions()
      if (owner) loadSubscription()
      if (admin || owner) loadSubscriptionHistory()
    }
  }

  async function generatePixCharge() {
    setPixCarregando(true)
    try {
      const charge = await api<CobrancaPix>('/assinaturas/minha/cobranca-pix', { method: 'POST' })
      setCobrancaPix(charge)
      showAlert('Cobrança Pix criada com segurança.', 'sucesso')
    } catch (erro) {
      showError(erro)
    } finally {
      setPixCarregando(false)
    }
  }

  async function createDivida(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const valorDivida = obterValorMoeda(form.get('valorDivida'))
    if (valorDivida <= 0) {
      showAlert('Informe um valor de dívida maior que zero.', 'alerta')
      return
    }
    try {
      await api('/debts', {
        method: 'POST',
        body: JSON.stringify({
          idComercio: form.get('idComercio'), valorDivida,
          dataDivida: form.get('dataDivida'), descricao: form.get('descricao'), possuiJuros: false,
          cliente: {
            nome: form.get('nome'), apelido: form.get('apelido'),
            cpf: somenteDigitos(form.get('cpf')) || null,
            telefone: somenteDigitos(form.get('telefone')), residencia: form.get('residencia')
          }
        })
      })
      formElement.reset()
      showAlert('Dívida cadastrada.', 'sucesso')
      loadDividas()
    } catch (erro) { showError(erro) }
  }

  async function settle(id: string) {
    try {
      await api(`/debts/${id}/settle`, { method: 'PATCH' })
      showAlert('Dívida baixada como paga.', 'sucesso')
      loadDividas(query)
    } catch (erro) { showError(erro) }
  }

  async function approveReset(id: string) {
    try {
      const result = await api<{ email: string; senhaTemporaria: string }>(`/auth/password-resets/${id}/approve`, { method: 'POST' })
      setTemporaryPassword(result.senhaTemporaria)
      setEmailSenhaTemporaria(result.email)
      showAlert('Senha temporária gerada. Entregue-a somente após confirmar a identidade.', 'sucesso')
      loadResets()
    } catch (erro) { showError(erro) }
  }

  async function rejectReset(id: string) {
    try {
      await api(`/auth/password-resets/${id}/reject`, { method: 'POST' })
      showAlert('Solicitação rejeitada.', 'sucesso')
      loadResets()
    } catch (erro) { showError(erro) }
  }

  async function generateTemporaryPasswordForUser(idUsuario: string) {
    try {
      const result = await api<{ nomeCompleto: string; email: string; senhaTemporaria: string }>(`/auth/users/${idUsuario}/temporary-password`, { method: 'POST' })
      setTemporaryPassword(result.senhaTemporaria)
      setEmailSenhaTemporaria(result.email)
      showAlert(`Senha temporária gerada para ${result.nomeCompleto}. Entregue-a somente após confirmar a identidade.`, 'sucesso')
    } catch (erro) {
      showError(erro)
    }
  }

  async function updatePerfil(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      const updated = await api<Perfil>('/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          nomeCompleto: form.get('nomeCompleto'),
          telefone: somenteDigitos(form.get('telefone')),
          email: form.get('email'),
          dataNascimento: form.get('dataNascimento') || null
        })
      })
      setPerfil(updated)
      onSessaoChange({ ...sessao, nome: updated.nomeCompleto })
      showAlert('Informações do perfil atualizadas.', 'sucesso')
    } catch (erro) { showError(erro) }
  }

  async function choosePlan(codigo: string) {
    try {
      const updated = await api<Assinatura>(`/assinaturas/minha/plano/${codigo}`, {
        method: 'PATCH'
      })
      setAssinatura(updated)
      showAlert(`Plano ${updated.plano.nome} selecionado.`, 'sucesso')
    } catch (erro) {
      showError(erro)
    }
  }

  async function configurarPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    if (form.get('pin') !== form.get('confirmacaoPin')) {
      showAlert('A confirmação do PIN não coincide.', 'alerta')
      return
    }
    try {
      const updated = await api<Perfil>('/profile/recovery-pin', {
        method: 'PUT',
        body: JSON.stringify({ senhaAtual: form.get('senhaAtual'), pin: form.get('pin') })
      })
      setPerfil(updated)
      formElement.reset()
      showAlert('PIN de recuperação configurado com segurança.', 'sucesso')
    } catch (erro) { showError(erro) }
  }

  async function createStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    try {
      const result = await api<{ funcionario: Funcionario; senhaTemporaria: string }>('/staff', {
        method: 'POST',
        body: JSON.stringify({
          nomeCompleto: form.get('nomeCompleto'),
          telefone: somenteDigitos(form.get('telefone')), cpf: somenteDigitos(form.get('cpf')),
          email: form.get('email'),
          dataNascimento: form.get('dataNascimento') || null
        })
      })
      formElement.reset()
      setStaffPassword(result.senhaTemporaria)
      showAlert('Operador criado. Entregue a senha temporária após confirmar a identidade.', 'sucesso')
      loadStaff()
    } catch (erro) { showError(erro) }
  }

  async function changeStaffStatus(funcionario: Funcionario) {
    try {
      await api(`/staff/${funcionario.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ ativo: !funcionario.ativo })
      })
      showAlert(
        funcionario.ativo
          ? 'Acesso do operador bloqueado.'
          : 'Acesso do operador reativado.',
        'sucesso'
      )
      loadStaff()
    } catch (erro) { showError(erro) }
  }

  async function resetStaffPassword(id: string) {
    try {
      const result = await api<{ senhaTemporaria: string }>(`/staff/${id}/reset-password`, { method: 'POST' })
      setStaffPassword(result.senhaTemporaria)
      showAlert('Nova senha temporária gerada.', 'sucesso')
      loadStaff()
    } catch (erro) { showError(erro) }
  }

  async function deleteStaff(funcionario: Funcionario) {
    const confirmed = await confirmarExclusao(
      'Excluir operador?',
      `O operador "${funcionario.nomeCompleto}" será excluído. Esta ação não poderá ser desfeita.`
    )
    if (!confirmed) return
    try {
      await api(`/staff/${funcionario.id}`, { method: 'DELETE' })
      showAlert('Operador excluído.', 'sucesso')
      loadStaff()
    } catch (erro) { showError(erro) }
  }

  async function generateReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const params = new URLSearchParams()
    for (const field of ['dataInicio', 'dataFim', 'idComercio', 'status']) {
      const value = String(form.get(field) ?? '')
      if (value) params.set(field, value)
    }
    setGerandoRelatorio(true)
    try {
      const result = await baixarArquivo(`/relatorios/inadimplencias.pdf?${params}`)
      const url = URL.createObjectURL(result.arquivo)
      const link = document.createElement('a')
      link.href = url
      link.download = result.nome
      link.click()
      URL.revokeObjectURL(url)
      showAlert('Relatório PDF gerado com sucesso.', 'sucesso')
    } catch (erro) {
      showError(erro)
    } finally {
      setGerandoRelatorio(false)
    }
  }

  const filteredSubscriptions = subscriptions
    .filter(item => subscriptionStatus === 'TODAS' || item.status === subscriptionStatus)
    .filter(item => `${item.nomeComerciante} ${item.email}`
      .toLocaleLowerCase('pt-BR')
      .includes(subscriptionQuery.trim().toLocaleLowerCase('pt-BR')))
    .sort((first, second) => Number(Boolean(second.solicitacaoAtivacaoEm)) - Number(Boolean(first.solicitacaoAtivacaoEm)))

  return <div className={`estrutura-aplicacao ${sidebarCollapsed ? 'barra-lateral-recolhida' : ''}`}>
    <BarraLateralPainel
      sessao={sessao}
      perfil={perfil}
      assinatura={subscription}
      secao={section}
      quantidadeRecuperacoes={resetRequests.length}
      dadosVisiveis={privacyVisible}
      administrador={admin}
      dono={owner}
      funcionario={staff}
      barraLateralRecolhida={sidebarCollapsed}
      alternarBarraLateral={() => setBarraLateralRecolhida(atual => !atual)}
      abrirSecao={openSecao}
      alternarPrivacidade={() => setPrivacyVisible(!privacyVisible)}
      sair={onLogout}
    />
    <main className="painel">
      <CabecalhoPainel
        sessao={sessao}
        perfil={perfil}
        assinatura={subscription}
        secao={section}
        quantidadeRecuperacoes={resetRequests.length}
        dadosVisiveis={privacyVisible}
        administrador={admin}
        dono={owner}
        funcionario={staff}
        abrirSecao={openSecao}
        alternarPrivacidade={() => setPrivacyVisible(!privacyVisible)}
        sair={onLogout}
      />


      {section === 'overview' && <SecaoVisaoGeral
        dividas={debts}
        comercios={commerces}
        funcionarios={employees}
        solicitacoes={resetRequests}
        dadosVisiveis={privacyVisible}
        administrador={admin}
        dono={owner}
        funcionario={staff}
        abrirSecao={openSecao}
      />}

      {section === 'commerces' && <SecaoComercios
        comercios={commerces}
        comercioEmEdicao={editingCommerce}
        dadosVisiveis={privacyVisible}
        administrador={admin}
        gestor={owner}
        acessoOperacional={Boolean(subscription?.acessoOperacional)}
        solicitarCadastro={createComercio}
        salvarEdicao={updateComercio}
        editar={setEditingCommerce}
        excluir={deleteComercio}
        avaliar={review}
      />}

      {section === 'defaults' && <SecaoInadimplentes
        dividas={debts}
        comercios={commerces}
        assinatura={subscription}
        busca={query}
        dadosVisiveis={privacyVisible}
        administrador={admin}
        gestor={owner}
        operador={staff}
        gerandoRelatorio={generatingReport}
        alterarBusca={setQuery}
        buscar={event => {
          event.preventDefault()
          const busca = query.trim()
          if (busca.length > 0 && busca.length < 3) {
            showAlert('Insira pelo menos 3 dígitos do CPF ou 3 caracteres do apelido', 'alerta')
            return
          }
          loadDividas(busca)
        }}
        cadastrar={createDivida}
        gerarRelatorio={generateReport}
        darBaixa={settle}
        conhecerPlano={() => openSecao('assinatura')}
      />}

      {section === 'assinatura' && !staff && <SecaoAssinaturas
        administrador={admin}
        gestor={owner}
        assinatura={subscription}
        assinaturas={subscriptions}
        assinaturasFiltradas={filteredSubscriptions}
        historico={subscriptionHistory}
        configuracao={systemConfig}
        planos={plans}
        busca={subscriptionQuery}
        situacao={subscriptionStatus}
        cobrancaPix={pixCharge}
        gerandoPix={pixLoading}
        alterarBusca={setBuscaAssinatura}
        alterarSituacao={setStatusAssinatura}
        gerarCobrancaPix={generatePixCharge}
        escolherPlano={choosePlan}
        copiarPix={codigo => {
          void navigator.clipboard.writeText(codigo)
          showAlert('Pix Copia e Cola copiado.', 'sucesso')
        }}
      />}

      {section === 'staff' && owner && <SecaoFuncionarios
        funcionarios={employees}
        limiteOperadores={subscription?.plano.limiteOperadores ?? 3}
        senhaTemporaria={staffPassword}
        dadosVisiveis={privacyVisible}
        criar={createStaff}
        redefinirSenha={resetStaffPassword}
        alterarStatus={changeStaffStatus}
        excluir={deleteStaff}
        fecharSenha={() => setStaffPassword('')}
      />}

      {section === 'recovery' && admin && <SecaoRecuperacao
        solicitacoes={resetRequests}
        senhaTemporaria={temporaryPassword}
        emailSenhaTemporaria={temporaryPasswordEmail}
        dadosVisiveis={privacyVisible}
        buscaUsuarios={userRecoveryQuery}
        usuariosEncontrados={recoveryUsers}
        buscandoUsuarios={recoveryUsersLoading}
        aprovar={approveReset}
        rejeitar={rejectReset}
        alterarBuscaUsuarios={setBuscaUsuarioRecuperacao}
        gerarSenhaDireta={generateTemporaryPasswordForUser}
        fecharSenha={() => { setTemporaryPassword(''); setEmailSenhaTemporaria('') }}
      />}

      {section === 'auditoria' && admin && <SecaoAuditoria
        registros={auditRecords}
        online={auditOnline}
      />}

      {section === 'perfil' && <SecaoPerfil
        perfil={perfil}
        dadosVisiveis={privacyVisible}
        salvar={updatePerfil}
        configurarPin={configurarPin}
      />}
    </main>
  </div>
}
