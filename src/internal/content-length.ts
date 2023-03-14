export function parseContentLength(value: string | undefined) {
  if (value === undefined) {
    return null;
  }
  const length = Number.parseInt(value, 10);
  return Number.isNaN(length) ? null : length;
}
