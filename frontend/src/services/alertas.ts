import Swal from 'sweetalert2'

export type TomAlerta = 'sucesso' | 'alerta' | 'erro' | 'informacao'

const configuracoes = {
  sucesso: { icon: 'success', tempo: 4_000 },
  informacao: { icon: 'info', tempo: 5_000 },
  alerta: { icon: 'warning', tempo: 7_000 },
  erro: { icon: 'error', tempo: 8_000 }
} as const

export function mostrarAlerta(
  texto: string,
  tom: TomAlerta = 'informacao'
): void {
  const configuracao = configuracoes[tom]

  void Swal.fire({
    toast: true,
    position: 'top-end',
    title: texto,
    icon: configuracao.icon,
    showConfirmButton: false,
    timer: configuracao.tempo,
    timerProgressBar: true,
    showCloseButton: true,
    didOpen: toast => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  })
}

export async function confirmarExclusao(
  titulo: string,
  texto: string
) {
  const resultado = await Swal.fire({
    title: titulo,
    text: texto,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#b42318',
    cancelButtonColor: '#667085',
    reverseButtons: true,
    focusCancel: true
  })

  return resultado.isConfirmed
}
