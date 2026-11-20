import type { FormEvent } from 'react'
import { CampoFlutuante } from '../../../components/CampoFlutuante'
import type { Assinatura, Comercio, Divida } from '../../../types'
import { CLASSES_STATUS_DIVIDA, ROTULOS_STATUS_DIVIDA } from '../constantes'
import { dataAtual, limitarAnoData, mascararCpf, mascararMoeda, mascararTelefone } from '../formatadores'

interface PropriedadesSecaoInadimplentes {
  dividas: Divida[]
  comercios: Comercio[]
  assinatura: Assinatura | null
  busca: string
  dadosVisiveis: boolean
  administrador: boolean
  gestor: boolean
  operador: boolean
  gerandoRelatorio: boolean
  alterarBusca: (busca: string) => void
  buscar: (event: FormEvent<HTMLFormElement>) => void
  cadastrar: (event: FormEvent<HTMLFormElement>) => void
  gerarRelatorio: (event: FormEvent<HTMLFormElement>) => void
  darBaixa: (id: string) => void
  conhecerPlano: () => void
}

export function SecaoInadimplentes({
  dividas, comercios, assinatura, busca, dadosVisiveis, administrador, gestor,
  operador, gerandoRelatorio, alterarBusca, buscar, cadastrar, gerarRelatorio,
  darBaixa, conhecerPlano
}: PropriedadesSecaoInadimplentes) {
  return <section className="visualizacao-secao animar-entrada">
    <div className="titulo-secao"><div><p className="sobretitulo">Rede compartilhada</p><h2>Inadimplentes</h2></div><p>Consulte registros e gerencie dívidas sem expor o CPF completo.</p></div>
    {!operador && (administrador || assinatura?.podeGerarRelatorio) && <section className="painel-conteudo">
      <div className="cabecalho-painel-conteudo"><div><h2>Relatório em PDF</h2><p>Escolha um dos seus comércios ou selecione “Todos” para incluir toda a rede.</p></div></div>
      <form className="filtros-relatorio" onSubmit={gerarRelatorio}>
        <CampoFlutuante label="Data inicial da dívida"><input name="dataInicio" type="date" min="2000-01-01" max={dataAtual()} placeholder=" " required /></CampoFlutuante>
        <CampoFlutuante label="Data final da dívida"><input name="dataFim" type="date" min="2000-01-01" max={dataAtual()} placeholder=" " required /></CampoFlutuante>
        <CampoFlutuante label="Comércio"><select name="idComercio" defaultValue=""><option value="">Todos os comércios da rede</option>{comercios.filter(comercio => administrador || comercio.status === 'APPROVED').map(comercio => <option key={comercio.id} value={comercio.id}>{comercio.nomeComercio}</option>)}</select></CampoFlutuante>
        <CampoFlutuante label="Situação"><select name="status" defaultValue=""><option value="">Todas</option>{Object.entries(ROTULOS_STATUS_DIVIDA).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></CampoFlutuante>
        <button disabled={gerandoRelatorio}>{gerandoRelatorio ? 'Gerando PDF…' : 'Gerar relatório PDF'}</button>
      </form>
    </section>}
    {gestor && assinatura && !assinatura.podeGerarRelatorio && <section className="painel-conteudo relatorio-bloqueado">
      <span>🔒</span><div><h2>Relatórios em PDF</h2><p>Disponível no plano profissional. Durante o teste, suas informações permanecem no sistema, mas a exportação fica bloqueada.</p></div>
      <button onClick={conhecerPlano}>Conhecer o plano</button>
    </section>}
    <section className="painel-conteudo">
      <div className="cabecalho-painel-conteudo"><div><h2>Consulta da rede</h2><p>CPF sempre protegido na listagem.</p></div>
        <form className="busca" onSubmit={buscar}><CampoFlutuante label="insira o nome, CPF, ou apelido"><input value={busca} maxLength={120} onChange={event => alterarBusca(event.target.value)} placeholder=" " /></CampoFlutuante><button>Buscar</button></form>
      </div>
      <div className="envoltorio-tabela"><table><thead><tr><th>Cliente</th><th>CPF</th><th>Comércio</th><th>Data da dívida</th><th>Data do cadastro</th><th>Valor</th><th>Status</th><th></th></tr></thead>
        <tbody>{dividas.map(divida => <tr key={divida.id}><td><strong className={!dadosVisiveis ? 'oculto' : ''}>{dadosVisiveis ? divida.cliente.nomeCompleto : 'Cliente protegido'}</strong>{dadosVisiveis && <small>Apelido: {divida.cliente.apelido}</small>}</td><td className={!dadosVisiveis ? 'oculto' : ''}>{dadosVisiveis ? divida.cliente.cpfMascarado ?? 'Não informado' : '***.***.***-**'}</td><td>{divida.nomeComercio}</td><td>{new Date(`${divida.dataDivida}T12:00:00`).toLocaleDateString('pt-BR')}</td><td>{new Date(divida.dataCadastro).toLocaleString('pt-BR')}</td><td className={!dadosVisiveis ? 'oculto' : ''}>{dadosVisiveis ? divida.valorDivida.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ •••••'}</td><td><span className={`indicador ${CLASSES_STATUS_DIVIDA[divida.status]}`}>{ROTULOS_STATUS_DIVIDA[divida.status]}</span></td><td>{divida.status !== 'PAID' && divida.podeDarBaixa && <button className="pequeno" onClick={() => darBaixa(divida.id)}>Dar baixa</button>}</td></tr>)}
          {!dividas.length && <tr><td colSpan={8} className="vazio">Nenhum registro encontrado.</td></tr>}</tbody></table></div>
    </section>
    {(gestor || operador) && <section className="painel-conteudo painel-formulario"><div className="cabecalho-painel-conteudo"><div><h2>Nova inadimplência</h2><p>Cadastre um cliente e sua dívida em um comércio aprovado.</p></div></div>
      <form onSubmit={cadastrar} className="formulario-compacto formulario-divida">
        <CampoFlutuante label="Selecione o comércio"><select name="idComercio" defaultValue="" required><option value="" disabled></option>{comercios.filter(comercio => comercio.status === 'APPROVED').map(comercio => <option key={comercio.id} value={comercio.id}>{comercio.nomeComercio}</option>)}</select></CampoFlutuante>
        <div className="grade-formulario">
          <CampoFlutuante label="Nome Completo"><input name="nome" placeholder=" " required /></CampoFlutuante>
          <CampoFlutuante label="Apelido"><input name="apelido" maxLength={120} placeholder=" " required /></CampoFlutuante>
          <CampoFlutuante label="CPF (opcional): 000.000.000-00"><input name="cpf" inputMode="numeric" maxLength={14} placeholder=" " onInput={event => { event.currentTarget.value = mascararCpf(event.currentTarget.value) }} /></CampoFlutuante>
          <CampoFlutuante label="Telefone: (11) 99999-9999"><input name="telefone" inputMode="tel" maxLength={15} placeholder=" " onInput={event => { event.currentTarget.value = mascararTelefone(event.currentTarget.value) }} /></CampoFlutuante>
        </div>
        <CampoFlutuante label="Endereço do cliente"><input name="residencia" placeholder=" " /></CampoFlutuante>
        <div className="grade-formulario">
          <CampoFlutuante label="Valor: R$ 0,00"><input name="valorDivida" type="text" inputMode="numeric" placeholder=" " onInput={event => { event.currentTarget.value = mascararMoeda(event.currentTarget.value) }} required /></CampoFlutuante>
          <CampoFlutuante label="Data da dívida"><input name="dataDivida" type="date" placeholder=" " min="2000-01-01" max={dataAtual()} onInput={event => limitarAnoData(event.currentTarget)} required /></CampoFlutuante>
        </div>
        <CampoFlutuante label="Descrição da dívida"><textarea name="descricao" placeholder=" " /></CampoFlutuante><button>Cadastrar dívida</button>
      </form>
    </section>}
  </section>
}
