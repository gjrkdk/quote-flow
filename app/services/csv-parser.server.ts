import { parse } from "csv-parse/sync";

export interface CSVParseResult {
  success: boolean;
  widths: number[];
  heights: number[];
  cells: Map<string, number>;
  errors: Array<{ line: number; message: string }>;
  totalRows: number;
  validRows: number;
}

const MAX_FILE_SIZE = 1048576; // 1MB in bytes

export async function parseMatrixCSV(
  csvContent: string
): Promise<CSVParseResult> {
  const errors: Array<{ line: number; message: string }> = [];

  // Check file size limit
  if (csvContent.length > MAX_FILE_SIZE) {
    return {
      success: false,
      widths: [],
      heights: [],
      cells: new Map(),
      errors: [{ line: 0, message: "CSV file must be under 1MB" }],
      totalRows: 0,
      validRows: 0,
    };
  }

  // Parse CSV
  let records: string[][];
  try {
    records = parse(csvContent, {
      columns: false,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
  } catch (error) {
    return {
      success: false,
      widths: [],
      heights: [],
      cells: new Map(),
      errors: [
        {
          line: 0,
          message: `CSV parsing error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      totalRows: 0,
      validRows: 0,
    };
  }

  // Check if CSV is empty
  if (records.length === 0) {
    return {
      success: false,
      widths: [],
      heights: [],
      cells: new Map(),
      errors: [
        { line: 0, message: "CSV file is empty or contains only headers" },
      ],
      totalRows: 0,
      validRows: 0,
    };
  }

  // Detect and skip header row
  let startIndex = 0;
  const firstRow = records[0];
  if (
    firstRow.some(
      (cell) =>
        cell.toLowerCase().includes("width") ||
        cell.toLowerCase().includes("height") ||
        cell.toLowerCase().includes("price")
    )
  ) {
    startIndex = 1;
  }

  // Check if only header exists
  if (startIndex >= records.length) {
    return {
      success: false,
      widths: [],
      heights: [],
      cells: new Map(),
      errors: [
        { line: 0, message: "CSV file is empty or contains only headers" },
      ],
      totalRows: 0,
      validRows: 0,
    };
  }

  // Process data rows
  const widthSet = new Set<number>();
  const heightSet = new Set<number>();
  const cellData = new Map<string, number>(); // Temporary map with "width,height" keys

  let validRows = 0;
  const totalRows = records.length - startIndex;

  for (let i = startIndex; i < records.length; i++) {
    const row = records[i];
    const lineNumber = i + 1; // 1-indexed line numbers

    // Validate column count
    if (row.length !== 3) {
      errors.push({
        line: lineNumber,
        message: `expected 3 columns, got ${row.length}`,
      });
      continue;
    }

    // Parse width
    const widthStr = row[0].trim();
    const width = Number(widthStr);
    if (isNaN(width) || width <= 0) {
      errors.push({
        line: lineNumber,
        message: "width must be a positive number",
      });
      continue;
    }

    // Parse height
    const heightStr = row[1].trim();
    const height = Number(heightStr);
    if (isNaN(height) || height <= 0) {
      errors.push({
        line: lineNumber,
        message: "height must be a positive number",
      });
      continue;
    }

    // Parse price
    const priceStr = row[2].trim();
    const price = Number(priceStr);
    if (isNaN(price) || price < 0) {
      errors.push({
        line: lineNumber,
        message: "price must be a non-negative number",
      });
      continue;
    }

    // Valid row - collect data
    widthSet.add(width);
    heightSet.add(height);
    cellData.set(`${width},${height}`, price); // Last value wins for duplicates
    validRows++;
  }

  // Sort unique widths and heights numerically
  const widths = Array.from(widthSet).sort((a, b) => a - b);
  const heights = Array.from(heightSet).sort((a, b) => a - b);

  // Build cell map with position indices
  const cells = new Map<string, number>();
  for (const [key, price] of cellData.entries()) {
    const [widthStr, heightStr] = key.split(",");
    const width = Number(widthStr);
    const height = Number(heightStr);

    const widthIdx = widths.indexOf(width);
    const heightIdx = heights.indexOf(height);

    if (widthIdx !== -1 && heightIdx !== -1) {
      cells.set(`${widthIdx},${heightIdx}`, price);
    }
  }

  // Determine success: true if we have at least some valid data
  const success = validRows > 0;

  return {
    success,
    widths,
    heights,
    cells,
    errors,
    totalRows,
    validRows,
  };
}
