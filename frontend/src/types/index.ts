export type PerfilAcesso = 'ADMIN_REDE' | 'MERCHANT_OWNER' | 'MERCHANT_STAFF'
export type StatusComercio = 'PENDING' | 'APPROVED' | 'REJECTED'
export type StatusDivida = 'PENDING' | 'DISPUTED' | 'NEGOTIATING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELED'
export type StatusAssinatura = 'AGUARDANDO_APROVACAO' | 'AGUARDANDO_PAGAMENTO' | 'ATIVA' | 'ATRASADA' | 'EXPIRADA' | 'CANCELADA'

export interface ConfiguracaoPublica {
  nomePlano: string
  valorMensal: number
  diasToleranciaPagamento: number
}

export interface PlanoComercial {
  codigo: 'ESSENCIAL' | 'GESTAO' | 'REDE'
  nome: string
  valorMensal: number
  limiteOperadores: number
  mesesHistorico: number
  relatoriosCompletos: boolean
  centralCobranca: boolean
  indicadoresAvancados: boolean
  importacaoExportacao: boolean
}

export interface Assinatura {
  id: string
  idComerciante: string
  nomeComerciante: string
  emailMascarado: string
  plano: PlanoComercial
  proximoPlano: PlanoComercial | null
  status: StatusAssinatura
  inicioAssinatura: string | null
  proximaCobranca: string | null
  solicitacaoAtivacaoEm: string | null
  valorUltimoPagamento: number | null
  ultimoPagamentoEm: string | null
  criadaEm: string
  atualizadaEm: string
  acessoOperacional: boolean
  podeGerarRelatorio: boolean
}

export interface CobrancaPix {
  valor: number
  txid: string
  nomeRecebedor: string
  pixCopiaECola: string
  qrCodeBase64: string
  geradoEm: string
  status: string
  expiracaoSegundos: number
  avisoConfirmacao: string
}

export interface StatusCobrancaPix {
  txid: string
  status: string
  pago: boolean
  confirmadoEm: string | null
}

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
  pinRecuperacaoConfigurado: boolean
}

export interface PagamentoAssinatura {
  id: string
  nomeGestor: string
  emailMascarado: string
  valor: number
  pagoEm: string
  acessoValidoAte: string
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
    apelido: string
    cpfMascarado: string | null
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
