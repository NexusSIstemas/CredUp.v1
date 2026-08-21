import type { Sessao } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'
export const EVENTO_NAO_AUTORIZADO = 'credup:nao-autorizado'
export const EVENTO_SESSAO_ATUALIZADA = 'credup:sessao-atualizada'
let tokenAcesso: string | null = null
let renovacaoEmAndamento: Promise<Sessao> | null = null

export function configurarTokenAcesso(token: string | null) {
  tokenAcesso = token
}

function informarAcessoNaoAutorizado(status: number) {
  if (status !== 401) {
    return
  }

  configurarTokenAcesso(null)
  window.dispatchEvent(new Event(EVENTO_NAO_AUTORIZADO))
}

export class ErroApi extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response = await requisicao(path, options)
  if (response.status === 401 && !path.startsWith('/auth/')) {
    try {
      await renovarSessao()
      response = await requisicao(path, options)
    } catch {
      informarAcessoNaoAutorizado(401)
    }
  }
  if (!response.ok) {
    informarAcessoNaoAutorizado(response.status)
    const body = await response.json().catch(() => null)
    throw new ErroApi(body?.mensagem ?? 'Não foi possível concluir a operação', response.status)
  }
  return response.status === 204 ? (undefined as T) : response.json()
}

async function requisicao(path: string, options: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(tokenAcesso ? { Authorization: `Bearer ${tokenAcesso}` } : {}),
      ...options.headers
    }
  })
}

export function renovarSessao(): Promise<Sessao> {
  if (renovacaoEmAndamento) return renovacaoEmAndamento
  renovacaoEmAndamento = fetch(`${API_URL}/auth/refresh`, {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }
  }).then(async response => {
    if (!response.ok) throw new ErroApi('Sessão expirada', response.status)
    const sessao = await response.json() as Sessao
    configurarTokenAcesso(sessao.token)
    window.dispatchEvent(new CustomEvent(EVENTO_SESSAO_ATUALIZADA, { detail: sessao }))
    return sessao
  }).finally(() => { renovacaoEmAndamento = null })
  return renovacaoEmAndamento
}

export async function encerrarSessao() {
  try {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' })
  } finally {
    configurarTokenAcesso(null)
  }
}

export async function baixarArquivo(path: string): Promise<{ arquivo: Blob; nome: string }> {
  let response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: tokenAcesso ? { Authorization: `Bearer ${tokenAcesso}` } : {}
  })
  if (response.status === 401) {
    await renovarSessao()
    response = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      headers: tokenAcesso ? { Authorization: `Bearer ${tokenAcesso}` } : {}
    })
  }
  if (!response.ok) {
    informarAcessoNaoAutorizado(response.status)
    const body = await response.json().catch(() => null)
    throw new ErroApi(body?.mensagem ?? 'Não foi possível gerar o arquivo', response.status)
  }
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const nome = disposition.match(/filename="([^"]+)"/)?.[1] ?? 'relatorio.pdf'
  return { arquivo: await response.blob(), nome }
}
