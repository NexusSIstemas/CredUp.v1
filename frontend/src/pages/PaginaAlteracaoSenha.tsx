import { FormEvent, useState } from 'react'
import { api } from '../services/api'
import { mostrarAlerta } from '../services/alertas'
import { CampoFlutuante } from '../components/CampoFlutuante'
import type { Sessao } from '../types'

export function PaginaAlteracaoSenha({ onChanged, onLogout }: {
  onChanged: (sessao: Sessao) => void
  onLogout: () => void
}) {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (form.get('novaSenha') !== form.get('confirmacao')) {
      mostrarAlerta(
        'A confirmação não corresponde à nova senha.',
        'alerta'
      )
      return
    }
    setLoading(true)
    try {
      const sessao = await api<Sessao>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          senhaAtual: form.get('senhaAtual'),
          novaSenha: form.get('novaSenha')
        })
      })
      onChanged(sessao)
    } catch (e) {
      mostrarAlerta(
        e instanceof Error ? e.message : 'Não foi possível trocar a senha.',
        'erro'
      )
    } finally {
      setLoading(false)
    }
  }

  return <main className="pagina-centralizada">
    <section className="cartao-redefinicao">
      <a className="marca" href="#"><span>C</span> CredUp</a>
      <p className="sobretitulo">Proteção da conta</p>
      <h1>Crie uma nova senha</h1>
      <p className="suave">A senha recebida do administrador é temporária. Defina sua senha definitiva para continuar.</p>
      <form onSubmit={submit}>
        <CampoFlutuante label="Senha temporária"><input name="senhaAtual" type={show ? 'text' : 'password'} placeholder=" " required /></CampoFlutuante>
        <CampoFlutuante label="Nova senha"><input name="novaSenha" type={show ? 'text' : 'password'} placeholder=" " minLength={8}
          pattern="(?=.*[A-Za-z])(?=.*\d).{8,}" title="Use pelo menos 8 caracteres, com letras e números." required /></CampoFlutuante>
        <CampoFlutuante label="Confirmar nova senha"><input name="confirmacao" type={show ? 'text' : 'password'} placeholder=" " required /></CampoFlutuante>
        <label className="rotulo-marcacao"><input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} /> Mostrar senhas</label>
        <small className="dica-senha">Use no mínimo 8 caracteres, com letras e números.</small>
        <button disabled={loading}>{loading ? 'Salvando…' : 'Salvar nova senha'}</button>
      </form>
      <button className="botao-texto" onClick={onLogout}>Sair da conta</button>
    </section>
  </main>
}
