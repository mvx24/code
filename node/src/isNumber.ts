export default function isNumber(value: any): value is number {
  if (typeof value === 'number' && !isNaN(value)) {
    return true;
  }
  return false;
}
