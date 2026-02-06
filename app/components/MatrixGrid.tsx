import React, { useState, useEffect, useRef } from "react";

interface MatrixGridProps {
  widthBreakpoints: number[];
  heightBreakpoints: number[];
  cells: Map<string, number>;
  unit: string;
  onCellChange: (col: number, row: number, value: number | null) => void;
  onAddWidthBreakpoint: () => void;
  onAddHeightBreakpoint: () => void;
  onRemoveWidthBreakpoint: (index: number) => void;
  onRemoveHeightBreakpoint: (index: number) => void;
  onWidthBreakpointChange: (index: number, value: number) => void;
  onHeightBreakpointChange: (index: number, value: number) => void;
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
  onWidthBreakpointChange,
  onHeightBreakpointChange,
  emptyCells,
}: MatrixGridProps) {
  // Roving tabindex state for keyboard navigation
  const [focusedRow, setFocusedRow] = useState(0);
  const [focusedCol, setFocusedCol] = useState(0);
  const cellRefs = useRef<Map<string, HTMLTableCellElement>>(new Map());

  // Clamp focus coordinates when grid changes
  useEffect(() => {
    const maxRow = heightBreakpoints.length - 1;
    const maxCol = widthBreakpoints.length - 1;

    if (focusedRow > maxRow) setFocusedRow(Math.max(0, maxRow));
    if (focusedCol > maxCol) setFocusedCol(Math.max(0, maxCol));
  }, [widthBreakpoints.length, heightBreakpoints.length, focusedRow, focusedCol]);

  // Focus the active cell when coordinates change
  useEffect(() => {
    const key = `${focusedCol},${focusedRow}`;
    const cell = cellRefs.current.get(key);
    if (cell) {
      cell.focus();
    }
  }, [focusedRow, focusedCol]);
  // Track which breakpoint header was just added so we can auto-focus it
  const [newWidthIndex, setNewWidthIndex] = useState<number | null>(null);
  const [newHeightIndex, setNewHeightIndex] = useState<number | null>(null);
  const widthHeaderRefs = useRef<Map<number, HTMLInputElement>>(new Map());
  const heightHeaderRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  // Auto-focus newly added breakpoint header
  useEffect(() => {
    if (newWidthIndex !== null) {
      const input = widthHeaderRefs.current.get(newWidthIndex);
      if (input) {
        input.focus();
        input.select();
      }
      setNewWidthIndex(null);
    }
  }, [newWidthIndex]);

  useEffect(() => {
    if (newHeightIndex !== null) {
      const input = heightHeaderRefs.current.get(newHeightIndex);
      if (input) {
        input.focus();
        input.select();
      }
      setNewHeightIndex(null);
    }
  }, [newHeightIndex]);

  const handleAddWidthBreakpoint = () => {
    setNewWidthIndex(widthBreakpoints.length);
    onAddWidthBreakpoint();
  };

  const handleAddHeightBreakpoint = () => {
    setNewHeightIndex(heightBreakpoints.length);
    onAddHeightBreakpoint();
  };

  const handleWidthHeaderChange = (index: number, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onWidthBreakpointChange(index, numValue);
    }
  };

  const handleHeightHeaderChange = (index: number, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onHeightBreakpointChange(index, numValue);
    }
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

  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLTableCellElement>,
    col: number,
    row: number
  ) => {
    const maxRow = heightBreakpoints.length - 1;
    const maxCol = widthBreakpoints.length - 1;

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        if (col < maxCol) {
          setFocusedCol(col + 1);
          setFocusedRow(row);
        }
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (col > 0) {
          setFocusedCol(col - 1);
          setFocusedRow(row);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (row < maxRow) {
          setFocusedRow(row + 1);
          setFocusedCol(col);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (row > 0) {
          setFocusedRow(row - 1);
          setFocusedCol(col);
        }
        break;
      case "Enter":
        e.preventDefault();
        const input = e.currentTarget.querySelector("input");
        if (input) input.focus();
        break;
      case "Escape":
        e.preventDefault();
        const activeInput = document.activeElement as HTMLInputElement;
        if (activeInput && activeInput.tagName === "INPUT") {
          activeInput.blur();
          e.currentTarget.focus();
        }
        break;
      case "Tab":
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Tab: move to previous cell
          if (col > 0) {
            setFocusedCol(col - 1);
            setFocusedRow(row);
          } else if (row > 0) {
            // Wrap to last cell of previous row
            setFocusedCol(maxCol);
            setFocusedRow(row - 1);
          } else {
            // First cell: allow default Tab to exit grid
            return;
          }
        } else {
          // Tab: move to next cell
          if (col < maxCol) {
            setFocusedCol(col + 1);
            setFocusedRow(row);
          } else if (row < maxRow) {
            // Wrap to first cell of next row
            setFocusedCol(0);
            setFocusedRow(row + 1);
          } else {
            // Last cell: allow default Tab to exit grid
            return;
          }
        }
        break;
      case "Home":
        e.preventDefault();
        setFocusedCol(0);
        setFocusedRow(row);
        break;
      case "End":
        e.preventDefault();
        setFocusedCol(maxCol);
        setFocusedRow(row);
        break;
    }
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        role="grid"
        aria-label="Price matrix editor"
        style={{
          borderCollapse: "collapse",
          width: "100%",
        }}
      >
        <thead>
          <tr role="row">
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
                role="columnheader"
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
                    gap: "4px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "2px", flex: 1 }}>
                    <input
                      ref={(el) => {
                        if (el) {
                          widthHeaderRefs.current.set(index, el);
                        } else {
                          widthHeaderRefs.current.delete(index);
                        }
                      }}
                      type="number"
                      step="any"
                      min="0"
                      value={bp || ""}
                      onChange={(e) => handleWidthHeaderChange(index, e.target.value)}
                      aria-label={`Width breakpoint ${index + 1}`}
                      placeholder="0"
                      style={{
                        width: "60px",
                        textAlign: "right",
                        border: "1px solid transparent",
                        borderRadius: "4px",
                        background: "transparent",
                        fontSize: "14px",
                        fontWeight: 600,
                        padding: "2px 4px",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#2c6ecb";
                        e.currentTarget.style.background = "#fff";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "transparent";
                        e.currentTarget.style.background = "transparent";
                      }}
                    />
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>{unit}</span>
                  </div>
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
            <tr key={rowIndex} role="row">
              <th
                role="rowheader"
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
                    gap: "4px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "2px", flex: 1 }}>
                    <input
                      ref={(el) => {
                        if (el) {
                          heightHeaderRefs.current.set(rowIndex, el);
                        } else {
                          heightHeaderRefs.current.delete(rowIndex);
                        }
                      }}
                      type="number"
                      step="any"
                      min="0"
                      value={heightBp || ""}
                      onChange={(e) => handleHeightHeaderChange(rowIndex, e.target.value)}
                      aria-label={`Height breakpoint ${rowIndex + 1}`}
                      placeholder="0"
                      style={{
                        width: "60px",
                        textAlign: "right",
                        border: "1px solid transparent",
                        borderRadius: "4px",
                        background: "transparent",
                        fontSize: "14px",
                        fontWeight: 600,
                        padding: "2px 4px",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#2c6ecb";
                        e.currentTarget.style.background = "#fff";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "transparent";
                        e.currentTarget.style.background = "transparent";
                      }}
                    />
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>{unit}</span>
                  </div>
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
                const isFocused = focusedRow === rowIndex && focusedCol === colIndex;

                return (
                  <td
                    key={colIndex}
                    role="gridcell"
                    tabIndex={isFocused ? 0 : -1}
                    ref={(el) => {
                      if (el) {
                        cellRefs.current.set(cellKey, el);
                      } else {
                        cellRefs.current.delete(cellKey);
                      }
                    }}
                    onKeyDown={(e) => handleCellKeyDown(e, colIndex, rowIndex)}
                    style={{
                      border: "1px solid #e1e3e5",
                      padding: "4px 8px",
                      textAlign: "right",
                      background: isEmpty ? "#fff4f4" : "transparent",
                      outline: isFocused ? "2px solid #2c6ecb" : "none",
                      outlineOffset: "-2px",
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
                      aria-label={`Price for ${widthBp} ${unit} width by ${heightBp} ${unit} height`}
                      tabIndex={-1}
                      style={{
                        width: "80px",
                        textAlign: "right",
                        border: "none",
                        background: "transparent",
                        fontSize: "14px",
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
