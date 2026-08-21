import { useCallback, useEffect, useState } from 'react'
import { configurarTokenAcesso, encerrarSessao as encerrarSessaoRemota, EVENTO_NAO_AUTORIZADO, EVENTO_SESSAO_ATUALIZADA, renovarSessao } from '../services/api'
import type { Sessao } from '../types'

export function useSessao() {
  const [sessao, setEstado] = useState<Sessao | null>(null)
  const [validando, setValidando] = useState(true)

  const setSessao = useCallback((value: Sessao | null) => {
    configurarTokenAcesso(value?.token ?? null)
    setEstado(value)
    setValidando(false)
  }, [])

  useEffect(() => {
    const lidarComNaoAutorizado = () => {
      setEstado(null)
      setValidando(false)
    }

    window.addEventListener(EVENTO_NAO_AUTORIZADO, lidarComNaoAutorizado)
    const atualizar = (evento: Event) => setEstado((evento as CustomEvent<Sessao>).detail)
    window.addEventListener(EVENTO_SESSAO_ATUALIZADA, atualizar)
    renovarSessao().then(setEstado).catch(() => setEstado(null)).finally(() => setValidando(false))
    return () => {
      window.removeEventListener(EVENTO_NAO_AUTORIZADO, lidarComNaoAutorizado)
      window.removeEventListener(EVENTO_SESSAO_ATUALIZADA, atualizar)
    }
  }, [])

  const sair = useCallback(async () => {
    await encerrarSessaoRemota()
    setEstado(null)
    setValidando(false)
  }, [])

  return { sessao, setSessao, validando, sair }
}
