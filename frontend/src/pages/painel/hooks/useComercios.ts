import { useState, type FormEvent } from 'react'
import { api } from '../../../services/api'
import { confirmarExclusao, mostrarAlerta } from '../../../services/alertas'
import type { Comercio, StatusComercio } from '../../../types'
import { somenteDigitos } from '../formatadores'

export function useComercios() {
  const [comercios, definirComercios] = useState<Comercio[]>([])
  const [carregados, definirCarregados] = useState(false)
  const [emEdicao, definirEmEdicao] = useState<Comercio | null>(null)

  const mostrarErro = (erro: unknown) => {
    void mostrarAlerta(erro instanceof Error ? erro.message : 'Erro inesperado', 'erro')
  }

  const carregar = () => api<Comercio[]>('/commerces')
    .then(definirComercios)
    .catch(mostrarErro)
    .finally(() => definirCarregados(true))

  async function solicitarCadastro(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formulario = event.currentTarget
    const campos = new FormData(formulario)
    try {
      await api('/commerces', {
        method: 'POST',
        body: JSON.stringify({
          nomeComercio: campos.get('nomeComercio'),
          cnpj: somenteDigitos(campos.get('cnpj')),
          endereco: {
            rua: campos.get('rua'),
            cidade: campos.get('cidade'),
            cep: somenteDigitos(campos.get('cep')),
            numberComercio: campos.get('numberComercio'),
            pontoReferencia: campos.get('pontoReferencia')
          }
        })
      })
      formulario.reset()
      void mostrarAlerta('Comércio enviado para aprovação.', 'sucesso')
      void carregar()
    } catch (erro) {
      mostrarErro(erro)
    }
  }

  async function salvarEdicao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!emEdicao) return
    const campos = new FormData(event.currentTarget)
    try {
      await api(`/commerces/${emEdicao.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nomeComercio: campos.get('nomeComercio'),
          endereco: {
            rua: campos.get('rua'),
            cidade: campos.get('cidade'),
            cep: somenteDigitos(campos.get('cep')),
            numberComercio: campos.get('numberComercio'),
            pontoReferencia: campos.get('pontoReferencia')
          }
        })
      })
      definirEmEdicao(null)
      void mostrarAlerta('Dados do comércio atualizados.', 'sucesso')
      void carregar()
    } catch (erro) {
      mostrarErro(erro)
    }
  }

  async function excluir(comercio: Comercio) {
    const confirmado = await confirmarExclusao(
      'Excluir comércio?',
      `O comércio "${comercio.nomeComercio}" será excluído. Esta ação não poderá ser desfeita.`
    )
    if (!confirmado) return
    try {
      await api(`/commerces/${comercio.id}`, { method: 'DELETE' })
      if (emEdicao?.id === comercio.id) definirEmEdicao(null)
      void mostrarAlerta('Comércio excluído.', 'sucesso')
      void carregar()
    } catch (erro) {
      mostrarErro(erro)
    }
  }

  async function avaliar(id: string, status: StatusComercio) {
    try {
      await api(`/commerces/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      })
      void mostrarAlerta(
        status === 'APPROVED' ? 'Comércio aprovado.' : 'Comércio reprovado.',
        'sucesso'
      )
      void carregar()
    } catch (erro) {
      mostrarErro(erro)
    }
  }

  return {
    comercios,
    carregados,
    emEdicao,
    definirEmEdicao,
    carregar,
    solicitarCadastro,
    salvarEdicao,
    excluir,
    avaliar
  }
}
