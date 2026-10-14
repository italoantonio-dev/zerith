export function formatTimestamp(value: string | null | undefined) {
  if (!value) return "Sem registro";

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return "Data inválida";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(timestamp);
}
