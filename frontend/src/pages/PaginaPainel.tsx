import { FormEvent, useEffect, useState } from 'react'
import { api, baixarArquivo } from '../services/api'
import {
  confirmarExclusao,
  mostrarAlerta,
  type TomAlerta
} from '../services/alertas'
import { CampoFlutuante } from '../components/CampoFlutuante'
import type { Assinatura, CobrancaPix, StatusCobrancaPix, Comercio, ConfiguracaoPublica, Divida, Funcionario, PagamentoAssinatura, Pagina, SolicitacaoRedefinicaoSenha, Perfil, RegistroAuditoria, Sessao, StatusComercio } from '../types'
import {
  CLASSES_STATUS_COMERCIO,
  CLASSES_STATUS_DIVIDA,
  ROTULOS_PERFIL,
  ROTULOS_STATUS_COMERCIO,
  ROTULOS_STATUS_DIVIDA,
  descreverAcaoAuditoria,
  type SecaoPainel
} from './painel/constantes'
import {
  dataAtual,
  dataMaximaNascimento,
  limitarAnoData,
  mascararCep,
  mascararCnpj,
  mascararCpf,
  mascararMoeda,
  mascararTelefone,
  obterValorMoeda,
  somenteDigitos
} from './painel/formatadores'
import { SecaoAuditoria } from './painel/secoes/SecaoAuditoria'
import { SecaoRecuperacao } from './painel/secoes/SecaoRecuperacao'
import { SecaoVisaoGeral } from './painel/secoes/SecaoVisaoGeral'
import { SecaoFuncionarios } from './painel/secoes/SecaoFuncionarios'
import { SecaoAssinaturas } from './painel/secoes/SecaoAssinaturas'
import { BarraLateralPainel, CabecalhoPainel } from './painel/NavegacaoPainel'

