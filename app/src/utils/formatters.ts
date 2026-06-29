export function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function formatVolume(litros: number): string {
  return litros >= 1
    ? `${litros.toFixed(2)}L`
    : `${(litros * 1000).toFixed(0)}ml`;
}
