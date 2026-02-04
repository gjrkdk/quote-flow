import React from "react";

interface MatrixGridProps {
  widthBreakpoints: number[];
  heightBreakpoints: number[];
  cells: Map<string, number>;
  unit: string;
  onCellChange: (col: number, row: number, value: number | null) => void;
  onAddWidthBreakpoint: (value: number) => void;
  onAddHeightBreakpoint: (value: number) => void;
  onRemoveWidthBreakpoint: (index: number) => void;
  onRemoveHeightBreakpoint: (index: number) => void;
  emptyCells: Set<string>;
}

export const MatrixGrid = React.memo(function MatrixGrid({
  widthBreakpoints,
  heightBreakpoints,
  cells,
  unit,
  onCellChange,
  onAddWidthBreakpoint,
  onAddHeightBreakpoint,
  onRemoveWidthBreakpoint,
  onRemoveHeightBreakpoint,
  emptyCells,
}: MatrixGridProps) {
  const handleAddWidthBreakpoint = () => {
    const value = prompt("Enter width breakpoint value:");
    if (value === null) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      alert("Please enter a positive number");
      return;
    }

    onAddWidthBreakpoint(numValue);
  };

  const handleAddHeightBreakpoint = () => {
    const value = prompt("Enter height breakpoint value:");
    if (value === null) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      alert("Please enter a positive number");
      return;
    }

    onAddHeightBreakpoint(numValue);
  };

  const handleCellChange = (col: number, row: number, value: string) => {
    if (value === "") {
      onCellChange(col, row, null);
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      onCellChange(col, row, null);
      return;
    }

    onCellChange(col, row, numValue);
  };

  const getCellKey = (col: number, row: number) => `${col},${row}`;

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                border: "1px solid #e1e3e5",
                padding: "4px 8px",
                background: "#f6f6f7",
                fontWeight: 600,
              }}
            >
              {/* Empty corner cell */}
            </th>
            {widthBreakpoints.map((bp, index) => (
              <th
                key={index}
                style={{
                  border: "1px solid #e1e3e5",
                  padding: "4px 8px",
                  background: "#f6f6f7",
                  fontWeight: 600,
                  textAlign: "right",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <span>
                    {bp} {unit}
                  </span>
                  {widthBreakpoints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveWidthBreakpoint(index)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#bf0711",
                        fontSize: "14px",
                        padding: "0 4px",
                      }}
                      title="Remove column"
                    >
                      ×
                    </button>
                  )}
                </div>
              </th>
            ))}
            {widthBreakpoints.length < 50 && (
              <th
                style={{
                  border: "1px solid #e1e3e5",
                  padding: "4px 8px",
                  background: "#f6f6f7",
                }}
              >
                <button
                  type="button"
                  onClick={handleAddWidthBreakpoint}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#2c6ecb",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                  title="Add width breakpoint"
                >
                  +
                </button>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {heightBreakpoints.map((heightBp, rowIndex) => (
            <tr key={rowIndex}>
              <th
                style={{
                  border: "1px solid #e1e3e5",
                  padding: "4px 8px",
                  background: "#f6f6f7",
                  fontWeight: 600,
                  textAlign: "right",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <span>
                    {heightBp} {unit}
                  </span>
                  {heightBreakpoints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveHeightBreakpoint(rowIndex)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#bf0711",
                        fontSize: "14px",
                        padding: "0 4px",
                      }}
                      title="Remove row"
                    >
                      ×
                    </button>
                  )}
                </div>
              </th>
              {widthBreakpoints.map((widthBp, colIndex) => {
                const cellKey = getCellKey(colIndex, rowIndex);
                const cellValue = cells.get(cellKey);
                const isEmpty = emptyCells.has(cellKey);

                return (
                  <td
                    key={colIndex}
                    style={{
                      border: "1px solid #e1e3e5",
                      padding: "4px 8px",
                      textAlign: "right",
                      background: isEmpty ? "#fff4f4" : "transparent",
                    }}
                  >
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cellValue ?? ""}
                      onChange={(e) =>
                        handleCellChange(colIndex, rowIndex, e.target.value)
                      }
                      style={{
                        width: "80px",
                        textAlign: "right",
                        border: "none",
                        background: "transparent",
                        fontSize: "14px",
                      }}
                      onFocus={(e) => {
                        e.target.style.outline = "2px solid #2c6ecb";
                        e.target.style.borderRadius = "2px";
                      }}
                      onBlur={(e) => {
                        e.target.style.outline = "none";
                      }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
          {heightBreakpoints.length < 50 && (
            <tr>
              <td
                colSpan={widthBreakpoints.length + 1}
                style={{
                  border: "1px solid #e1e3e5",
                  padding: "4px 8px",
                  textAlign: "center",
                  background: "#f6f6f7",
                }}
              >
                <button
                  type="button"
                  onClick={handleAddHeightBreakpoint}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#2c6ecb",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                  title="Add height breakpoint"
                >
                  +
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});
