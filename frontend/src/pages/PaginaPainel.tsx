import { FormEvent, useEffect, useState } from 'react'
import { api, baixarArquivo } from '../services/api'
import {
  confirmarExclusao,
  mostrarAlerta,
  type TomAlerta
} from '../services/alertas'
import { CampoFlutuante } from '../components/CampoFlutuante'
import type { Assinatura, CobrancaPix, StatusCobrancaPix, Comercio, StatusComercio, Divida, StatusDivida, Funcionario, Pagina, SolicitacaoRedefinicaoSenha, Perfil, PerfilAcesso, RegistroAuditoria, Sessao } from '../types'

type Secao = 'overview' | 'commerces' | 'defaults' | 'staff' | 'recovery' | 'auditoria' | 'assinatura' | 'perfil'

const roleLabels: Record<PerfilAcesso, string> = {
  ADMIN_REDE: 'Administrador da rede',
  MERCHANT_OWNER: 'Dono de comércio',
  MERCHANT_STAFF: 'Funcionário do comércio'
}
const commerceStatusLabels: Record<StatusComercio, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Reprovado'
}
const debtStatusLabels: Record<StatusDivida, string> = {
  PENDING: 'Pendente',
  DISPUTED: 'Contestado',
  NEGOTIATING: 'Em negociação',
  PARTIALLY_PAID: 'Parcialmente pago',
  PAID: 'Pago',
  CANCELED: 'Cancelado'
}

const actionLabels: Record<string, string> = {
  VIEW_FULL_CPF: 'Consultou os dados de um cliente',
  VIEW_OWN_PROFILE: 'Visualizou o próprio perfil',
  UPDATE_OWN_PROFILE: 'Atualizou o próprio perfil',
  CREATE_STAFF: 'Criou um funcionário',
  ENABLE_STAFF: 'Reativou um funcionário',
  DISABLE_STAFF: 'Bloqueou um funcionário',
  RESET_STAFF_PASSWORD: 'Redefiniu a senha de um funcionário',
  DELETE_STAFF: 'Excluiu um funcionário',
  CRIAR_DIVIDA: 'Cadastrou uma dívida',
  DAR_BAIXA_DIVIDA: 'Deu baixa em uma dívida',
  CRIAR_COMERCIO: 'Cadastrou um comércio',
  REVISAR_COMERCIO: 'Revisou um comércio',
  EDITAR_COMERCIO: 'Editou um comércio',
  EXCLUIR_COMERCIO: 'Excluiu um comércio',
  GERAR_RELATORIO_INADIMPLENCIAS: 'Gerou um relatório de inadimplências',
  SOLICITAR_ATIVACAO_ASSINATURA: 'Solicitou a ativação da assinatura',
  ATIVAR_ASSINATURA: 'Ativou uma assinatura',
  RENOVAR_ASSINATURA: 'Renovou uma assinatura',
  CANCELAR_ASSINATURA: 'Cancelou uma assinatura'
}

const subscriptionStatusLabels = {
  AGUARDANDO_APROVACAO: 'Aguardando aprovação',
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  ATIVA: 'Ativa',
  ATRASADA: 'Pagamento pendente',
  EXPIRADA: 'Teste encerrado',
  CANCELADA: 'Cancelada'
} as const

const describeAuditAction = (record: RegistroAuditoria) => {
  if (record.acao === 'DAR_BAIXA_DIVIDA' && record.alvoDescricao) {
    return `Deu baixa na dívida de ${record.alvoDescricao}`
  }
  if (record.acao === 'CRIAR_DIVIDA' && record.alvoDescricao) {
    return `Cadastrou uma dívida para ${record.alvoDescricao}`
  }
  return actionLabels[record.acao] ?? record.acao
}

const classesStatusComercio: Record<StatusComercio, string> = {
  PENDING: 'pendente',
  APPROVED: 'aprovado',
  REJECTED: 'rejeitado'
}

const classesStatusDivida: Record<StatusDivida, string> = {
  PENDING: 'pendente',
  DISPUTED: 'contestado',
  NEGOTIATING: 'negociando',
  PARTIALLY_PAID: 'parcialmente-pago',
  PAID: 'pago',
  CANCELED: 'cancelado'
}

const digits = (value: FormDataEntryValue | null) => String(value ?? '').replace(/\D/g, '')
const cpfMask = (value: string) => value.replace(/\D/g, '').slice(0, 11)
  .replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
const phoneMask = (value: string) => {
  const number = value.replace(/\D/g, '').slice(0, 11)
  return number.length <= 10
    ? number.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    : number.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}
const cnpjMask = (value: string) => value.replace(/\D/g, '').slice(0, 14)
  .replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2')
  .replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2')
const cepMask = (value: string) => value.replace(/\D/g, '').slice(0, 8)
  .replace(/(\d{5})(\d)/, '$1-$2')
