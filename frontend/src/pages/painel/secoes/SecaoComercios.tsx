import type { FormEvent } from 'react'
import { CampoFlutuante } from '../../../components/CampoFlutuante'
import type { Comercio, StatusComercio } from '../../../types'
import { CLASSES_STATUS_COMERCIO, ROTULOS_STATUS_COMERCIO } from '../constantes'
import { mascararCep, mascararCnpj } from '../formatadores'

interface PropriedadesSecaoComercios {
  comercios: Comercio[]
  comercioEmEdicao: Comercio | null
  dadosVisiveis: boolean
  administrador: boolean
  gestor: boolean
  acessoOperacional: boolean
  solicitarCadastro: (event: FormEvent<HTMLFormElement>) => void
  salvarEdicao: (event: FormEvent<HTMLFormElement>) => void
  editar: (comercio: Comercio | null) => void
  excluir: (comercio: Comercio) => void
  avaliar: (id: string, status: StatusComercio) => void
}

export function SecaoComercios({
  comercios,
  comercioEmEdicao,
  dadosVisiveis,
  administrador,
  gestor,
  acessoOperacional,
  solicitarCadastro,
  salvarEdicao,
  editar,
  excluir,
  avaliar
}: PropriedadesSecaoComercios) {
  return <section className="visualizacao-secao animar-entrada">
    <div className="titulo-secao"><div><p className="sobretitulo">Estabelecimentos</p><h2>Comércios</h2></div><p>{administrador ? 'Analise e acompanhe todos os mercados da rede.' : 'Cadastre e acompanhe seus estabelecimentos.'}</p></div>
    <div className={administrador ? 'coluna-unica' : 'colunas-secao'}>
      <section className="painel-conteudo">
        <div className="cabecalho-painel-conteudo"><div><h2>{administrador ? 'Mercados cadastrados' : 'Meus comércios'}</h2><p>{comercios.length} estabelecimento(s)</p></div></div>
        <div className="grade-comercios">{comercios.map(comercio => <article className="cartao-mercado" key={comercio.id}>
          <div className="icone-mercado">{comercio.nomeComercio[0]}</div>
          <div className="informacoes-mercado"><strong>{comercio.nomeComercio}</strong><small className={!dadosVisiveis ? 'oculto' : ''}>{dadosVisiveis ? mascararCnpj(comercio.cnpj) : '**.***.***/****-**'}</small></div>
          <span className={`indicador ${CLASSES_STATUS_COMERCIO[comercio.status]}`}>{ROTULOS_STATUS_COMERCIO[comercio.status]}</span>
          {administrador && comercio.status === 'PENDING' && <div className="acoes-mercado"><button className="pequeno" onClick={() => avaliar(comercio.id, 'APPROVED')}>Aprovar</button><button className="pequeno perigo" onClick={() => avaliar(comercio.id, 'REJECTED')}>Reprovar</button></div>}
          {gestor && acessoOperacional && <div className="acoes-mercado"><button className="pequeno" onClick={() => editar(comercio)}>Editar dados</button><button className="pequeno perigo" onClick={() => excluir(comercio)}>Excluir</button></div>}
        </article>)}
          {!comercios.length && <p className="vazio">Nenhum comércio cadastrado.</p>}</div>
      </section>
      {gestor && acessoOperacional && comercioEmEdicao && <section className="painel-conteudo painel-fixo"><h2>Editar comércio</h2>
        <form onSubmit={salvarEdicao} className="formulario-compacto">
          <CampoFlutuante label="Nome do comércio"><input name="nomeComercio" defaultValue={comercioEmEdicao.nomeComercio} placeholder=" " required /></CampoFlutuante>
          <div className="grade-formulario">
            <CampoFlutuante label="Rua"><input name="rua" defaultValue={comercioEmEdicao.endereco.rua} placeholder=" " required /></CampoFlutuante>
            <CampoFlutuante label="Número"><input name="numberComercio" defaultValue={comercioEmEdicao.endereco.numberComercio} placeholder=" " required /></CampoFlutuante>
            <CampoFlutuante label="Cidade"><input name="cidade" defaultValue={comercioEmEdicao.endereco.cidade} placeholder=" " required /></CampoFlutuante>
            <CampoFlutuante label="CEP"><input name="cep" defaultValue={mascararCep(comercioEmEdicao.endereco.cep)} inputMode="numeric" maxLength={9} placeholder=" " onInput={event => { event.currentTarget.value = mascararCep(event.currentTarget.value) }} required /></CampoFlutuante>
          </div>
          <CampoFlutuante label="Ponto de referência"><input name="pontoReferencia" defaultValue={comercioEmEdicao.endereco.pontoReferencia ?? ''} placeholder=" " /></CampoFlutuante>
          <div className="acoes-formulario"><button>Salvar alterações</button><button type="button" className="fantasma" onClick={() => editar(null)}>Cancelar</button></div>
        </form>
      </section>}
      {gestor && <section className="painel-conteudo painel-fixo"><h2>Solicitar cadastro de comércio</h2><p className="suave">A solicitação será analisada pelo administrador. O comércio só entrará na rede depois da aprovação.</p>
        <form onSubmit={solicitarCadastro} className="formulario-compacto">
          <CampoFlutuante label="Nome do comércio"><input name="nomeComercio" placeholder=" " required /></CampoFlutuante>
          <CampoFlutuante label="CNPJ: 00.000.000/0000-00"><input name="cnpj" inputMode="numeric" maxLength={18} placeholder=" " onInput={event => { event.currentTarget.value = mascararCnpj(event.currentTarget.value) }} required /></CampoFlutuante>
          <div className="grade-formulario">
            <CampoFlutuante label="Rua"><input name="rua" placeholder=" " required /></CampoFlutuante>
            <CampoFlutuante label="Número"><input name="numberComercio" placeholder=" " required /></CampoFlutuante>
            <CampoFlutuante label="Cidade"><input name="cidade" placeholder=" " required /></CampoFlutuante>
            <CampoFlutuante label="CEP: 00000-000"><input name="cep" inputMode="numeric" maxLength={9} placeholder=" " onInput={event => { event.currentTarget.value = mascararCep(event.currentTarget.value) }} required /></CampoFlutuante>
          </div>
          <CampoFlutuante label="Ponto de referência"><input name="pontoReferencia" placeholder=" " /></CampoFlutuante>
          <button>Enviar solicitação</button>
        </form>
      </section>}
    </div>
  </section>
}
