export function isValidCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function weekdayForDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function intervalsOverlap(
  start: number,
  end: number,
  otherStart: number,
  otherEnd: number
) {
  return start < otherEnd && otherStart < end;
}

export function lisbonDateTime(now: Date = new Date()) {
  const dateParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const timeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (
    parts: Intl.DateTimeFormatPart[],
    type: string
  ) => {
    const value = parts.find((item) => item.type === type)?.value;
    if (!value) throw new Error(`Missing ${type} in Lisbon date formatting.`);
    return value;
  };
  return {
    date: `${part(dateParts, "year")}-${part(dateParts, "month")}-${part(dateParts, "day")}`,
    minutes: Number(part(timeParts, "hour")) * 60 + Number(part(timeParts, "minute")),
  };
}
