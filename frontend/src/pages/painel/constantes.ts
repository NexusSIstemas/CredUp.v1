import type {
  PerfilAcesso,
  RegistroAuditoria,
  StatusComercio,
  StatusDivida
} from '../../types'

export type SecaoPainel =
  | 'overview'
  | 'commerces'
  | 'defaults'
  | 'staff'
  | 'recovery'
  | 'auditoria'
  | 'assinatura'
  | 'perfil'

export const ROTULOS_PERFIL: Record<PerfilAcesso, string> = {
  ADMIN_REDE: 'Administrador da rede',
  MERCHANT_OWNER: 'Dono de comércio',
  MERCHANT_STAFF: 'Funcionário do comércio'
}

export const ROTULOS_STATUS_COMERCIO: Record<StatusComercio, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Reprovado'
}

export const ROTULOS_STATUS_DIVIDA: Record<StatusDivida, string> = {
  PENDING: 'Pendente',
  DISPUTED: 'Contestado',
  NEGOTIATING: 'Em negociação',
  PARTIALLY_PAID: 'Parcialmente pago',
  PAID: 'Pago',
  CANCELED: 'Cancelado'
}

export const ROTULOS_STATUS_ASSINATURA = {
  AGUARDANDO_APROVACAO: 'Aguardando aprovação',
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  ATIVA: 'Ativa',
  ATRASADA: 'Pagamento pendente',
  EXPIRADA: 'Expirada',
  CANCELADA: 'Cancelada'
} as const

export const CLASSES_STATUS_COMERCIO: Record<StatusComercio, string> = {
  PENDING: 'pendente',
  APPROVED: 'aprovado',
  REJECTED: 'rejeitado'
}

export const CLASSES_STATUS_DIVIDA: Record<StatusDivida, string> = {
  PENDING: 'pendente',
  DISPUTED: 'contestado',
  NEGOTIATING: 'negociando',
  PARTIALLY_PAID: 'parcialmente-pago',
  PAID: 'pago',
  CANCELED: 'cancelado'
}

const ROTULOS_ACAO: Record<string, string> = {
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

export function descreverAcaoAuditoria(registro: RegistroAuditoria) {
  if (registro.acao === 'DAR_BAIXA_DIVIDA' && registro.alvoDescricao) {
    return `Deu baixa na dívida de ${registro.alvoDescricao}`
  }
  if (registro.acao === 'CRIAR_DIVIDA' && registro.alvoDescricao) {
    return `Cadastrou uma dívida para ${registro.alvoDescricao}`
  }
  return ROTULOS_ACAO[registro.acao] ?? registro.acao
}
