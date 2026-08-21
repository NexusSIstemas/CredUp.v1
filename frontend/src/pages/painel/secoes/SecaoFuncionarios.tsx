import type { FormEvent } from 'react'
import { CampoFlutuante } from '../../../components/CampoFlutuante'
import type { Funcionario } from '../../../types'
import { dataMaximaNascimento, mascararCpf, mascararTelefone } from '../formatadores'

interface Propriedades {
  funcionarios: Funcionario[]
  senhaTemporaria: string
  dadosVisiveis: boolean
  criar: (evento: FormEvent<HTMLFormElement>) => void
  redefinirSenha: (id: string) => void
  alterarStatus: (funcionario: Funcionario) => void
  excluir: (funcionario: Funcionario) => void
  fecharSenha: () => void
}

export function SecaoFuncionarios({
  funcionarios,
  senhaTemporaria,
  dadosVisiveis,
  criar,
  redefinirSenha,
  alterarStatus,
  excluir,
  fecharSenha
}: Propriedades) {
  return <section className="visualizacao-secao animar-entrada">
    <div className="titulo-secao"><div><p className="sobretitulo">Equipe</p><h2>Funcionários</h2></div><p>Crie acessos individuais e acompanhe quem pode consultar a rede em nome dos seus comércios.</p></div>
    {senhaTemporaria && <div className="senha-temporaria animar-entrada"><div><small>Senha temporária — exibida somente agora</small><strong>{senhaTemporaria}</strong></div><button onClick={() => navigator.clipboard.writeText(senhaTemporaria)}>Copiar senha</button><button className="perigo" onClick={fecharSenha}>Fechar</button></div>}
    <div className="colunas-secao">
      <section className="painel-conteudo">
        <div className="cabecalho-painel-conteudo"><div><h2>Equipe cadastrada</h2><p>{funcionarios.length} funcionário(s) vinculado(s) à sua conta.</p></div></div>
        <div className="lista-funcionarios">{funcionarios.map(funcionario => <article className="cartao-funcionario" key={funcionario.id}>
          <div className="avatar-funcionario">{funcionario.nome[0]}{funcionario.sobrenome[0]}</div>
          <div className="informacoes-funcionario"><strong>{funcionario.nome} {funcionario.sobrenome}</strong>
            <small className={!dadosVisiveis ? 'oculto' : ''}>{dadosVisiveis ? `${funcionario.emailMascarado} · ${funcionario.cpfMascarado} · ${funcionario.telefoneMascarado}` : 'Dados pessoais protegidos'}</small>
            <small>{funcionario.dataNascimento ? `Nascimento: ${new Date(`${funcionario.dataNascimento}T12:00:00`).toLocaleDateString('pt-BR')}` : 'Data de nascimento não informada'}</small></div>
          <span className={`indicador ${funcionario.ativo ? 'aprovado' : 'rejeitado'}`}>{funcionario.ativo ? 'Ativo' : 'Bloqueado'}</span>
          <div className="acoes-funcionario"><button className="pequeno" onClick={() => redefinirSenha(funcionario.id)}>Redefinir senha</button>
            <button className={`pequeno ${funcionario.ativo ? 'perigo' : ''}`} onClick={() => alterarStatus(funcionario)}>{funcionario.ativo ? 'Bloquear acesso' : 'Reativar acesso'}</button>
            <button className="pequeno perigo" onClick={() => excluir(funcionario)}>Excluir funcionário</button></div>
        </article>)}
          {!funcionarios.length && <p className="vazio">Nenhum funcionário cadastrado.</p>}</div>
      </section>
      <section className="painel-conteudo painel-fixo"><h2>Novo funcionário</h2><p className="suave">O funcionário receberá uma senha temporária e deverá trocá-la no primeiro acesso.</p>
        <form className="formulario-compacto" onSubmit={criar}>
          <div className="grade-formulario"><CampoFlutuante label="Nome"><input name="nome" placeholder=" " required /></CampoFlutuante><CampoFlutuante label="Sobrenome"><input name="sobrenome" placeholder=" " required /></CampoFlutuante></div>
          <CampoFlutuante label="CPF: 000.000.000-00"><input name="cpf" inputMode="numeric" maxLength={14} placeholder=" " onInput={evento => { evento.currentTarget.value = mascararCpf(evento.currentTarget.value) }} required /></CampoFlutuante>
          <CampoFlutuante label="Telefone: (11) 99999-9999"><input name="telefone" inputMode="tel" maxLength={15} placeholder=" " onInput={evento => { evento.currentTarget.value = mascararTelefone(evento.currentTarget.value) }} required /></CampoFlutuante>
          <CampoFlutuante label="E-mail: funcionario@mercado.com.br"><input name="email" type="email" placeholder=" " required /></CampoFlutuante>
          <CampoFlutuante label="Data de nascimento (opcional)"><input name="dataNascimento" type="date" max={dataMaximaNascimento()} placeholder=" " onInvalid={evento => evento.currentTarget.setCustomValidity('O usuário deve ter pelo menos 18 anos')} onInput={evento => evento.currentTarget.setCustomValidity('')} /></CampoFlutuante>
          <button>Criar acesso do funcionário</button>
        </form>
      </section>
    </div>
  </section>
}
