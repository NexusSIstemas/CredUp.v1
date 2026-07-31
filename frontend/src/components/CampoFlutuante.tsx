import type { ReactNode } from 'react'

type PropriedadesCampoFlutuante = {
  label: string
  children: ReactNode
  className?: string
}

export function CampoFlutuante({
  label,
  children,
  className = ''
}: PropriedadesCampoFlutuante) {
  const classes = ['campo-flutuante', className]
    .filter(Boolean)
    .join(' ')

  return (
    <label className={classes}>
      {children}
      <span className="rotulo-flutuante">{label}</span>
    </label>
  )
}
