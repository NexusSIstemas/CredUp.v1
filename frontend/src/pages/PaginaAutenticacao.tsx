import { FormEvent, useState } from 'react'
import { api } from '../services/api'
import { mostrarAlerta } from '../services/alertas'
import { CampoFlutuante } from '../components/CampoFlutuante'
import type { Sessao } from '../types'

function onlyDigits(value: FormDataEntryValue | null) {
  return String(value ?? '').replace(/\D/g, '')
}

function maskCpf(value: string) {
  return value.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits.length <= 10
    ? digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    : digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

function maximumBirthDate() {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 18)
  return date.toISOString().slice(0, 10)
}

export function PaginaAutenticacao({ onAuth }: { onAuth: (session: Sessao) => void }) {
  const [register, setRegister] = useState(false)
  const [forgotPassword, setForgotPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const form = new FormData(event.currentTarget)
    const data: Record<string, FormDataEntryValue | null> =
      Object.fromEntries(form)
    if (forgotPassword) {
      data.cpf = onlyDigits(form.get('cpf'))
      data.telefone = onlyDigits(form.get('telefone'))
    }
    if (register) {
      data.cpf = onlyDigits(form.get('cpf'))
      data.telefone = onlyDigits(form.get('telefone'))
      data.dataNascimento = form.get('dataNascimento') || null
    }
    try {
      if (forgotPassword) {
        const response = await api<{ mensagem: string }>('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify(data)
        })
        await mostrarAlerta(response.mensagem, 'sucesso')
        return
      }
      const session = await api<Sessao>(register ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      onAuth(session)
    } catch (e) {
      await mostrarAlerta(
        e instanceof Error ? e.message : 'Erro inesperado',
        'erro'
      )
    } finally {
      setLoading(false)
    }
  }

  return <main className="estrutura-autenticacao">
    <section className="apresentacao-autenticacao">
      <a className="marca" href="#"><span>C</span> CredUp</a>
      <div>
        <p className="sobretitulo">Crédito com mais contexto</p>
        <h1>Decisões mais seguras para o comércio local.</h1>
        <p>A rede colaborativa que ajuda comerciantes a consultar e gerir inadimplências com responsabilidade.</p>
      </div>
      <small>Informação protegida. Acesso rastreável.</small>
    </section>
    <section className="cartao-autenticacao">
      <div className="envoltorio-formulario">
        <p className="sobretitulo">{forgotPassword ? 'Recuperação de acesso' : register ? 'Comece agora' : 'Bem-vindo de volta'}</p>
        <h2>{forgotPassword ? 'Esqueceu a senha?' : register ? 'Crie sua conta' : 'Entre na sua conta'}</h2>
        <p className="suave">{forgotPassword
          ? 'Confirme seus dados para enviar uma solicitação ao administrador.'
          : register ? 'Cadastre-se como responsável pelo comércio.' : 'Use suas credenciais para acessar a rede.'}</p>
        <form onSubmit={submit}>
          {forgotPassword && <>
            <CampoFlutuante label="CPF: 000.000.000-00"><input name="cpf" inputMode="numeric" maxLength={14} placeholder=" "
              onInput={e => { e.currentTarget.value = maskCpf(e.currentTarget.value) }} required /></CampoFlutuante>
            <CampoFlutuante label="Nome do mercado"><input name="nomeComercio" placeholder=" " required /></CampoFlutuante>
            <CampoFlutuante label="Telefone cadastrado: (11) 99999-9999"><input name="telefone" inputMode="tel" maxLength={15} placeholder=" "
              onInput={e => { e.currentTarget.value = maskPhone(e.currentTarget.value) }} required /></CampoFlutuante>
          </>}
          {register && <div className="grade-formulario">
            <CampoFlutuante label="Nome"><input name="nome" placeholder=" " required /></CampoFlutuante>
            <CampoFlutuante label="Sobrenome"><input name="sobrenome" placeholder=" " required /></CampoFlutuante>
            <CampoFlutuante label="Telefone: (11) 99999-9999"><input name="telefone" inputMode="tel" maxLength={15} placeholder=" " onInput={e => { e.currentTarget.value = maskPhone(e.currentTarget.value) }} required /></CampoFlutuante>
            <CampoFlutuante label="CPF: 000.000.000-00"><input name="cpf" inputMode="numeric" maxLength={14} placeholder=" " onInput={e => { e.currentTarget.value = maskCpf(e.currentTarget.value) }} required /></CampoFlutuante>
            <CampoFlutuante label="Data de nascimento (opcional)"><input name="dataNascimento" type="date" max={maximumBirthDate()} placeholder=" "
              onInvalid={event => event.currentTarget.setCustomValidity('O usuário deve ter pelo menos 18 anos')}
              onInput={event => event.currentTarget.setCustomValidity('')} /></CampoFlutuante>
          </div>}
          {!forgotPassword && <CampoFlutuante label={register ? 'E-mail: dono@mercado.com.br' : 'E-mail: seuemail@exemplo.com'}><input name="email" type="email" placeholder=" " required /></CampoFlutuante>}
          {!forgotPassword && <CampoFlutuante label="Senha">
            <span className="campo-senha">
              <input
                name="senha"
                type={showPassword ? 'text' : 'password'}
                placeholder=" "
                minLength={8}
                pattern={register ? '(?=.*[A-Za-z])(?=.*\\d).{8,}' : undefined}
                title={register ? 'Use pelo menos 8 caracteres, com letras e números.' : undefined}
                required
              />
              <button
                type="button"
                className="alternar-senha"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                  <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                  <circle cx="12" cy="12" r="2.75" />
                  {!showPassword && <path d="m4 4 16 16" className="traco-olho" />}
                </svg>
              </button>
            </span>
          </CampoFlutuante>}
          {register && <small className="dica-senha">Use no mínimo 8 caracteres, com letras e números.</small>}
          <button disabled={loading}>{loading ? 'Aguarde…' : forgotPassword ? 'Enviar solicitação' : register ? 'Criar conta' : 'Entrar'}</button>
        </form>
        {!register && !forgotPassword && <button className="botao-texto" onClick={() => setForgotPassword(true)}>
          Esqueci minha senha
        </button>}
        <button className="botao-texto" onClick={() => {
          if (forgotPassword || register) {
            setForgotPassword(false); setRegister(false)
          } else setRegister(true)
          setShowPassword(false)
        }}>
          {forgotPassword || register ? 'Voltar para o login' : 'Ainda não tenho uma conta'}
        </button>
      </div>
    </section>
  </main>
}
