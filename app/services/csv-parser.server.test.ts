import { describe, it, expect } from "vitest";
import { parseMatrixCSV } from "./csv-parser.server";

describe("parseMatrixCSV", () => {
  it("parses valid 3x3 CSV correctly", async () => {
    const csv = `100,200,10.00
100,300,15.00
100,400,20.00
200,200,25.00
200,300,30.00
200,400,35.00
300,200,40.00
300,300,45.00
300,400,50.00`;

    const result = await parseMatrixCSV(csv);

    expect(result.success).toBe(true);
    expect(result.widths).toEqual([100, 200, 300]);
    expect(result.heights).toEqual([200, 300, 400]);
    expect(result.totalRows).toBe(9);
    expect(result.validRows).toBe(9);
    expect(result.errors).toEqual([]);
    expect(result.cells.size).toBe(9);
    expect(result.cells.get("0,0")).toBe(10);
    expect(result.cells.get("1,1")).toBe(30);
    expect(result.cells.get("2,2")).toBe(50);
  });

  it("skips header row with column names", async () => {
    const csv = `width,height,price
100,200,10.00
200,300,20.00`;

    const result = await parseMatrixCSV(csv);

    expect(result.success).toBe(true);
    expect(result.widths).toEqual([100, 200]);
    expect(result.heights).toEqual([200, 300]);
    expect(result.totalRows).toBe(2);
    expect(result.validRows).toBe(2);
    expect(result.cells.size).toBe(2);
  });

  it("returns error for empty CSV", async () => {
    const csv = "";

    const result = await parseMatrixCSV(csv);

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("empty");
  });

  it("returns error for CSV with only headers", async () => {
    const csv = "width,height,price";

    const result = await parseMatrixCSV(csv);

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("empty");
  });

  it("rejects CSV files over 1MB", async () => {
    const largeRow = "100,200,10.00\n";
    const csv = largeRow.repeat(100000); // Over 1MB

    const result = await parseMatrixCSV(csv);

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("1MB");
  });

  it("collects errors for non-numeric width", async () => {
    const csv = `100,200,10.00
abc,300,20.00
200,400,30.00`;

    const result = await parseMatrixCSV(csv);

    expect(result.success).toBe(true);
    expect(result.validRows).toBe(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].line).toBe(2);
    expect(result.errors[0].message).toContain("width");
    expect(result.errors[0].message).toContain("positive number");
  });

  it("collects errors for negative height", async () => {
    const csv = `100,200,10.00
200,-300,20.00
300,400,30.00`;

    const result = await parseMatrixCSV(csv);

    expect(result.success).toBe(true);
    expect(result.validRows).toBe(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].line).toBe(2);
    expect(result.errors[0].message).toContain("height");
    expect(result.errors[0].message).toContain("positive number");
  });

  it("collects errors for negative price", async () => {
    const csv = `100,200,10.00
200,300,-20.00
300,400,30.00`;

    const result = await parseMatrixCSV(csv);

    expect(result.success).toBe(true);
    expect(result.validRows).toBe(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].line).toBe(2);
    expect(result.errors[0].message).toContain("price");
    expect(result.errors[0].message).toContain("non-negative");
  });

  it("collects errors for missing columns", async () => {
    const csv = `100,200,10.00
200,300
300,400,30.00`;

    const result = await parseMatrixCSV(csv);

    expect(result.success).toBe(true);
    expect(result.validRows).toBe(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].line).toBe(2);
    expect(result.errors[0].message).toContain("3 columns");
  });

  it("handles duplicate width/height pairs with last value wins", async () => {
    const csv = `100,200,10.00
100,200,99.99`;

    const result = await parseMatrixCSV(csv);

    expect(result.success).toBe(true);
    expect(result.cells.size).toBe(1);
    expect(result.cells.get("0,0")).toBe(99.99);
  });

  it("sorts widths and heights numerically ascending", async () => {
    const csv = `300,400,30.00
100,200,10.00
200,300,20.00`;

    const result = await parseMatrixCSV(csv);

    expect(result.success).toBe(true);
    expect(result.widths).toEqual([100, 200, 300]);
    expect(result.heights).toEqual([200, 300, 400]);
  });

  it("handles mixed valid and invalid rows", async () => {
    const csv = `100,200,10.00
abc,300,20.00
200,400,30.00
300,-500,40.00
400,600,50.00`;

    const result = await parseMatrixCSV(csv);

    expect(result.success).toBe(true);
    expect(result.totalRows).toBe(5);
    expect(result.validRows).toBe(3);
    expect(result.errors).toHaveLength(2);
    expect(result.cells.size).toBe(3);
  });

  it("maps cells to correct position indices", async () => {
    const csv = `300,400,99.00
100,200,11.00
200,300,22.00`;

    const result = await parseMatrixCSV(csv);

    expect(result.success).toBe(true);
    // After sorting: widths=[100,200,300], heights=[200,300,400]
    // 100,200 -> 0,0 = 11
    // 200,300 -> 1,1 = 22
    // 300,400 -> 2,2 = 99
    expect(result.cells.get("0,0")).toBe(11);
    expect(result.cells.get("1,1")).toBe(22);
    expect(result.cells.get("2,2")).toBe(99);
  });
});
