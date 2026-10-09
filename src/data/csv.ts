export const escapeCsvField = (
  value: string | number | undefined | null,
): string => {
  const stringValue = String(value ?? "");
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values.map((value) => value.trim());
};

export const parseCsvContent = (content: string): string[][] => {
  if (!content.trim()) return [];

  return content
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => parseCsvLine(line));
};

export const serializeCsvRows = (rows: (string | number)[][]): string =>
  `${rows.map((row) => row.map(escapeCsvField).join(",")).join("\n")}\n`;
