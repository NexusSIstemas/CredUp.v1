import type { FormEvent } from 'react'
import { CampoFlutuante } from '../../../components/CampoFlutuante'
import type { Perfil } from '../../../types'
import { ROTULOS_PERFIL } from '../constantes'
import { dataMaximaNascimento, limitarAnoData, mascararTelefone } from '../formatadores'

interface PropriedadesSecaoPerfil {
  perfil: Perfil | null
  dadosVisiveis: boolean
  salvar: (event: FormEvent<HTMLFormElement>) => void
  configurarPin: (event: FormEvent<HTMLFormElement>) => void
}

export function SecaoPerfil({ perfil, dadosVisiveis, salvar, configurarPin }: PropriedadesSecaoPerfil) {
  return <section className="visualizacao-secao animar-entrada">
    <div className="titulo-secao"><div><p className="sobretitulo">Minha conta</p><h2>Meu perfil</h2></div><p>Consulte e mantenha suas informações pessoais atualizadas.</p></div>
    {!perfil ? <section className="painel-conteudo"><p className="vazio">Carregando suas informações…</p></section>
      : <div className="estrutura-perfil">
        <section className="painel-conteudo resumo-perfil">
          <div className="avatar-perfil-grande">{perfil.nomeCompleto[0]}</div>
          <h2>{perfil.nomeCompleto}</h2>
          <span className="perfil-acesso">{ROTULOS_PERFIL[perfil.perfilAcesso]}</span>
          <dl>
            <div><dt>CPF</dt><dd className={!dadosVisiveis ? 'oculto' : ''}>{dadosVisiveis ? perfil.cpfMascarado : '***.***.***-**'}</dd></div>
            <div><dt>E-mail</dt><dd>{perfil.email}</dd></div>
            <div><dt>Telefone</dt><dd>{perfil.telefone ?? 'Não informado'}</dd></div>
          </dl>
        </section>
        <section className="painel-conteudo">
          <div className="cabecalho-painel-conteudo"><div><h2>Editar informações</h2><p>O CPF é um identificador da conta e não pode ser alterado.</p></div></div>
          <form className="formulario-compacto" onSubmit={salvar}>
            <CampoFlutuante label="Nome completo"><input name="nomeCompleto" autoComplete="name" placeholder=" " defaultValue={perfil.nomeCompleto} required /></CampoFlutuante>
            <CampoFlutuante label="CPF"><input value={perfil.cpfMascarado} placeholder=" " disabled /></CampoFlutuante>
            <CampoFlutuante label={`Novo telefone (atual: ${perfil.telefone ?? 'não informado'})`}><input name="telefone" inputMode="tel" maxLength={15} placeholder=" " onInput={event => { event.currentTarget.value = mascararTelefone(event.currentTarget.value) }} /></CampoFlutuante>
            <CampoFlutuante label={`Novo e-mail (atual: ${perfil.email})`}><input name="email" type="email" placeholder=" " /></CampoFlutuante>
            <CampoFlutuante label="Data de nascimento (opcional)"><input name="dataNascimento" type="date" placeholder=" " min="1900-01-01" max={dataMaximaNascimento()} defaultValue={perfil.dataNascimento ?? ''}
              onInvalid={event => event.currentTarget.setCustomValidity('O usuário deve ter pelo menos 18 anos')}
              onInput={event => { event.currentTarget.setCustomValidity(''); limitarAnoData(event.currentTarget) }} /></CampoFlutuante>
            <button>Salvar alterações</button>
          </form>
        </section>
        <section className="painel-conteudo">
          <div className="cabecalho-painel-conteudo"><div><h2>PIN de recuperação</h2><p>{perfil.pinRecuperacaoConfigurado ? 'Seu PIN está configurado. Você pode substituí-lo abaixo.' : 'Configure o PIN para recuperar sua conta sem depender do administrador.'}</p></div></div>
          <div className="aviso-pin"><strong>⚠ Dado sensível: guarde este PIN</strong><p>O PIN tem 6 números, não será exibido novamente e será necessário se você esquecer a senha. Não compartilhe com operadores ou terceiros.</p></div>
          <form className="formulario-compacto" onSubmit={configurarPin}>
            <CampoFlutuante label="Senha atual"><input name="senhaAtual" type="password" placeholder=" " required /></CampoFlutuante>
            <div className="grade-formulario"><CampoFlutuante label="Novo PIN (6 números)"><input name="pin" type="password" inputMode="numeric" minLength={6} maxLength={6} pattern="\d{6}" placeholder=" " required onInput={event => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '').slice(0, 6) }} /></CampoFlutuante><CampoFlutuante label="Confirmar PIN"><input name="confirmacaoPin" type="password" inputMode="numeric" minLength={6} maxLength={6} pattern="\d{6}" placeholder=" " required onInput={event => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '').slice(0, 6) }} /></CampoFlutuante></div>
            <button>{perfil.pinRecuperacaoConfigurado ? 'Alterar PIN' : 'Configurar PIN'}</button>
          </form>
        </section>
      </div>}
  </section>
}
