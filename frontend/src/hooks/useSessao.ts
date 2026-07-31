import { useCallback, useEffect, useState } from 'react'
import { api, EVENTO_NAO_AUTORIZADO } from '../services/api'
import type { Sessao } from '../types'

function lerSessaoSalva(): Sessao | null {
  const raw = localStorage.getItem('credup.session')

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as Sessao
  } catch {
    localStorage.removeItem('credup.session')
    return null
  }
}

export function useSessao() {
  const [sessao, setEstado] = useState<Sessao | null>(lerSessaoSalva)
  const [validando, setValidando] = useState(() => lerSessaoSalva() !== null)

  const setSessao = useCallback((value: Sessao | null) => {
    if (value) localStorage.setItem('credup.session', JSON.stringify(value))
    else localStorage.removeItem('credup.session')
    setEstado(value)
    setValidando(value !== null)
  }, [])

  useEffect(() => {
    const encerrarSessao = () => {
      setEstado(null)
      setValidando(false)
    }

    window.addEventListener(EVENTO_NAO_AUTORIZADO, encerrarSessao)
    return () => window.removeEventListener(EVENTO_NAO_AUTORIZADO, encerrarSessao)
  }, [])

  useEffect(() => {
    if (!sessao) {
      setValidando(false)
      return
    }

    if (sessao.deveAlterarSenha) {
      setValidando(false)
      return
    }

    setValidando(true)
    api('/profile')
      .then(() => setValidando(false))
      .catch(() => {
        setSessao(null)
        setValidando(false)
      })
  }, [sessao?.token, setSessao])

  return { sessao, setSessao, validando }
}
