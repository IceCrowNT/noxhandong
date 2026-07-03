const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

export function feePeriodFromDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  })
    .format(date)
    .split("-");

  const year = Number(parts[0]);
  const month = Number(parts[1]);

  return {
    month,
    year,
    label: `T${month}-${year}`,
    historyLabel: `T${month}-${year}+`,
  };
}

export function parseFeePeriodLabel(value: string) {
  const match = value.match(/T\s*(\d{1,2})\s*[-/]\s*(\d{4})/i);
  if (!match) return null;

  const month = Number(match[1]);
  const year = Number(match[2]);
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
    return null;
  }

  return {
    month,
    year,
    label: `T${month}-${year}`,
    historyLabel: `T${month}-${year}+`,
  };
}
