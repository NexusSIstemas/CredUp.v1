import type { Sessao } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'
export const EVENTO_NAO_AUTORIZADO = 'credup:nao-autorizado'

function informarAcessoNaoAutorizado(status: number) {
  if (status !== 401) {
    return
  }

  localStorage.removeItem('credup.session')
  window.dispatchEvent(new Event(EVENTO_NAO_AUTORIZADO))
}

export class ErroApi extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const raw = localStorage.getItem('credup.session')
  const session: Sessao | null = raw ? JSON.parse(raw) : null
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      ...options.headers
    }
  })
  if (!response.ok) {
    informarAcessoNaoAutorizado(response.status)
    const body = await response.json().catch(() => null)
    throw new ErroApi(body?.mensagem ?? 'Não foi possível concluir a operação', response.status)
  }
  return response.status === 204 ? (undefined as T) : response.json()
}

export async function baixarArquivo(path: string): Promise<{ arquivo: Blob; nome: string }> {
  const raw = localStorage.getItem('credup.session')
  const sessao: Sessao | null = raw ? JSON.parse(raw) : null
  const response = await fetch(`${API_URL}${path}`, {
    headers: sessao ? { Authorization: `Bearer ${sessao.token}` } : {}
  })
  if (!response.ok) {
    informarAcessoNaoAutorizado(response.status)
    const body = await response.json().catch(() => null)
    throw new ErroApi(body?.mensagem ?? 'Não foi possível gerar o arquivo', response.status)
  }
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const nome = disposition.match(/filename="([^"]+)"/)?.[1] ?? 'relatorio.pdf'
  return { arquivo: await response.blob(), nome }
}
