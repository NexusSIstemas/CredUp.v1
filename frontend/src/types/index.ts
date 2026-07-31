export type PerfilAcesso = 'ADMIN_REDE' | 'MERCHANT_OWNER' | 'MERCHANT_STAFF'
export type StatusComercio = 'PENDING' | 'APPROVED' | 'REJECTED'
export type StatusDivida = 'PENDING' | 'DISPUTED' | 'NEGOTIATING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELED'

export interface Sessao {
  token: string
  idUsuario: string
  nome: string
  perfilAcesso: PerfilAcesso
  deveAlterarSenha: boolean
}

export interface SolicitacaoRedefinicaoSenha {
  id: string
  nome: string
  cpfMascarado: string
  telefoneMascarado: string
  nomeComercio: string
  solicitadoEm: string
}

export interface Perfil {
  id: string
  nome: string
  sobrenome: string
  telefoneMascarado: string
  cpfMascarado: string
  emailMascarado: string
  dataNascimento: string | null
  perfilAcesso: PerfilAcesso
}

export interface Funcionario {
  id: string
  nome: string
  sobrenome: string
  emailMascarado: string
  cpfMascarado: string
  telefoneMascarado: string
  dataNascimento: string | null
  ativo: boolean
}

export interface Comercio {
  id: string
  nomeComercio: string
  cnpj: string
  idComerciante: string
  status: StatusComercio
  endereco: {
    rua: string
    cidade: string
    cep: string
    numberComercio: string
    pontoReferencia: string | null
  }
}

export interface Divida {
  id: string
  cliente: {
    id: string
    nome: string
    sobrenome: string
    apelido: string | null
    cpfMascarado: string
  }
  idComercio: string
  nomeComercio: string
  valorDivida: number
  dataDivida: string
  dataCadastro: string
  status: StatusDivida
  podeDarBaixa: boolean
}

export interface Pagina<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
}

export interface RegistroAuditoria {
  id: string
  dataHora: string
  acao: string
  entidade: string
  alvoId: string
  idUsuario: string
  nomeUsuario: string
  perfilAcesso: PerfilAcesso
  alvoDescricao: string | null
  detalhes: string | null
}
