const valuesRegExp = /(?:(?:"([^"]*(?:""[^"]*)*)")|([^",]+)),?|,/g;

/** Parse simple CSV data into rows and columns with padding trimmed. For better support use something like https://csv.js.org */
export function parseCSV(csv: string): string[][] {
  const lines = csv.split(/(?:\r\n|\n)+/).filter(line => line.length != 0);
  const rows = lines.map((line: string) => {
    const row = [];
    let matches;
    while ((matches = valuesRegExp.exec(line))) {
      let col = matches[1] || matches[2] || '';
      col = col.replace(/""/g, '"');
      row.push(col.trim());
    }
    return row;
  });
  return rows;
}
