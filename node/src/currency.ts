const { locale } = Intl.DateTimeFormat().resolvedOptions();

export function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

export function formatAccounting(value: number, currency = 'USD') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currencySign: 'accounting',
    currency,
  }).format(value);
}
