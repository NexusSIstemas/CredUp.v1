import { FormEvent, useEffect, useState } from 'react'
import { api } from '../services/api'
import { mostrarAlerta } from '../services/alertas'
import { CampoFlutuante } from '../components/CampoFlutuante'
import { CarrosselPlanos } from '../components/CarrosselPlanos'
import type { PlanoComercial, Sessao } from '../types'

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
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [planos, setPlanos] = useState<PlanoComercial[]>([])

  useEffect(() => {
    api<PlanoComercial[]>('/assinaturas/planos')
      .then(setPlanos)
      .catch(() => setPlanos([]))
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const form = new FormData(event.currentTarget)
    const data: Record<string, FormDataEntryValue | null> =
      Object.fromEntries(form)
    if (forgotPassword) {
      data.pin = onlyDigits(form.get('pin'))
      if (data.novaSenha !== data.confirmacaoSenha) {
        mostrarAlerta('As senhas não coincidem.', 'erro')
        setLoading(false)
        return
      }
      delete data.confirmacaoSenha
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
        mostrarAlerta(response.mensagem, 'sucesso')
        return
      }
      const session = await api<Sessao>(register ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      onAuth(session)
    } catch (e) {
      mostrarAlerta(
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
        <div className="divulgacao-planos-autenticacao">
          <p className="sobretitulo">Planos para cada fase</p>
          <CarrosselPlanos planos={planos} compacto />
        </div>
      </div>
      <small>Informação protegida. Acesso rastreável.</small>
    </section>
    <section className="cartao-autenticacao">
      <div className="envoltorio-formulario">
        <p className="sobretitulo">{forgotPassword ? 'Recuperação de acesso' : register ? 'Comece agora' : 'Bem-vindo de volta'}</p>
        <h2>{forgotPassword ? 'Esqueceu a senha?' : register ? 'Crie sua conta' : 'Entre na sua conta'}</h2>
        <p className="suave">{forgotPassword
          ? 'Informe o e-mail e o PIN de recuperação para criar uma nova senha.'
          : register ? 'Cadastre-se como responsável pelo comércio.' : 'Use suas credenciais para acessar a rede.'}</p>
        <form onSubmit={submit}>
          {forgotPassword && <>
            <CampoFlutuante label="E-mail vinculado"><input name="email" type="email" placeholder=" " required /></CampoFlutuante>
            <CampoFlutuante label="PIN de recuperação (6 números)"><span className="campo-senha"><input name="pin" type={showPin ? 'text' : 'password'} inputMode="numeric" minLength={6} maxLength={6} pattern="\d{6}" placeholder=" " required onInput={event => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '').slice(0, 6) }} /><button type="button" className="alternar-senha" onClick={() => setShowPin(!showPin)} aria-label={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.75" />{!showPin && <path d="m4 4 16 16" className="traco-olho" />}</svg></button></span></CampoFlutuante>
            <CampoFlutuante label="Nova senha"><input name="novaSenha" type="password" minLength={8} pattern="(?=.*[A-Za-z])(?=.*\d).{8,}" placeholder=" " required /></CampoFlutuante>
            <CampoFlutuante label="Confirmar nova senha"><input name="confirmacaoSenha" type="password" minLength={8} placeholder=" " required /></CampoFlutuante>
          </>}
          {register && <div className="grade-formulario">
            <CampoFlutuante label="Nome"><input name="nome" placeholder=" " required /></CampoFlutuante>
            <CampoFlutuante label="Sobrenome"><input name="sobrenome" placeholder=" " required /></CampoFlutuante>
            <CampoFlutuante label="Telefone: (11) 99999-9999"><input name="telefone" inputMode="tel" maxLength={15} placeholder=" " onInput={e => { e.currentTarget.value = maskPhone(e.currentTarget.value) }} required /></CampoFlutuante>
            <CampoFlutuante label="CPF: 000.000.000-00"><input name="cpf" inputMode="numeric" maxLength={14} placeholder=" " onInput={e => { e.currentTarget.value = maskCpf(e.currentTarget.value) }} required /></CampoFlutuante>
            <CampoFlutuante label="Data de nascimento (opcional)"><input name="dataNascimento" type="date" max={maximumBirthDate()} placeholder=" "
              onInvalid={event => event.currentTarget.setCustomValidity('O usuário deve ter pelo menos 18 anos')}
              onInput={event => event.currentTarget.setCustomValidity('')} /></CampoFlutuante>
            <CampoFlutuante label="PIN de recuperação (6 números)"><input name="pinRecuperacao" type="password" inputMode="numeric" minLength={6} maxLength={6} pattern="\d{6}" placeholder=" " required onInput={event => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '').slice(0, 6) }} /></CampoFlutuante>
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
          {register && <><small className="dica-senha">Use no mínimo 8 caracteres, com letras e números.</small><div className="aviso-pin"><strong>⚠ Guarde seu PIN em um local seguro</strong><p>Ele é um dado sensível e será necessário para recuperar sua conta. O CredUp não consegue mostrar esse PIN depois do cadastro.</p></div></>}
          <button disabled={loading}>{loading ? 'Aguarde…' : forgotPassword ? 'Criar nova senha' : register ? 'Criar conta' : 'Entrar'}</button>
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
