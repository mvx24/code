const unescapeHTMLMap: Record<string, string> = {
  amp: '&',
  apos: "'",
  '#x27': "'",
  '#x2F': '/',
  '#39': "'",
  '#47': '/',
  lt: '<',
  gt: '>',
  nbsp: ' ',
  quot: '"',
  reg: '\u00AE',
  copy: '\u00A9',
  trade: '\u2122',
};

export function unescapeHTML(str: string): string {
  return str.replace(/&([^;]+);/g, (entity, entityCode) => {
    const match = entityCode.match(/\w+/);
    if (match) {
      const code = match[0];
      return (
        unescapeHTMLMap[code] ||
        String.fromCharCode(Number(code.charAt(0) === 'x' ? '0' + code : code))
      );
    }
    return entity;
  });
}

export function parseList(str: string): string[] {
  return str
    .replace('<ul>', '')
    .replace('</ul>', '')
    .split('</li>')
    .map((li) => li.replace('<li>', '').trim())
    .filter(Boolean);
}
