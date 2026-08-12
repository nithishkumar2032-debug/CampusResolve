export function formatTicketId(year: number, counter: number): string {
  return `CR-${year}-${String(counter).padStart(4, "0")}`;
}
