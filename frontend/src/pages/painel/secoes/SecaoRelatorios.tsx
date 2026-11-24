import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CampoFlutuante } from '../../../components/CampoFlutuante'
import type { Assinatura, Comercio } from '../../../types'
import { ROTULOS_STATUS_DIVIDA } from '../constantes'
import { dataAtual } from '../formatadores'

interface PropriedadesSecaoRelatorios {
  comercios: Comercio[]
  assinatura: Assinatura | null
  administrador: boolean
  gerar: (event: FormEvent<HTMLFormElement>) => void
  gerando: boolean
  urlPdf: string | null
  limpar: () => void
  conhecerPlano: () => void
}

export function SecaoRelatorios({ comercios, assinatura, administrador, gerar, gerando, urlPdf, limpar, conhecerPlano }: PropriedadesSecaoRelatorios) {
  const [guia, setGuia] = useState<'gerar' | 'visualizar'>(urlPdf ? 'visualizar' : 'gerar')
  const formulario = useRef<HTMLFormElement>(null)
  const quadro = useRef<HTMLIFrameElement>(null)
  const podeGerar = administrador || Boolean(assinatura?.podeGerarRelatorio)

  useEffect(() => {
    if (urlPdf) setGuia('visualizar')
  }, [urlPdf])

  function cancelar() {
    formulario.current?.reset()
    limpar()
    setGuia('gerar')
  }

  function imprimir() {
    quadro.current?.contentWindow?.print()
  }

  return <section className="visualizacao-secao animar-entrada">
    <div className="titulo-secao"><div><p className="sobretitulo">Relatórios</p><h2>Inadimplências</h2></div><p>Defina os filtros, confira o documento e imprima somente quando necessário.</p></div>
    {!podeGerar && <section className="painel-conteudo relatorio-bloqueado"><span>🔒</span><div><h2>Relatórios disponíveis no seu plano</h2><p>Escolha um plano com relatórios para gerar e visualizar documentos em PDF.</p></div><button onClick={conhecerPlano}>Conhecer planos</button></section>}
    {podeGerar && <>
      <div className="guias-relatorio" role="tablist" aria-label="Etapas do relatório">
        <button type="button" role="tab" aria-selected={guia === 'gerar'} className={guia === 'gerar' ? 'ativo' : ''} onClick={() => setGuia('gerar')}>1. Gerar</button>
        <button type="button" role="tab" aria-selected={guia === 'visualizar'} className={guia === 'visualizar' ? 'ativo' : ''} disabled={!urlPdf} onClick={() => setGuia('visualizar')}>2. Visualizar</button>
      </div>
      {guia === 'gerar' && <section className="painel-conteudo"><form ref={formulario} className="filtros-relatorio" onSubmit={gerar}>
        <CampoFlutuante label="Data inicial da dívida"><input name="dataInicio" type="date" min="2000-01-01" max={dataAtual()} placeholder=" " required /></CampoFlutuante>
        <CampoFlutuante label="Data final da dívida"><input name="dataFim" type="date" min="2000-01-01" max={dataAtual()} placeholder=" " required /></CampoFlutuante>
        <CampoFlutuante label="Comércio"><select name="idComercio" defaultValue=""><option value="">Todos os comércios da rede</option>{comercios.filter(comercio => administrador || comercio.status === 'APPROVED').map(comercio => <option key={comercio.id} value={comercio.id}>{comercio.nomeComercio}</option>)}</select></CampoFlutuante>
        <CampoFlutuante label="Situação"><select name="status" defaultValue=""><option value="">Todas</option>{Object.entries(ROTULOS_STATUS_DIVIDA).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></CampoFlutuante>
        <div className="acoes-formulario"><button disabled={gerando}>{gerando ? 'Gerando…' : 'Gerar relatório'}</button><button type="button" className="botao-secundario" onClick={cancelar}>Cancelar</button></div>
      </form></section>}
      {guia === 'visualizar' && urlPdf && <section className="painel-conteudo visualizador-relatorio"><div className="cabecalho-painel-conteudo"><div><h2>Pré-visualização</h2><p>Confira o relatório antes de imprimir.</p></div><div className="acoes-formulario"><button type="button" onClick={imprimir}>Imprimir</button><button type="button" className="botao-secundario" onClick={() => setGuia('gerar')}>Alterar filtros</button></div></div><iframe ref={quadro} src={urlPdf} title="Pré-visualização do relatório de inadimplências" /></section>}
    </>}
  </section>
}
