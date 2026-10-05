const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBRL(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "—";
  return brl.format(num);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Sem "casas", mantém a exibição enxuta (máx. 1 casa, sem zeros à esquerda).
// Com "casas", fixa exatamente essa quantidade de casas decimais.
export function formatPercent(
  value: number | string | null | undefined,
  casas?: number,
): string {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "—";
  const opcoes =
    casas === undefined
      ? { maximumFractionDigits: 1 }
      : { minimumFractionDigits: casas, maximumFractionDigits: casas };
  return `${num.toLocaleString("pt-BR", opcoes)}%`;
}