const currencyMask = (value: string) => {
  const number = value.replace(/\D/g, '')
  if (!number) return ''
  return (Number(number) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
const currencyValue = (value: FormDataEntryValue | null) => {
  const number = String(value ?? '').replace(/\D/g, '')
  return number ? Number(number) / 100 : 0
}

const limitDateYear = (input: HTMLInputElement) => {
  const [year, month, day] = input.value.split('-')

  if (year.length <= 4) {
    return
  }

  input.value = [
    year.slice(0, 4),
    month,
    day
  ]
    .filter(Boolean)
    .join('-')
}

const currentDate = () => {
  const today = new Date()
  const timezoneOffset = today.getTimezoneOffset() * 60_000

  return new Date(today.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 10)
}

const maximumBirthDate = () => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 18)
  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

const displayCnpj = (value: string) => cnpjMask(value)

export function PaginaPainel({ sessao, onSessaoChange, onLogout }: {
  sessao: Sessao
  onSessaoChange: (sessao: Sessao) => void
  onLogout: () => void
}) {
  const [section, setSecao] = useState<Secao>('overview')
  const [privacyVisible, setPrivacyVisible] = useState(false)
  const [commerces, setComercios] = useState<Comercio[]>([])
  const [commercesLoaded, setComerciosCarregados] = useState(false)
  const [debts, setDividas] = useState<Divida[]>([])
  const [query, setQuery] = useState('')
  const [resetRequests, setResetRequests] = useState<SolicitacaoRedefinicaoSenha[]>([])
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [employees, setFuncionarios] = useState<Funcionario[]>([])
  const [staffPassword, setStaffPassword] = useState('')
  const [editingCommerce, setEditingCommerce] = useState<Comercio | null>(null)
  const [auditRecords, setRegistrosAuditoria] = useState<RegistroAuditoria[]>([])
  const [auditOnline, setAuditoriaOnline] = useState(false)
  const [generatingReport, setGerandoRelatorio] = useState(false)
  const [subscription, setAssinatura] = useState<Assinatura | null>(null)
  const [subscriptions, setAssinaturas] = useState<Assinatura[]>([])
  const [subscriptionQuery, setBuscaAssinatura] = useState('')
  const [subscriptionStatus, setStatusAssinatura] = useState('TODAS')
  const [subscriptionLoaded, setAssinaturaCarregada] = useState(false)
  const [pixCharge, setCobrancaPix] = useState<CobrancaPix | null>(null)
  const [pixLoading, setPixCarregando] = useState(false)
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
  const loadComercios = () => api<Comercio[]>('/commerces')
    .then(setComercios)
    .catch(showError)
    .finally(() => setComerciosCarregados(true))
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

  useEffect(() => {
    if (!staff) loadComercios()
    if (admin) {
      loadResets()
      loadSubscriptions()
    } else {
      loadSubscription()
    }
  }, [])

  useEffect(() => {
    if (owner && subscription?.acessoOperacional) loadStaff()
  }, [owner, subscription?.acessoOperacional])

  useEffect(() => {
    const busca = query.trim()
    if (!admin && !subscriptionLoaded) return
    if (!admin && !subscription?.acessoOperacional) {
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
    if (!pixCharge || pixCharge.status === 'CONCLUIDA') return
    const interval = window.setInterval(async () => {
      try {
        const status = await api<StatusCobrancaPix>(`/assinaturas/minha/cobranca-pix/${pixCharge.txid}`)
        setCobrancaPix(atual => atual ? { ...atual, status: status.status } : atual)
        if (status.pago) {
          window.clearInterval(interval)
          showAlert('Pagamento confirmado. Sua assinatura foi ativada.', 'sucesso')
          loadSubscription()
        }
      } catch {
        // Uma falha temporária não interrompe a tela nem duplica a cobrança.
      }
    }, 5_000)
    return () => window.clearInterval(interval)
  }, [pixCharge?.txid, pixCharge?.status])

  function openSecao(next: Secao) {
    if (!admin && subscriptionLoaded && !subscription?.acessoOperacional
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
    if (next === 'perfil') loadPerfil()
    if (next === 'staff') loadStaff()
    if (next === 'auditoria') loadAuditoria()
    if (next === 'assinatura') admin ? loadSubscriptions() : loadSubscription()
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

  async function cancelSubscription(id: string) {
    try {
      await api(`/assinaturas/${id}/cancelar`, { method: 'PATCH' })
      showAlert('Assinatura cancelada.', 'sucesso')
      loadSubscriptions()
    } catch (erro) { showError(erro) }
  }

  async function createComercio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    try {
      await api('/commerces', {
        method: 'POST',
        body: JSON.stringify({
          nomeComercio: form.get('nomeComercio'),
          cnpj: digits(form.get('cnpj')),
          endereco: {
            rua: form.get('rua'), cidade: form.get('cidade'), cep: digits(form.get('cep')),
            numberComercio: form.get('numberComercio'), pontoReferencia: form.get('pontoReferencia')
          }
        })
      })
      formElement.reset()
      showAlert('Comércio enviado para aprovação.', 'sucesso')
      loadComercios()
    } catch (erro) { showError(erro) }
  }

  async function updateComercio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingCommerce) return
    const form = new FormData(event.currentTarget)
    try {
      await api(`/commerces/${editingCommerce.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nomeComercio: form.get('nomeComercio'),
          endereco: {
            rua: form.get('rua'),
            cidade: form.get('cidade'),
            cep: digits(form.get('cep')),
            numberComercio: form.get('numberComercio'),
            pontoReferencia: form.get('pontoReferencia')
          }
        })
      })
      setEditingCommerce(null)
      showAlert('Dados do comércio atualizados.', 'sucesso')
      loadComercios()
    } catch (erro) { showError(erro) }
  }

  async function deleteComercio(comercio: Comercio) {
    const confirmed = await confirmarExclusao(
      'Excluir comércio?',
      `O comércio "${comercio.nomeComercio}" será excluído. Esta ação não poderá ser desfeita.`
    )
    if (!confirmed) return
    try {
      await api(`/commerces/${comercio.id}`, { method: 'DELETE' })
      if (editingCommerce?.id === comercio.id) setEditingCommerce(null)
      showAlert('Comércio excluído.', 'sucesso')
      loadComercios()
    } catch (erro) { showError(erro) }
  }

  async function review(id: string, status: StatusComercio) {
    try {
      await api(`/commerces/${id}/review`, { method: 'PATCH', body: JSON.stringify({ status }) })
      showAlert(
        status === 'APPROVED'
          ? 'Comércio aprovado.'
          : 'Comércio reprovado.',
        'sucesso'
      )
      loadComercios()
    } catch (erro) { showError(erro) }
  }

  async function createDivida(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const valorDivida = currencyValue(form.get('valorDivida'))
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
            nome: form.get('nome'), sobrenome: form.get('sobrenome'), apelido: form.get('apelido'),
            cpf: digits(form.get('cpf')),
            telefone: digits(form.get('telefone')), residencia: form.get('residencia')
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
      const result = await api<{ senhaTemporaria: string }>(`/auth/password-resets/${id}/approve`, { method: 'POST' })
      setTemporaryPassword(result.senhaTemporaria)
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

  async function updatePerfil(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      const updated = await api<Perfil>('/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          nome: form.get('nome'),
          sobrenome: form.get('sobrenome'),
          telefone: digits(form.get('telefone')),
          email: form.get('email'),
          dataNascimento: form.get('dataNascimento') || null
        })
      })
      setPerfil(updated)
      onSessaoChange({ ...sessao, nome: updated.nome })
      showAlert('Informações do perfil atualizadas.', 'sucesso')
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
          nome: form.get('nome'), sobrenome: form.get('sobrenome'),
          telefone: digits(form.get('telefone')), cpf: digits(form.get('cpf')),
          email: form.get('email'),
          dataNascimento: form.get('dataNascimento') || null
        })
      })
      formElement.reset()
      setStaffPassword(result.senhaTemporaria)
      showAlert('Funcionário criado. Entregue a senha temporária após confirmar a identidade.', 'sucesso')
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
          ? 'Acesso do funcionário bloqueado.'
          : 'Acesso do funcionário reativado.',
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
      'Excluir funcionário?',
      `O funcionário "${funcionario.nome} ${funcionario.sobrenome}" será excluído. Esta ação não poderá ser desfeita.`
    )
    if (!confirmed) return
    try {
      await api(`/staff/${funcionario.id}`, { method: 'DELETE' })
      showAlert('Funcionário excluído.', 'sucesso')
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

  const openDividas = debts.filter(debt => debt.status !== 'PAID' && debt.status !== 'CANCELED')
  const openValue = openDividas.reduce((sum, debt) => sum + debt.valorDivida, 0)
  const filteredSubscriptions = subscriptions
    .filter(item => subscriptionStatus === 'TODAS' || item.status === subscriptionStatus)
    .filter(item => `${item.nomeComerciante} ${item.emailMascarado}`
      .toLocaleLowerCase('pt-BR')
      .includes(subscriptionQuery.trim().toLocaleLowerCase('pt-BR')))
    .sort((first, second) => Number(Boolean(second.solicitacaoAtivacaoEm)) - Number(Boolean(first.solicitacaoAtivacaoEm)))

  return <div className="estrutura-aplicacao">
    <aside>
      <a className="marca" href="#"><span>C</span> CredUp</a>
      <div className="mensagem-lateral">
        <small>Ambiente protegido</small>
        <p>Gestão colaborativa para decisões de crédito mais seguras.</p>
      </div>
      <button className="perfil botao-perfil" onClick={() => openSecao('perfil')}><div className="avatar">{(perfil?.nome ?? sessao.nome)[0]}</div><div><strong>{perfil?.nome ?? sessao.nome}</strong><small>{roleLabels[sessao.perfilAcesso]}</small></div></button>
      <button className="fantasma" onClick={onLogout}>Sair</button>
    </aside>

    <main className="painel">
      <header className="cabecalho-painel">
        <div><p className="sobretitulo">Rede CredUp</p></div>
        <div className="acoes-cabecalho">
          <nav className="navegacao-superior" aria-label="Seções principais">
            <button className={section === 'overview' ? 'ativo' : ''} onClick={() => openSecao('overview')}>Visão geral</button>
            {!staff && <button className={section === 'commerces' ? 'ativo' : ''} onClick={() => openSecao('commerces')}>Comércios</button>}
            <button className={section === 'defaults' ? 'ativo' : ''} onClick={() => openSecao('defaults')}>Inadimplentes</button>
            {owner && <button className={section === 'staff' ? 'ativo' : ''} onClick={() => openSecao('staff')}>Funcionários</button>}
            {admin && <button className={section === 'recovery' ? 'ativo' : ''} onClick={() => openSecao('recovery')}>
              Recuperação {resetRequests.length > 0 && <span>{resetRequests.length}</span>}
            </button>}
            {admin && <button className={section === 'auditoria' ? 'ativo' : ''} onClick={() => openSecao('auditoria')}>Logs</button>}
            <button className={section === 'assinatura' ? 'ativo' : ''} onClick={() => openSecao('assinatura')}>{admin ? 'Assinaturas' : 'Minha assinatura'}</button>
            <button className={`botao-perfil-navegacao ${section === 'perfil' ? 'ativo' : ''}`} onClick={() => openSecao('perfil')} aria-label="Abrir meu perfil">
              <b className="avatar-perfil-navegacao">{(perfil?.nome ?? sessao.nome)[0]}</b>
              <small>Meu perfil</small>
            </button>
          </nav>
          <button className={`alternar-privacidade ${privacyVisible ? 'visivel' : ''}`} onClick={() => setPrivacyVisible(!privacyVisible)}
            aria-label={privacyVisible ? 'Ocultar todos os dados sensíveis' : 'Exibir dados sensíveis'}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
              <circle cx="12" cy="12" r="2.75" />
              {!privacyVisible && <path d="m4 4 16 16" />}
            </svg>
            {privacyVisible ? 'Ocultar dados' : 'Exibir dados'}
          </button>
        </div>
      </header>

      {!admin && subscription && <div className={`faixa-assinatura ${subscription.status === 'ATIVA' ? 'verde' : subscription.status === 'AGUARDANDO_APROVACAO' ? 'amarela' : 'vermelha'}`}>
        <span className="semaforo-assinatura" />
        <div><strong>{subscriptionStatusLabels[subscription.status]}</strong><small>{subscription.status === 'ATIVA' ? `Próxima renovação em ${subscription.proximaCobranca ? new Date(`${subscription.proximaCobranca}T12:00:00`).toLocaleDateString('pt-BR') : '-'}` : 'Consulte os detalhes da sua assinatura'}</small></div>
        <button className="pequeno" onClick={() => openSecao('assinatura')}>Ver assinatura</button>
      </div>}

      {section === 'overview' && <section className="visualizacao-secao animar-entrada" key="overview">
        <div className="titulo-secao"><div><p className="sobretitulo">Resumo da rede</p><h2>Visão geral</h2></div><p>Acompanhe os principais números antes de entrar nos detalhes.</p></div>
        <div className={`estatisticas ${staff ? 'duas-colunas' : ''}`}>
          <article><small>Registros encontrados</small><strong>{debts.length}</strong><span>clientes na consulta atual</span></article>
          <article><small>Valor total em aberto</small><strong className={!privacyVisible ? 'oculto' : ''}>{privacyVisible ? openValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ ••••••'}</strong><span>não inclui dívidas pagas ou canceladas</span></article>
          {!staff && <article><small>Comércios aprovados</small><strong>{commerces.filter(commerce => commerce.status === 'APPROVED').length}</strong><span>estabelecimentos ativos na rede</span></article>}
        </div>
        <div className="grade-visao-geral">
          {!staff && <button className="atalho-visao-geral" onClick={() => openSecao('commerces')}><span>01</span><div><strong>Gerenciar comércios</strong><small>Cadastros, aprovações e situação dos mercados</small></div><b>→</b></button>}
          <button className="atalho-visao-geral" onClick={() => openSecao('defaults')}><span>{staff ? '01' : '02'}</span><div><strong>Consultar inadimplentes</strong><small>Buscas, informações e situação dos clientes</small></div><b>→</b></button>
          {owner && <button className="atalho-visao-geral" onClick={() => openSecao('staff')}><span>03</span><div><strong>Gerenciar funcionários</strong><small>{employees.length} funcionário(s) vinculado(s)</small></div><b>→</b></button>}
          {admin && <button className="atalho-visao-geral" onClick={() => openSecao('recovery')}><span>03</span><div><strong>Recuperar acessos</strong><small>{resetRequests.length} solicitação(ões) aguardando análise</small></div><b>→</b></button>}
        </div>
      </section>}

      {section === 'commerces' && <section className="visualizacao-secao animar-entrada" key="commerces">
        <div className="titulo-secao"><div><p className="sobretitulo">Estabelecimentos</p><h2>Comércios</h2></div><p>{admin ? 'Analise e acompanhe todos os mercados da rede.' : 'Cadastre e acompanhe seus estabelecimentos.'}</p></div>
        <div className={admin ? 'coluna-unica' : 'colunas-secao'}>
          <section className="painel-conteudo">
            <div className="cabecalho-painel-conteudo"><div><h2>{admin ? 'Mercados cadastrados' : 'Meus comércios'}</h2><p>{commerces.length} estabelecimento(s)</p></div></div>
            <div className="grade-comercios">{commerces.map(commerce => <article className="cartao-mercado" key={commerce.id}>
              <div className="icone-mercado">{commerce.nomeComercio[0]}</div>
              <div className="informacoes-mercado"><strong>{commerce.nomeComercio}</strong><small className={!privacyVisible ? 'oculto' : ''}>{privacyVisible ? displayCnpj(commerce.cnpj) : '**.***.***/****-**'}</small></div>
              <span className={`indicador ${classesStatusComercio[commerce.status]}`}>{commerceStatusLabels[commerce.status]}</span>
              {admin && commerce.status === 'PENDING' && <div className="acoes-mercado"><button className="pequeno" onClick={() => review(commerce.id, 'APPROVED')}>Aprovar</button><button className="pequeno perigo" onClick={() => review(commerce.id, 'REJECTED')}>Reprovar</button></div>}
              {owner && subscription?.acessoOperacional && <div className="acoes-mercado"><button className="pequeno" onClick={() => setEditingCommerce(commerce)}>Editar dados</button><button className="pequeno perigo" onClick={() => deleteComercio(commerce)}>Excluir</button></div>}
            </article>)}
            {!commerces.length && <p className="vazio">Nenhum comércio cadastrado.</p>}</div>
          </section>
          {owner && subscription?.acessoOperacional && editingCommerce && <section className="painel-conteudo painel-fixo"><h2>Editar comércio</h2>
            <form onSubmit={updateComercio} className="formulario-compacto">
              <CampoFlutuante label="Nome do comércio"><input name="nomeComercio" defaultValue={editingCommerce.nomeComercio} placeholder=" " required /></CampoFlutuante>
              <div className="grade-formulario">
                <CampoFlutuante label="Rua"><input name="rua" defaultValue={editingCommerce.endereco.rua} placeholder=" " required /></CampoFlutuante>
                <CampoFlutuante label="Número"><input name="numberComercio" defaultValue={editingCommerce.endereco.numberComercio} placeholder=" " required /></CampoFlutuante>
                <CampoFlutuante label="Cidade"><input name="cidade" defaultValue={editingCommerce.endereco.cidade} placeholder=" " required /></CampoFlutuante>
                <CampoFlutuante label="CEP"><input name="cep" defaultValue={cepMask(editingCommerce.endereco.cep)} inputMode="numeric" maxLength={9} placeholder=" " onInput={event => { event.currentTarget.value = cepMask(event.currentTarget.value) }} required /></CampoFlutuante>
              </div>
              <CampoFlutuante label="Ponto de referência"><input name="pontoReferencia" defaultValue={editingCommerce.endereco.pontoReferencia ?? ''} placeholder=" " /></CampoFlutuante>
              <div className="acoes-formulario"><button>Salvar alterações</button><button type="button" className="fantasma" onClick={() => setEditingCommerce(null)}>Cancelar</button></div>
            </form>
          </section>}
          {owner && (subscription?.status === 'AGUARDANDO_APROVACAO' || subscription?.acessoOperacional) && <section className="painel-conteudo painel-fixo"><h2>Cadastrar novo comércio</h2><p className="suave">O cadastro ficará pendente até a aprovação da rede.</p>
            <form onSubmit={createComercio} className="formulario-compacto">
              <CampoFlutuante label="Nome do comércio"><input name="nomeComercio" placeholder=" " required /></CampoFlutuante>
              <CampoFlutuante label="CNPJ: 00.000.000/0000-00"><input name="cnpj" inputMode="numeric" maxLength={18} placeholder=" " onInput={event => { event.currentTarget.value = cnpjMask(event.currentTarget.value) }} required /></CampoFlutuante>
              <div className="grade-formulario">
                <CampoFlutuante label="Rua"><input name="rua" placeholder=" " required /></CampoFlutuante>
                <CampoFlutuante label="Número"><input name="numberComercio" placeholder=" " required /></CampoFlutuante>
                <CampoFlutuante label="Cidade"><input name="cidade" placeholder=" " required /></CampoFlutuante>
                <CampoFlutuante label="CEP: 00000-000"><input name="cep" inputMode="numeric" maxLength={9} placeholder=" " onInput={event => { event.currentTarget.value = cepMask(event.currentTarget.value) }} required /></CampoFlutuante>
              </div>
              <CampoFlutuante label="Ponto de referência"><input name="pontoReferencia" placeholder=" " /></CampoFlutuante>
              <button>Cadastrar comércio</button>
            </form>
          </section>}
        </div>
      </section>}

      {section === 'defaults' && <section className="visualizacao-secao animar-entrada" key="defaults">
        <div className="titulo-secao"><div><p className="sobretitulo">Rede compartilhada</p><h2>Inadimplentes</h2></div><p>Consulte registros e gerencie dívidas sem expor o CPF completo.</p></div>
        {!staff && (admin || subscription?.podeGerarRelatorio) && <section className="painel-conteudo">
          <div className="cabecalho-painel-conteudo"><div><h2>Relatório em PDF</h2><p>Escolha um dos seus comércios ou selecione “Todos” para incluir toda a rede.</p></div></div>
          <form className="filtros-relatorio" onSubmit={generateReport}>
            <CampoFlutuante label="Data inicial da dívida"><input name="dataInicio" type="date" min="2000-01-01" max={currentDate()} placeholder=" " required /></CampoFlutuante>
            <CampoFlutuante label="Data final da dívida"><input name="dataFim" type="date" min="2000-01-01" max={currentDate()} placeholder=" " required /></CampoFlutuante>
            <CampoFlutuante label="Comércio"><select name="idComercio" defaultValue=""><option value="">Todos os comércios da rede</option>{commerces.filter(commerce => admin || commerce.status === 'APPROVED').map(commerce => <option key={commerce.id} value={commerce.id}>{commerce.nomeComercio}</option>)}</select></CampoFlutuante>
            <CampoFlutuante label="Situação"><select name="status" defaultValue=""><option value="">Todas</option>{Object.entries(debtStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></CampoFlutuante>
            <button disabled={generatingReport}>{generatingReport ? 'Gerando PDF…' : 'Gerar relatório PDF'}</button>
          </form>
        </section>}
        {owner && subscription && !subscription.podeGerarRelatorio && <section className="painel-conteudo relatorio-bloqueado">
          <span>🔒</span><div><h2>Relatórios em PDF</h2><p>Disponível no plano profissional. Durante o teste, suas informações permanecem no sistema, mas a exportação fica bloqueada.</p></div>
          <button onClick={() => openSecao('assinatura')}>Conhecer o plano</button>
        </section>}
        <section className="painel-conteudo">
          <div className="cabecalho-painel-conteudo"><div><h2>Consulta da rede</h2><p>CPF sempre protegido na listagem.</p></div>
            <form className="busca" onSubmit={event => {
              event.preventDefault()
              const busca = query.trim()
              if (busca.length > 0 && busca.length < 3) {
                showAlert('Insira pelo menos 3 dígitos do CPF ou 3 caracteres do apelido', 'alerta')
                return
              }
              loadDividas(busca)
            }}><CampoFlutuante label="Buscar por CPF ou apelido"><input value={query} maxLength={120} onChange={event => {
              setQuery(event.target.value)
            }} placeholder=" " /></CampoFlutuante><button>Buscar</button></form>
          </div>
          <div className="envoltorio-tabela"><table><thead><tr><th>Cliente</th><th>CPF</th><th>Comércio</th><th>Data da dívida</th><th>Data do cadastro</th><th>Valor</th><th>Status</th><th></th></tr></thead>
            <tbody>{debts.map(debt => <tr key={debt.id}><td><strong className={!privacyVisible ? 'oculto' : ''}>{privacyVisible ? `${debt.cliente.nome} ${debt.cliente.sobrenome}` : 'Cliente protegido'}</strong>{privacyVisible && debt.cliente.apelido && <small>Apelido: {debt.cliente.apelido}</small>}</td><td className={!privacyVisible ? 'oculto' : ''}>{privacyVisible ? debt.cliente.cpfMascarado : '***.***.***-**'}</td><td>{debt.nomeComercio}</td><td>{new Date(`${debt.dataDivida}T12:00:00`).toLocaleDateString('pt-BR')}</td><td>{new Date(debt.dataCadastro).toLocaleString('pt-BR')}</td><td className={!privacyVisible ? 'oculto' : ''}>{privacyVisible ? debt.valorDivida.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ •••••'}</td><td><span className={`indicador ${classesStatusDivida[debt.status]}`}>{debtStatusLabels[debt.status]}</span></td><td>{debt.status !== 'PAID' && debt.podeDarBaixa && <button className="pequeno" onClick={() => settle(debt.id)}>Dar baixa</button>}</td></tr>)}
              {!debts.length && <tr><td colSpan={8} className="vazio">Nenhum registro encontrado.</td></tr>}</tbody></table></div>
        </section>
        {owner && <section className="painel-conteudo painel-formulario"><div className="cabecalho-painel-conteudo"><div><h2>Nova inadimplência</h2><p>Cadastre um cliente e sua dívida em um comércio aprovado.</p></div></div>
          <form onSubmit={createDivida} className="formulario-compacto formulario-divida">
            <CampoFlutuante label="Selecione o comércio"><select name="idComercio" defaultValue="" required><option value="" disabled></option>{commerces.filter(commerce => commerce.status === 'APPROVED').map(commerce => <option key={commerce.id} value={commerce.id}>{commerce.nomeComercio}</option>)}</select></CampoFlutuante>
            <div className="grade-formulario">
              <CampoFlutuante label="Nome"><input name="nome" placeholder=" " required /></CampoFlutuante>
              <CampoFlutuante label="Sobrenome"><input name="sobrenome" placeholder=" " required /></CampoFlutuante>
              <CampoFlutuante label="Apelido (opcional)"><input name="apelido" maxLength={120} placeholder=" " /></CampoFlutuante>
              <CampoFlutuante label="CPF: 000.000.000-00"><input name="cpf" inputMode="numeric" maxLength={14} placeholder=" " onInput={event => { event.currentTarget.value = cpfMask(event.currentTarget.value) }} required /></CampoFlutuante>
              <CampoFlutuante label="Telefone: (11) 99999-9999"><input name="telefone" inputMode="tel" maxLength={15} placeholder=" " onInput={event => { event.currentTarget.value = phoneMask(event.currentTarget.value) }} /></CampoFlutuante>
            </div>
            <CampoFlutuante label="Endereço do cliente"><input name="residencia" placeholder=" " /></CampoFlutuante>
            <div className="grade-formulario">
              <CampoFlutuante label="Valor: R$ 0,00"><input name="valorDivida" type="text" inputMode="numeric" placeholder=" " onInput={event => { event.currentTarget.value = currencyMask(event.currentTarget.value) }} required /></CampoFlutuante>
              <CampoFlutuante label="Data da dívida"><input name="dataDivida" type="date" placeholder=" " min="2000-01-01" max={currentDate()} onInput={event => limitDateYear(event.currentTarget)} required /></CampoFlutuante>
            </div>
            <CampoFlutuante label="Descrição da dívida"><textarea name="descricao" placeholder=" " /></CampoFlutuante><button>Cadastrar dívida</button>
          </form>
        </section>}
      </section>}

      {section === 'assinatura' && <section className="visualizacao-secao animar-entrada" key="assinatura">
        <div className="titulo-secao"><div><p className="sobretitulo">Plano e acesso</p><h2>{admin ? 'Assinaturas' : 'Minha assinatura'}</h2></div><p>{admin ? 'Acompanhe e controle os acessos comerciais.' : 'Acompanhe a situação do seu plano.'}</p></div>
        {!admin && subscription && <section className="painel-conteudo cartao-assinatura">
          <div className={`selo-assinatura ${subscription.status.toLowerCase()}`}>{subscriptionStatusLabels[subscription.status]}</div>
          <h2>Plano profissional · R$ 39,90 por mês</h2>
          <p>{subscription.status === 'AGUARDANDO_APROVACAO' ? 'O pagamento ficará disponível quando o administrador aprovar seu primeiro comércio.' : subscription.status === 'ATIVA' ? 'Seu acesso completo está ativo, incluindo relatórios em PDF.' : 'As funções operacionais estão bloqueadas até a confirmação do pagamento.'}</p>
          <dl className="detalhes-assinatura">
            <div><dt>Mensalidade</dt><dd>R$ 39,90</dd></div>
            <div><dt>Próxima cobrança</dt><dd>{subscription.proximaCobranca ? new Date(`${subscription.proximaCobranca}T12:00:00`).toLocaleDateString('pt-BR') : 'Após o primeiro pagamento'}</dd></div>
            <div><dt>Relatórios PDF</dt><dd>{subscription.podeGerarRelatorio ? 'Liberados' : 'Plano profissional'}</dd></div>
          </dl>
          {owner && ['AGUARDANDO_PAGAMENTO', 'EXPIRADA', 'ATRASADA', 'CANCELADA'].includes(subscription.status) && <button disabled={pixLoading} onClick={generatePixCharge}>{pixLoading ? 'Gerando cobrança...' : 'Pagar assinatura com Pix'}</button>}
          {pixCharge && <div className="cobranca-pix animar-entrada">
            <h3>Pix de {pixCharge.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
            <img src={pixCharge.qrCodeBase64} alt="QR Code da cobrança Pix" />
            <label>Pix Copia e Cola</label>
            <textarea readOnly value={pixCharge.pixCopiaECola} />
            <button className="pequeno" onClick={() => { void navigator.clipboard.writeText(pixCharge.pixCopiaECola); showAlert('Pix Copia e Cola copiado.', 'sucesso') }}>Copiar código Pix</button>
            <p className={`status-pix ${pixCharge.status === 'CONCLUIDA' ? 'pago' : ''}`}>{pixCharge.status === 'CONCLUIDA' ? 'Pagamento confirmado' : 'Aguardando confirmação do Banco do Brasil...'}</p>
            <small>{pixCharge.avisoConfirmacao}</small>
          </div>}
          {subscription.solicitacaoAtivacaoEm && <p className="solicitacao-enviada">Solicitação enviada. Aguarde a análise do administrador.</p>}
        </section>}
        {admin && <>
          <div className="estatisticas estatisticas-assinaturas">
            <article><small>Total de assinaturas</small><strong>{subscriptions.length}</strong><span>comerciantes cadastrados</span></article>
            <article><small>Acessos liberados</small><strong>{subscriptions.filter(item => item.acessoOperacional).length}</strong><span>plano pago e ativo</span></article>
            <article><small>Solicitações pendentes</small><strong>{subscriptions.filter(item => item.solicitacaoAtivacaoEm).length}</strong><span>aguardando sua análise</span></article>
          </div>
          <section className="painel-conteudo">
            <div className="cabecalho-painel-conteudo"><div><h2>Controle de assinaturas</h2><p>Ative, renove ou cancele o acesso de cada comerciante.</p></div>
              <div className="filtros-assinaturas">
                <CampoFlutuante label="Buscar comerciante"><input value={subscriptionQuery} onChange={event => setBuscaAssinatura(event.target.value)} placeholder=" " /></CampoFlutuante>
                <CampoFlutuante label="Situação"><select value={subscriptionStatus} onChange={event => setStatusAssinatura(event.target.value)}><option value="TODAS">Todas</option>{Object.entries(subscriptionStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></CampoFlutuante>
              </div>
            </div>
            <div className="lista-assinaturas">{filteredSubscriptions.map(item => <article key={item.id} className={`item-assinatura ${item.solicitacaoAtivacaoEm ? 'solicitacao-pendente' : ''}`}>
              <div><strong>{item.nomeComerciante}</strong><small>{item.emailMascarado}</small>{item.solicitacaoAtivacaoEm && <b>Solicitou ativação em {new Date(item.solicitacaoAtivacaoEm).toLocaleString('pt-BR')}</b>}</div>
              <span className={`indicador ${item.acessoOperacional ? 'aprovado' : 'rejeitado'}`}>{subscriptionStatusLabels[item.status]}</span>
              <div className="datas-assinatura"><small>Plano profissional · R$ 39,90/mês</small><small>Próxima cobrança: {item.proximaCobranca ? new Date(`${item.proximaCobranca}T12:00:00`).toLocaleDateString('pt-BR') : '-'}</small></div>
              <div className="acoes-assinatura"><button className="pequeno perigo" disabled={item.status === 'CANCELADA'} onClick={() => cancelSubscription(item.id)}>Cancelar</button></div>
            </article>)}{!filteredSubscriptions.length && <p className="vazio">Nenhuma assinatura encontrada com esses filtros.</p>}</div>
          </section>
        </>}
      </section>}

      {section === 'staff' && owner && <section className="visualizacao-secao animar-entrada" key="staff">
        <div className="titulo-secao"><div><p className="sobretitulo">Equipe</p><h2>Funcionários</h2></div><p>Crie acessos individuais e acompanhe quem pode consultar a rede em nome dos seus comércios.</p></div>
        {staffPassword && <div className="senha-temporaria animar-entrada"><div><small>Senha temporária — exibida somente agora</small><strong>{staffPassword}</strong></div><button onClick={() => navigator.clipboard.writeText(staffPassword)}>Copiar senha</button><button className="perigo" onClick={() => setStaffPassword('')}>Fechar</button></div>}
        <div className="colunas-secao">
          <section className="painel-conteudo">
            <div className="cabecalho-painel-conteudo"><div><h2>Equipe cadastrada</h2><p>{employees.length} funcionário(s) vinculado(s) à sua conta.</p></div></div>
            <div className="lista-funcionarios">{employees.map(employee => <article className="cartao-funcionario" key={employee.id}>
              <div className="avatar-funcionario">{employee.nome[0]}{employee.sobrenome[0]}</div>
              <div className="informacoes-funcionario"><strong>{employee.nome} {employee.sobrenome}</strong>
                <small className={!privacyVisible ? 'oculto' : ''}>{privacyVisible
                  ? `${employee.emailMascarado} · ${employee.cpfMascarado} · ${employee.telefoneMascarado}`
                  : 'Dados pessoais protegidos'}</small>
                <small>{employee.dataNascimento
                  ? `Nascimento: ${new Date(`${employee.dataNascimento}T12:00:00`).toLocaleDateString('pt-BR')}`
                  : 'Data de nascimento não informada'}</small></div>
              <span className={`indicador ${employee.ativo ? 'aprovado' : 'rejeitado'}`}>{employee.ativo ? 'Ativo' : 'Bloqueado'}</span>
              <div className="acoes-funcionario"><button className="pequeno" onClick={() => resetStaffPassword(employee.id)}>Redefinir senha</button>
                <button className={`pequeno ${employee.ativo ? 'perigo' : ''}`} onClick={() => changeStaffStatus(employee)}>{employee.ativo ? 'Bloquear acesso' : 'Reativar acesso'}</button>
                <button className="pequeno perigo" onClick={() => deleteStaff(employee)}>Excluir funcionário</button></div>
            </article>)}
              {!employees.length && <p className="vazio">Nenhum funcionário cadastrado.</p>}</div>
          </section>
          <section className="painel-conteudo painel-fixo"><h2>Novo funcionário</h2><p className="suave">O funcionário receberá uma senha temporária e deverá trocá-la no primeiro acesso.</p>
            <form className="formulario-compacto" onSubmit={createStaff}>
              <div className="grade-formulario"><CampoFlutuante label="Nome"><input name="nome" placeholder=" " required /></CampoFlutuante><CampoFlutuante label="Sobrenome"><input name="sobrenome" placeholder=" " required /></CampoFlutuante></div>
              <CampoFlutuante label="CPF: 000.000.000-00"><input name="cpf" inputMode="numeric" maxLength={14} placeholder=" " onInput={event => { event.currentTarget.value = cpfMask(event.currentTarget.value) }} required /></CampoFlutuante>
              <CampoFlutuante label="Telefone: (11) 99999-9999"><input name="telefone" inputMode="tel" maxLength={15} placeholder=" " onInput={event => { event.currentTarget.value = phoneMask(event.currentTarget.value) }} required /></CampoFlutuante>
              <CampoFlutuante label="E-mail: funcionario@mercado.com.br"><input name="email" type="email" placeholder=" " required /></CampoFlutuante>
              <CampoFlutuante label="Data de nascimento (opcional)"><input name="dataNascimento" type="date" max={maximumBirthDate()} placeholder=" "
                onInvalid={event => event.currentTarget.setCustomValidity('O usuário deve ter pelo menos 18 anos')}
                onInput={event => event.currentTarget.setCustomValidity('')} /></CampoFlutuante>
              <button>Criar acesso do funcionário</button>
            </form>
          </section>
        </div>
      </section>}

      {section === 'recovery' && admin && <section className="visualizacao-secao animar-entrada" key="recovery">
        <div className="titulo-secao"><div><p className="sobretitulo">Segurança</p><h2>Recuperação de senha</h2></div><p>Confirme a identidade do responsável antes de gerar uma senha temporária.</p></div>
        {temporaryPassword && <div className="senha-temporaria animar-entrada"><div><small>Senha temporária — exibida somente agora</small><strong>{privacyVisible ? temporaryPassword : '••••••••••'}</strong></div>{privacyVisible && <button onClick={() => navigator.clipboard.writeText(temporaryPassword)}>Copiar senha</button>}<button className="perigo" onClick={() => setTemporaryPassword('')}>Fechar</button></div>}
        <section className="painel-conteudo">
          <div className="cabecalho-painel-conteudo"><div><h2>Solicitações pendentes</h2><p>Analise os dados e confirme a identidade fora do sistema.</p></div><span className="quantidade-solicitacoes">{resetRequests.length} pendente(s)</span></div>
          <div className="cartoes">{resetRequests.map(request => <article className="cartao-comercio" key={request.id}><div><strong className={!privacyVisible ? 'oculto' : ''}>{privacyVisible ? request.nome : 'Responsável protegido'}</strong><small className={!privacyVisible ? 'oculto' : ''}>{privacyVisible ? `${request.nomeComercio} · ${request.cpfMascarado} · ${request.telefoneMascarado}` : `${request.nomeComercio} · ***.***.***-** · (**) *****-****`}</small></div><div><button className="pequeno" onClick={() => approveReset(request.id)}>Gerar senha</button><button className="pequeno perigo" onClick={() => rejectReset(request.id)}>Rejeitar</button></div></article>)}
            {!resetRequests.length && <p className="vazio">Nenhuma solicitação pendente.</p>}</div>
        </section>
      </section>}

      {section === 'auditoria' && admin && <section className="visualizacao-secao animar-entrada" key="auditoria">
        <div className="titulo-secao"><div><p className="sobretitulo">Segurança e rastreabilidade</p><h2>Logs do sistema</h2></div>
          <p><span className={`indicador ${auditOnline ? 'aprovado' : 'rejeitado'}`}>{auditOnline ? 'Atualização em tempo real' : 'Reconectando…'}</span></p></div>
        <section className="painel-conteudo">
          <div className="cabecalho-painel-conteudo"><div><h2>Atividades recentes</h2><p>Últimos 200 eventos de auditoria, atualizados automaticamente.</p></div><span>{auditRecords.length} evento(s)</span></div>
          <div className="envoltorio-tabela"><table><thead><tr><th>Data e hora</th><th>Quem fez</th><th>O que fez</th><th>Para quem/qual item</th><th>Detalhes</th></tr></thead>
            <tbody>{auditRecords.map(record => <tr key={record.id}>
              <td>{new Date(record.dataHora).toLocaleString('pt-BR')}</td>
              <td><strong>{record.nomeUsuario}</strong><br /><small>{roleLabels[record.perfilAcesso]}</small></td>
              <td>{describeAuditAction(record)}</td>
              <td><strong>{record.alvoDescricao ?? record.entidade}</strong><br /><small>{record.entidade} · <code>{record.alvoId}</code></small></td>
              <td>{record.detalhes ?? 'Sem detalhes adicionais'}</td>
            </tr>)}
            {!auditRecords.length && <tr><td colSpan={5} className="vazio">Nenhum evento de auditoria registrado.</td></tr>}</tbody></table></div>
        </section>
      </section>}

      {section === 'perfil' && <section className="visualizacao-secao animar-entrada" key="perfil">
        <div className="titulo-secao"><div><p className="sobretitulo">Minha conta</p><h2>Meu perfil</h2></div><p>Consulte e mantenha suas informações pessoais atualizadas.</p></div>
        {!perfil ? <section className="painel-conteudo"><p className="vazio">Carregando suas informações…</p></section>
          : <div className="estrutura-perfil">
            <section className="painel-conteudo resumo-perfil">
              <div className="avatar-perfil-grande">{perfil.nome[0]}{perfil.sobrenome[0]}</div>
              <h2>{perfil.nome} {perfil.sobrenome}</h2>
              <span className="perfil-acesso">{roleLabels[perfil.perfilAcesso]}</span>
              <dl>
                <div><dt>CPF</dt><dd className={!privacyVisible ? 'oculto' : ''}>{privacyVisible ? perfil.cpfMascarado : '***.***.***-**'}</dd></div>
                <div><dt>E-mail</dt><dd className={!privacyVisible ? 'oculto' : ''}>{privacyVisible ? perfil.emailMascarado : '••••••@••••••.•••'}</dd></div>
                <div><dt>Telefone</dt><dd className={!privacyVisible ? 'oculto' : ''}>{privacyVisible ? perfil.telefoneMascarado : '(**) *****-****'}</dd></div>
              </dl>
            </section>
            <section className="painel-conteudo">
              <div className="cabecalho-painel-conteudo"><div><h2>Editar informações</h2><p>O CPF é um identificador da conta e não pode ser alterado.</p></div></div>
              <form className="formulario-compacto" onSubmit={updatePerfil}>
                <div className="grade-formulario"><CampoFlutuante label="Nome"><input name="nome" placeholder=" " defaultValue={perfil.nome} required /></CampoFlutuante><CampoFlutuante label="Sobrenome"><input name="sobrenome" placeholder=" " defaultValue={perfil.sobrenome} required /></CampoFlutuante></div>
                <CampoFlutuante label="CPF"><input value={perfil.cpfMascarado} placeholder=" " disabled /></CampoFlutuante>
                <CampoFlutuante label={`Novo telefone (atual: ${perfil.telefoneMascarado})`}><input name="telefone" inputMode="tel" maxLength={15} placeholder=" " onInput={event => { event.currentTarget.value = phoneMask(event.currentTarget.value) }} /></CampoFlutuante>
                <CampoFlutuante label={`Novo e-mail (atual: ${perfil.emailMascarado})`}><input name="email" type="email" placeholder=" " /></CampoFlutuante>
                <CampoFlutuante label="Data de nascimento (opcional)"><input name="dataNascimento" type="date" placeholder=" " min="1900-01-01" max={maximumBirthDate()} defaultValue={perfil.dataNascimento ?? ''}
                  onInvalid={event => event.currentTarget.setCustomValidity('O usuário deve ter pelo menos 18 anos')}
                  onInput={event => { event.currentTarget.setCustomValidity(''); limitDateYear(event.currentTarget) }} /></CampoFlutuante>
                <button>Salvar alterações</button>
              </form>
            </section>
          </div>}
      </section>}
    </main>
  </div>
}