export function PaginaPainel({ sessao, onSessaoChange, onLogout }: {
  sessao: Sessao
  onSessaoChange: (sessao: Sessao) => void
  onLogout: () => void
}) {
  const [section, setSecao] = useState<SecaoPainel>('overview')
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
  const [subscriptionHistory, setHistoricoAssinaturas] = useState<PagamentoAssinatura[]>([])
  const [subscriptionQuery, setBuscaAssinatura] = useState('')
  const [subscriptionStatus, setStatusAssinatura] = useState('TODAS')
  const [subscriptionLoaded, setAssinaturaCarregada] = useState(false)
  const [pixCharge, setCobrancaPix] = useState<CobrancaPix | null>(null)
  const [pixLoading, setPixCarregando] = useState(false)
  const [systemConfig, setConfiguracaoSistema] = useState<ConfiguracaoPublica | null>(null)
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
  const loadSubscriptionHistory = () => api<PagamentoAssinatura[]>(
    admin ? '/assinaturas/historico' : '/assinaturas/minha/historico'
  ).then(setHistoricoAssinaturas).catch(showError)
  const loadSystemConfig = () => api<ConfiguracaoPublica>('/configuracoes/publicas')
    .then(setConfiguracaoSistema)
    .catch(showError)

  useEffect(() => {
    loadSystemConfig()
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
    if (!pixCharge || ['CONCLUIDA', 'processed'].includes(pixCharge.status)) return
    const interval = window.setInterval(async () => {
      try {
        const status = await api<StatusCobrancaPix>(`/assinaturas/minha/cobranca-pix/${pixCharge.txid}`)
        setCobrancaPix(atual => atual ? { ...atual, status: status.status } : atual)
        if (status.pago) {
          window.clearInterval(interval)
          showAlert('Pagamento confirmado. Sua assinatura foi ativada.', 'sucesso')
          loadSubscription()
          loadSubscriptionHistory()
        }
      } catch {
        // Uma falha temporária não interrompe a tela nem duplica a cobrança.
      }
    }, 5_000)
    return () => window.clearInterval(interval)
  }, [pixCharge?.txid, pixCharge?.status])

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
          cnpj: somenteDigitos(form.get('cnpj')),
          endereco: {
            rua: form.get('rua'), cidade: form.get('cidade'), cep: somenteDigitos(form.get('cep')),
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
            cep: somenteDigitos(form.get('cep')),
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
            nome: form.get('nome'), sobrenome: form.get('sobrenome'), apelido: form.get('apelido'),
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
          telefone: somenteDigitos(form.get('telefone')),
          email: form.get('email'),
          dataNascimento: form.get('dataNascimento') || null
        })
      })
      setPerfil(updated)
      onSessaoChange({ ...sessao, nome: updated.nome })
      showAlert('Informações do perfil atualizadas.', 'sucesso')
    } catch (erro) { showError(erro) }
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
          nome: form.get('nome'), sobrenome: form.get('sobrenome'),
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
      `O operador "${funcionario.nome} ${funcionario.sobrenome}" será excluído. Esta ação não poderá ser desfeita.`
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
    .filter(item => `${item.nomeComerciante} ${item.emailMascarado}`
      .toLocaleLowerCase('pt-BR')
      .includes(subscriptionQuery.trim().toLocaleLowerCase('pt-BR')))
    .sort((first, second) => Number(Boolean(second.solicitacaoAtivacaoEm)) - Number(Boolean(first.solicitacaoAtivacaoEm)))

  return <div className="estrutura-aplicacao">
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

      {section === 'commerces' && <section className="visualizacao-secao animar-entrada" key="commerces">
        <div className="titulo-secao"><div><p className="sobretitulo">Estabelecimentos</p><h2>Comércios</h2></div><p>{admin ? 'Analise e acompanhe todos os mercados da rede.' : 'Cadastre e acompanhe seus estabelecimentos.'}</p></div>
        <div className={admin ? 'coluna-unica' : 'colunas-secao'}>
          <section className="painel-conteudo">
            <div className="cabecalho-painel-conteudo"><div><h2>{admin ? 'Mercados cadastrados' : 'Meus comércios'}</h2><p>{commerces.length} estabelecimento(s)</p></div></div>
            <div className="grade-comercios">{commerces.map(commerce => <article className="cartao-mercado" key={commerce.id}>
              <div className="icone-mercado">{commerce.nomeComercio[0]}</div>
              <div className="informacoes-mercado"><strong>{commerce.nomeComercio}</strong><small className={!privacyVisible ? 'oculto' : ''}>{privacyVisible ? mascararCnpj(commerce.cnpj) : '**.***.***/****-**'}</small></div>
              <span className={`indicador ${CLASSES_STATUS_COMERCIO[commerce.status]}`}>{ROTULOS_STATUS_COMERCIO[commerce.status]}</span>
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
                <CampoFlutuante label="CEP"><input name="cep" defaultValue={mascararCep(editingCommerce.endereco.cep)} inputMode="numeric" maxLength={9} placeholder=" " onInput={event => { event.currentTarget.value = mascararCep(event.currentTarget.value) }} required /></CampoFlutuante>
              </div>
              <CampoFlutuante label="Ponto de referência"><input name="pontoReferencia" defaultValue={editingCommerce.endereco.pontoReferencia ?? ''} placeholder=" " /></CampoFlutuante>
              <div className="acoes-formulario"><button>Salvar alterações</button><button type="button" className="fantasma" onClick={() => setEditingCommerce(null)}>Cancelar</button></div>
            </form>
          </section>}
          {owner && <section className="painel-conteudo painel-fixo"><h2>Solicitar cadastro de comércio</h2><p className="suave">A solicitação será analisada pelo administrador. O comércio só entrará na rede depois da aprovação.</p>
            <form onSubmit={createComercio} className="formulario-compacto">
              <CampoFlutuante label="Nome do comércio"><input name="nomeComercio" placeholder=" " required /></CampoFlutuante>
              <CampoFlutuante label="CNPJ: 00.000.000/0000-00"><input name="cnpj" inputMode="numeric" maxLength={18} placeholder=" " onInput={event => { event.currentTarget.value = mascararCnpj(event.currentTarget.value) }} required /></CampoFlutuante>
              <div className="grade-formulario">
                <CampoFlutuante label="Rua"><input name="rua" placeholder=" " required /></CampoFlutuante>
                <CampoFlutuante label="Número"><input name="numberComercio" placeholder=" " required /></CampoFlutuante>
                <CampoFlutuante label="Cidade"><input name="cidade" placeholder=" " required /></CampoFlutuante>
                <CampoFlutuante label="CEP: 00000-000"><input name="cep" inputMode="numeric" maxLength={9} placeholder=" " onInput={event => { event.currentTarget.value = mascararCep(event.currentTarget.value) }} required /></CampoFlutuante>
              </div>
              <CampoFlutuante label="Ponto de referência"><input name="pontoReferencia" placeholder=" " /></CampoFlutuante>
              <button>Enviar solicitação</button>
            </form>
          </section>}
        </div>
      </section>}

      {section === 'defaults' && <section className="visualizacao-secao animar-entrada" key="defaults">
        <div className="titulo-secao"><div><p className="sobretitulo">Rede compartilhada</p><h2>Inadimplentes</h2></div><p>Consulte registros e gerencie dívidas sem expor o CPF completo.</p></div>
        {!staff && (admin || subscription?.podeGerarRelatorio) && <section className="painel-conteudo">
          <div className="cabecalho-painel-conteudo"><div><h2>Relatório em PDF</h2><p>Escolha um dos seus comércios ou selecione “Todos” para incluir toda a rede.</p></div></div>
          <form className="filtros-relatorio" onSubmit={generateReport}>
            <CampoFlutuante label="Data inicial da dívida"><input name="dataInicio" type="date" min="2000-01-01" max={dataAtual()} placeholder=" " required /></CampoFlutuante>
            <CampoFlutuante label="Data final da dívida"><input name="dataFim" type="date" min="2000-01-01" max={dataAtual()} placeholder=" " required /></CampoFlutuante>
            <CampoFlutuante label="Comércio"><select name="idComercio" defaultValue=""><option value="">Todos os comércios da rede</option>{commerces.filter(commerce => admin || commerce.status === 'APPROVED').map(commerce => <option key={commerce.id} value={commerce.id}>{commerce.nomeComercio}</option>)}</select></CampoFlutuante>
            <CampoFlutuante label="Situação"><select name="status" defaultValue=""><option value="">Todas</option>{Object.entries(ROTULOS_STATUS_DIVIDA).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></CampoFlutuante>
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
            <tbody>{debts.map(debt => <tr key={debt.id}><td><strong className={!privacyVisible ? 'oculto' : ''}>{privacyVisible ? `${debt.cliente.nome} ${debt.cliente.sobrenome}` : 'Cliente protegido'}</strong>{privacyVisible && <small>Apelido: {debt.cliente.apelido}</small>}</td><td className={!privacyVisible ? 'oculto' : ''}>{privacyVisible ? debt.cliente.cpfMascarado ?? 'Não informado' : '***.***.***-**'}</td><td>{debt.nomeComercio}</td><td>{new Date(`${debt.dataDivida}T12:00:00`).toLocaleDateString('pt-BR')}</td><td>{new Date(debt.dataCadastro).toLocaleString('pt-BR')}</td><td className={!privacyVisible ? 'oculto' : ''}>{privacyVisible ? debt.valorDivida.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ •••••'}</td><td><span className={`indicador ${CLASSES_STATUS_DIVIDA[debt.status]}`}>{ROTULOS_STATUS_DIVIDA[debt.status]}</span></td><td>{debt.status !== 'PAID' && debt.podeDarBaixa && <button className="pequeno" onClick={() => settle(debt.id)}>Dar baixa</button>}</td></tr>)}
              {!debts.length && <tr><td colSpan={8} className="vazio">Nenhum registro encontrado.</td></tr>}</tbody></table></div>
        </section>
        {(owner || staff) && <section className="painel-conteudo painel-formulario"><div className="cabecalho-painel-conteudo"><div><h2>Nova inadimplência</h2><p>Cadastre um cliente e sua dívida em um comércio aprovado.</p></div></div>
          <form onSubmit={createDivida} className="formulario-compacto formulario-divida">
            <CampoFlutuante label="Selecione o comércio"><select name="idComercio" defaultValue="" required><option value="" disabled></option>{commerces.filter(commerce => commerce.status === 'APPROVED').map(commerce => <option key={commerce.id} value={commerce.id}>{commerce.nomeComercio}</option>)}</select></CampoFlutuante>
            <div className="grade-formulario">
              <CampoFlutuante label="Nome"><input name="nome" placeholder=" " required /></CampoFlutuante>
              <CampoFlutuante label="Sobrenome"><input name="sobrenome" placeholder=" " required /></CampoFlutuante>
              <CampoFlutuante label="Apelido"><input name="apelido" maxLength={120} placeholder=" " required /></CampoFlutuante>
              <CampoFlutuante label="CPF (opcional): 000.000.000-00"><input name="cpf" inputMode="numeric" maxLength={14} placeholder=" " onInput={event => { event.currentTarget.value = mascararCpf(event.currentTarget.value) }} /></CampoFlutuante>
              <CampoFlutuante label="Telefone: (11) 99999-9999"><input name="telefone" inputMode="tel" maxLength={15} placeholder=" " onInput={event => { event.currentTarget.value = mascararTelefone(event.currentTarget.value) }} /></CampoFlutuante>
            </div>
            <CampoFlutuante label="Endereço do cliente"><input name="residencia" placeholder=" " /></CampoFlutuante>
            <div className="grade-formulario">
              <CampoFlutuante label="Valor: R$ 0,00"><input name="valorDivida" type="text" inputMode="numeric" placeholder=" " onInput={event => { event.currentTarget.value = mascararMoeda(event.currentTarget.value) }} required /></CampoFlutuante>
              <CampoFlutuante label="Data da dívida"><input name="dataDivida" type="date" placeholder=" " min="2000-01-01" max={dataAtual()} onInput={event => limitarAnoData(event.currentTarget)} required /></CampoFlutuante>
            </div>
            <CampoFlutuante label="Descrição da dívida"><textarea name="descricao" placeholder=" " /></CampoFlutuante><button>Cadastrar dívida</button>
          </form>
        </section>}
      </section>}

      {section === 'assinatura' && !staff && <SecaoAssinaturas
        administrador={admin}
        gestor={owner}
        assinatura={subscription}
        assinaturas={subscriptions}
        assinaturasFiltradas={filteredSubscriptions}
        historico={subscriptionHistory}
        configuracao={systemConfig}
        busca={subscriptionQuery}
        situacao={subscriptionStatus}
        cobrancaPix={pixCharge}
        gerandoPix={pixLoading}
        alterarBusca={setBuscaAssinatura}
        alterarSituacao={setStatusAssinatura}
        gerarCobrancaPix={generatePixCharge}
        cancelarAssinatura={cancelSubscription}
        copiarPix={codigo => {
          void navigator.clipboard.writeText(codigo)
          showAlert('Pix Copia e Cola copiado.', 'sucesso')
        }}
      />}

      {section === 'staff' && owner && <SecaoFuncionarios
        funcionarios={employees}
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
        dadosVisiveis={privacyVisible}
        aprovar={approveReset}
        rejeitar={rejectReset}
        fecharSenha={() => setTemporaryPassword('')}
      />}

      {section === 'auditoria' && admin && <SecaoAuditoria
        registros={auditRecords}
        online={auditOnline}
      />}

      {section === 'perfil' && <section className="visualizacao-secao animar-entrada" key="perfil">
        <div className="titulo-secao"><div><p className="sobretitulo">Minha conta</p><h2>Meu perfil</h2></div><p>Consulte e mantenha suas informações pessoais atualizadas.</p></div>
        {!perfil ? <section className="painel-conteudo"><p className="vazio">Carregando suas informações…</p></section>
          : <div className="estrutura-perfil">
            <section className="painel-conteudo resumo-perfil">
              <div className="avatar-perfil-grande">{perfil.nome[0]}{perfil.sobrenome[0]}</div>
              <h2>{perfil.nome} {perfil.sobrenome}</h2>
              <span className="perfil-acesso">{ROTULOS_PERFIL[perfil.perfilAcesso]}</span>
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
                <CampoFlutuante label={`Novo telefone (atual: ${perfil.telefoneMascarado})`}><input name="telefone" inputMode="tel" maxLength={15} placeholder=" " onInput={event => { event.currentTarget.value = mascararTelefone(event.currentTarget.value) }} /></CampoFlutuante>
                <CampoFlutuante label={`Novo e-mail (atual: ${perfil.emailMascarado})`}><input name="email" type="email" placeholder=" " /></CampoFlutuante>
                <CampoFlutuante label="Data de nascimento (opcional)"><input name="dataNascimento" type="date" placeholder=" " min="1900-01-01" max={dataMaximaNascimento()} defaultValue={perfil.dataNascimento ?? ''}
                  onInvalid={event => event.currentTarget.setCustomValidity('O usuário deve ter pelo menos 18 anos')}
                  onInput={event => { event.currentTarget.setCustomValidity(''); limitarAnoData(event.currentTarget) }} /></CampoFlutuante>
                <button>Salvar alterações</button>
              </form>
            </section>
            <section className="painel-conteudo">
              <div className="cabecalho-painel-conteudo"><div><h2>PIN de recuperação</h2><p>{perfil.pinRecuperacaoConfigurado ? 'Seu PIN está configurado. Você pode substituí-lo abaixo.' : 'Configure o PIN para recuperar sua conta sem depender do administrador.'}</p></div></div>
              <div className="aviso-pin"><strong>⚠ Dado sensível: guarde este PIN</strong><p>O PIN tem 6 números, não será exibido novamente e será necessário se você esquecer a senha. Não compartilhe com operadores ou terceiros.</p></div>
              <form className="formulario-compacto" onSubmit={configurarPin}>
                <CampoFlutuante label="Senha atual"><input name="senhaAtual" type="password" placeholder=" " required /></CampoFlutuante>
                <div className="grade-formulario"><CampoFlutuante label="Novo PIN (6 números)"><input name="pin" type="password" inputMode="numeric" minLength={6} maxLength={6} pattern="\d{6}" placeholder=" " required onInput={event => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '').slice(0, 6) }} /></CampoFlutuante><CampoFlutuante label="Confirmar PIN"><input name="confirmacaoPin" type="password" inputMode="numeric" minLength={6} maxLength={6} pattern="\d{6}" placeholder=" " required onInput={event => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '').slice(0, 6) }} /></CampoFlutuante></div>
                <button>{perfil.pinRecuperacaoConfigurado ? 'Alterar PIN' : 'Configurar PIN'}</button>
              </form>
            </section>
          </div>}
      </section>}
    </main>
  </div>
}
