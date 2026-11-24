import type { FormEvent } from 'react'
import { CampoFlutuante } from '../../../components/CampoFlutuante'
import type { Comercio } from '../../../types'
import { dataAtual, limitarAnoData, mascararCpf, mascararMoeda, mascararTelefone } from '../formatadores'

interface PropriedadesSecaoNovaDivida {
  comercios: Comercio[]
  cadastrar: (event: FormEvent<HTMLFormElement>) => void
  cancelar: () => void
}

export function SecaoNovaDivida({ comercios, cadastrar, cancelar }: PropriedadesSecaoNovaDivida) {
  const comerciosAprovados = comercios.filter(comercio => comercio.status === 'APPROVED')

  return <section className="visualizacao-secao animar-entrada">
    <div className="titulo-secao"><div><p className="sobretitulo">Cadastro</p><h2>Nova dívida</h2></div><p>Registre uma dívida para um comércio aprovado.</p></div>
    <section className="painel-conteudo painel-formulario">
      <form onSubmit={cadastrar} className="formulario-compacto formulario-divida">
        <CampoFlutuante label="Selecione o comércio"><select name="idComercio" defaultValue="" required><option value="" disabled></option>{comerciosAprovados.map(comercio => <option key={comercio.id} value={comercio.id}>{comercio.nomeComercio}</option>)}</select></CampoFlutuante>
        <div className="grade-formulario">
          <CampoFlutuante label="Nome completo"><input name="nome" placeholder=" " required /></CampoFlutuante>
          <CampoFlutuante label="Apelido"><input name="apelido" maxLength={120} placeholder=" " required /></CampoFlutuante>
          <CampoFlutuante label="CPF (opcional): 000.000.000-00"><input name="cpf" inputMode="numeric" maxLength={14} placeholder=" " onInput={event => { event.currentTarget.value = mascararCpf(event.currentTarget.value) }} /></CampoFlutuante>
          <CampoFlutuante label="Telefone: (11) 99999-9999"><input name="telefone" inputMode="tel" maxLength={15} placeholder=" " onInput={event => { event.currentTarget.value = mascararTelefone(event.currentTarget.value) }} /></CampoFlutuante>
        </div>
        <CampoFlutuante label="Endereço do cliente"><input name="residencia" placeholder=" " /></CampoFlutuante>
        <div className="grade-formulario">
          <CampoFlutuante label="Valor: R$ 0,00"><input name="valorDivida" type="text" inputMode="numeric" placeholder=" " onInput={event => { event.currentTarget.value = mascararMoeda(event.currentTarget.value) }} required /></CampoFlutuante>
          <CampoFlutuante label="Data da dívida"><input name="dataDivida" type="date" placeholder=" " min="2000-01-01" max={dataAtual()} onInput={event => limitarAnoData(event.currentTarget)} required /></CampoFlutuante>
        </div>
        <CampoFlutuante label="Descrição da dívida"><textarea name="descricao" placeholder=" " /></CampoFlutuante>
        <div className="acoes-formulario"><button type="submit">Cadastrar dívida</button><button type="button" className="botao-secundario" onClick={cancelar}>Cancelar</button></div>
      </form>
    </section>
  </section>
}
