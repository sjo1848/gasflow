function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayIsoDate(): string {
  return toIsoDate(new Date());
}

export function tomorrowIsoDate(): string {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return toIsoDate(next);
}
