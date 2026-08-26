import { useEffect, useState } from 'react'
import type { PlanoComercial } from '../types'

interface PropriedadesCarrosselPlanos {
  planos: PlanoComercial[]
  codigoAtual?: string
  codigoPendente?: string
  compacto?: boolean
  escolherPlano?: (codigo: string) => void
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

export function CarrosselPlanos({
  planos,
  codigoAtual,
  codigoPendente,
  compacto = false,
  escolherPlano
}: PropriedadesCarrosselPlanos) {
  const indiceInicial = Math.max(
    0,
    planos.findIndex(plano => plano.codigo === codigoAtual)
  )
  const [indice, setIndice] = useState(indiceInicial)

  useEffect(() => {
    setIndice(Math.max(
      0,
      planos.findIndex(plano => plano.codigo === codigoAtual)
    ))
  }, [codigoAtual, planos])

  if (!planos.length) {
    return null
  }

  const plano = planos[indice]
  const atual = plano.codigo === codigoAtual
  const pendente = plano.codigo === codigoPendente

  function mover(direcao: number) {
    setIndice((indice + direcao + planos.length) % planos.length)
  }

  return <div
    className={'carrossel-planos ' + (compacto ? 'compacto' : '')}
    aria-label="Planos CredUp"
  >
    <button
      className="controle-carrossel anterior"
      type="button"
      onClick={() => mover(-1)}
      aria-label="Plano anterior"
    >‹</button>
    <article
      className={'cartao-plano ' + (atual ? 'atual' : '')}
      key={plano.codigo}
    >
      <div>
        <small>{atual ? 'PLANO ATUAL' : 'PLANO CREDUP'}</small>
        <h3>{plano.nome}</h3>
        <strong>
          {formatarMoeda(plano.valorMensal)}
          <span>/mês</span>
        </strong>
      </div>
      <ul>
        <li>Até {plano.limiteOperadores} operadores ativos</li>
        <li>{plano.mesesHistorico === 0
          ? 'Histórico completo'
          : plano.mesesHistorico + ' meses de histórico'}</li>
        <li>{plano.relatoriosCompletos
          ? 'Relatórios completos em PDF'
          : 'Consulta e indicadores essenciais'}</li>
        {plano.centralCobranca && <li>Central de cobrança</li>}
        {plano.indicadoresAvancados && <li>Indicadores avançados</li>}
        {plano.importacaoExportacao && <li>Importação e exportação</li>}
      </ul>
      {escolherPlano && <button
        type="button"
        disabled={atual || pendente}
        onClick={() => escolherPlano(plano.codigo)}
      >
        {atual
          ? 'Plano atual'
          : pendente
            ? 'Aguardando pagamento'
            : 'Escolher ' + plano.nome}
      </button>}
    </article>
    <button
      className="controle-carrossel proximo"
      type="button"
      onClick={() => mover(1)}
      aria-label="Próximo plano"
    >›</button>
    <div
      className="indicadores-carrossel"
      aria-label={'Plano ' + (indice + 1) + ' de ' + planos.length}
    >
      {planos.map((item, posicao) => <button
        type="button"
        key={item.codigo}
        className={posicao === indice ? 'ativo' : ''}
        onClick={() => setIndice(posicao)}
        aria-label={'Ver plano ' + item.nome}
      />)}
    </div>
  </div>
}
