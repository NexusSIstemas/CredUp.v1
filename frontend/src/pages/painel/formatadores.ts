export const somenteDigitos = (valor: FormDataEntryValue | null) =>
  String(valor ?? '').replace(/\D/g, '')

export const mascararCpf = (valor: string) => valor.replace(/\D/g, '').slice(0, 11)
  .replace(/(\d{3})(\d)/, '$1.$2')
  .replace(/(\d{3})(\d)/, '$1.$2')
  .replace(/(\d{3})(\d{1,2})$/, '$1-$2')

export const mascararTelefone = (valor: string) => {
  const numero = valor.replace(/\D/g, '').slice(0, 11)
  return numero.length <= 10
    ? numero.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    : numero.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

export const mascararCnpj = (valor: string) => valor.replace(/\D/g, '').slice(0, 14)
  .replace(/(\d{2})(\d)/, '$1.$2')
  .replace(/(\d{3})(\d)/, '$1.$2')
  .replace(/(\d{3})(\d)/, '$1/$2')
  .replace(/(\d{4})(\d{1,2})$/, '$1-$2')

export const mascararCep = (valor: string) => valor.replace(/\D/g, '').slice(0, 8)
  .replace(/(\d{5})(\d)/, '$1-$2')

export const mascararMoeda = (valor: string) => {
  const numero = valor.replace(/\D/g, '')
  if (!numero) return ''
  return (Number(numero) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

export const obterValorMoeda = (valor: FormDataEntryValue | null) => {
  const numero = String(valor ?? '').replace(/\D/g, '')
  return numero ? Number(numero) / 100 : 0
}

export function limitarAnoData(input: HTMLInputElement) {
  const [ano, mes, dia] = input.value.split('-')
  if (ano.length <= 4) return
  input.value = [ano.slice(0, 4), mes, dia].filter(Boolean).join('-')
}

export function dataAtual() {
  const hoje = new Date()
  const deslocamento = hoje.getTimezoneOffset() * 60_000
  return new Date(hoje.getTime() - deslocamento).toISOString().slice(0, 10)
}

export function dataMaximaNascimento() {
  const data = new Date()
  data.setFullYear(data.getFullYear() - 18)
  const deslocamento = data.getTimezoneOffset() * 60_000
  return new Date(data.getTime() - deslocamento).toISOString().slice(0, 10)
}
