import type { FormEvent } from 'react'
import { CampoFlutuante } from '../../../components/CampoFlutuante'
import type { Divida } from '../../../types'
import { CLASSES_STATUS_DIVIDA, ROTULOS_STATUS_DIVIDA } from '../constantes'

interface PropriedadesSecaoInadimplentes {
  dividas: Divida[]
  busca: string
  dadosVisiveis: boolean
  gestor: boolean
  operador: boolean
  alterarBusca: (busca: string) => void
  buscar: (event: FormEvent<HTMLFormElement>) => void
  darBaixa: (id: string) => void
  abrirCadastro: () => void
}

export function SecaoInadimplentes({
  dividas, busca, dadosVisiveis, gestor, operador, alterarBusca, buscar, darBaixa, abrirCadastro
}: PropriedadesSecaoInadimplentes) {
  return <section className="visualizacao-secao animar-entrada">
    <div className="titulo-secao"><div><p className="sobretitulo">Rede compartilhada</p><h2>Inadimplentes</h2></div><p>Consulte registros e gerencie dívidas sem expor o CPF completo.</p></div>
    <section className="painel-conteudo">
      <div className="cabecalho-painel-conteudo"><div><h2>Consulta da rede</h2><p>CPF sempre protegido na listagem.</p></div>
        <form className="busca" onSubmit={buscar}><CampoFlutuante label="Insira o nome, CPF ou apelido"><input value={busca} maxLength={120} onChange={event => alterarBusca(event.target.value)} placeholder=" " /></CampoFlutuante><button>Buscar</button>{(gestor || operador) && <button type="button" className="botao-secundario" onClick={abrirCadastro}>Cadastrar nova dívida</button>}</form>
      </div>
      <p className="ajuda-tabela">Role para baixo para ver mais registros ou para o lado quando necessário.</p>
      <div className="envoltorio-tabela tabela-inadimplentes" tabIndex={0} role="region" aria-labelledby="titulo-tabela-inadimplentes">
        <table>
          <caption id="titulo-tabela-inadimplentes">Registros de inadimplência encontrados na rede</caption>
          <thead><tr><th scope="col">Cliente</th><th scope="col">CPF</th><th scope="col">Comércio</th><th scope="col">Datas</th><th scope="col">Valor</th><th scope="col">Situação</th></tr></thead>
          <tbody>{dividas.map(divida => <tr key={divida.id} className={`linha-divida ${CLASSES_STATUS_DIVIDA[divida.status]}`}>
            <th scope="row"><strong className={!dadosVisiveis ? 'oculto' : ''}>{dadosVisiveis ? divida.cliente.nomeCompleto : 'Cliente protegido'}</strong>{dadosVisiveis && <small>Apelido: {divida.cliente.apelido}</small>}</th>
            <td className={!dadosVisiveis ? 'oculto' : ''}>{dadosVisiveis ? divida.cliente.cpfMascarado ?? 'Não informado' : '***.***.***-**'}</td>
            <td>{divida.nomeComercio}</td>
            <td className="datas-divida"><span><small>Dívida</small>{new Date(`${divida.dataDivida}T12:00:00`).toLocaleDateString('pt-BR')}</span><span><small>Cadastro</small>{new Date(divida.dataCadastro).toLocaleString('pt-BR')}</span></td>
            <td className={!dadosVisiveis ? 'oculto' : ''}><strong>{dadosVisiveis ? divida.valorDivida.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ •••••'}</strong></td>
            <td><div className="situacao-divida"><span className={`indicador ${CLASSES_STATUS_DIVIDA[divida.status]}`}>{ROTULOS_STATUS_DIVIDA[divida.status]}</span>{divida.status !== 'PAID' && divida.podeDarBaixa && <button className="pequeno" onClick={() => darBaixa(divida.id)}>Dar baixa</button>}</div></td>
          </tr>)}
            {!dividas.length && <tr><td colSpan={6} className="vazio">Nenhum registro encontrado.</td></tr>}</tbody>
        </table>
      </div>
    </section>
  </section>
}
