import { describe, it, expect } from "vitest";
import {
  calculatePrice,
  validateDimensions,
  type MatrixData,
} from "./price-calculator.server";

describe("validateDimensions", () => {
  it("rejects zero width", () => {
    const result = validateDimensions(0, 200, 1);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Width and height must be positive numbers");
  });

  it("rejects negative width", () => {
    const result = validateDimensions(-100, 200, 1);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Width and height must be positive numbers");
  });

  it("rejects zero height", () => {
    const result = validateDimensions(300, 0, 1);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Width and height must be positive numbers");
  });

  it("rejects negative height", () => {
    const result = validateDimensions(300, -50, 1);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Width and height must be positive numbers");
  });

  it("rejects zero quantity", () => {
    const result = validateDimensions(300, 200, 0);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Quantity must be a positive integer");
  });

  it("rejects negative quantity", () => {
    const result = validateDimensions(300, 200, -5);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Quantity must be a positive integer");
  });

  it("rejects non-integer quantity", () => {
    const result = validateDimensions(300, 200, 2.5);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Quantity must be a positive integer");
  });

  it("accepts valid positive dimensions and integer quantity", () => {
    const result = validateDimensions(300, 200, 1);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts large valid dimensions and quantity", () => {
    const result = validateDimensions(1000, 800, 10);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe("calculatePrice", () => {
  // Test matrix with width breakpoints [300, 600, 900] and height breakpoints [200, 400, 600]
  // Position-based grid (3x3 matrix):
  //        | W:300(0) | W:600(1) | W:900(2) |
  // H:200(0)|   10.00  |   15.00  |   20.00  |
  // H:400(1)|   25.00  |   30.00  |   35.00  |
  // H:600(2)|   40.00  |   45.00  |   50.00  |

  const testMatrix: MatrixData = {
    widthBreakpoints: [
      { position: 0, value: 300 },
      { position: 1, value: 600 },
      { position: 2, value: 900 },
    ],
    heightBreakpoints: [
      { position: 0, value: 200 },
      { position: 1, value: 400 },
      { position: 2, value: 600 },
    ],
    cells: [
      // Row 0 (height position 0)
      { widthPosition: 0, heightPosition: 0, price: 10.0 },
      { widthPosition: 1, heightPosition: 0, price: 15.0 },
      { widthPosition: 2, heightPosition: 0, price: 20.0 },
      // Row 1 (height position 1)
      { widthPosition: 0, heightPosition: 1, price: 25.0 },
      { widthPosition: 1, heightPosition: 1, price: 30.0 },
      { widthPosition: 2, heightPosition: 1, price: 35.0 },
      // Row 2 (height position 2)
      { widthPosition: 0, heightPosition: 2, price: 40.0 },
      { widthPosition: 1, heightPosition: 2, price: 45.0 },
      { widthPosition: 2, heightPosition: 2, price: 50.0 },
    ],
  };

  describe("exact breakpoint matches", () => {
    it("returns price at (0,0) for exact match width=300, height=200", () => {
      const price = calculatePrice(300, 200, testMatrix);
      expect(price).toBe(10.0);
    });

    it("returns price at (1,1) for exact match width=600, height=400", () => {
      const price = calculatePrice(600, 400, testMatrix);
      expect(price).toBe(30.0);
    });

    it("returns price at (2,2) for exact match width=900, height=600", () => {
      const price = calculatePrice(900, 600, testMatrix);
      expect(price).toBe(50.0);
    });
  });

  describe("round up behavior (between breakpoints)", () => {
    it("rounds up width: 450 -> position 1 (600), height=200 -> position 0", () => {
      const price = calculatePrice(450, 200, testMatrix);
      expect(price).toBe(15.0); // widthPosition=1, heightPosition=0
    });

    it("rounds up height: width=300 -> position 0, height=350 -> position 1 (400)", () => {
      const price = calculatePrice(300, 350, testMatrix);
      expect(price).toBe(25.0); // widthPosition=0, heightPosition=1
    });

    it("rounds up both: width=450 -> position 1, height=350 -> position 1", () => {
      const price = calculatePrice(450, 350, testMatrix);
      expect(price).toBe(30.0); // widthPosition=1, heightPosition=1
    });

    it("rounds up to next breakpoint: width=301 -> position 1 (600)", () => {
      const price = calculatePrice(301, 200, testMatrix);
      expect(price).toBe(15.0); // widthPosition=1, heightPosition=0
    });

    it("rounds up to next breakpoint: height=201 -> position 1 (400)", () => {
      const price = calculatePrice(300, 201, testMatrix);
      expect(price).toBe(25.0); // widthPosition=0, heightPosition=1
    });
  });

  describe("clamp below smallest breakpoint", () => {
    it("clamps width below smallest: width=100 -> position 0, height=200 -> position 0", () => {
      const price = calculatePrice(100, 200, testMatrix);
      expect(price).toBe(10.0); // widthPosition=0, heightPosition=0
    });

    it("clamps height below smallest: width=300 -> position 0, height=50 -> position 0", () => {
      const price = calculatePrice(300, 50, testMatrix);
      expect(price).toBe(10.0); // widthPosition=0, heightPosition=0
    });

    it("clamps both below smallest: width=50, height=50 -> position (0,0)", () => {
      const price = calculatePrice(50, 50, testMatrix);
      expect(price).toBe(10.0); // widthPosition=0, heightPosition=0
    });
  });

  describe("clamp above largest breakpoint", () => {
    it("clamps width above largest: width=1200 -> position 2, height=200 -> position 0", () => {
      const price = calculatePrice(1200, 200, testMatrix);
      expect(price).toBe(20.0); // widthPosition=2, heightPosition=0
    });

    it("clamps height above largest: width=300 -> position 0, height=800 -> position 2", () => {
      const price = calculatePrice(300, 800, testMatrix);
      expect(price).toBe(40.0); // widthPosition=0, heightPosition=2
    });

    it("clamps both above largest: width=1200, height=800 -> position (2,2)", () => {
      const price = calculatePrice(1200, 800, testMatrix);
      expect(price).toBe(50.0); // widthPosition=2, heightPosition=2
    });
  });

  describe("edge cases", () => {
    it("throws error when cell is missing for calculated position", () => {
      const incompleteMatrix: MatrixData = {
        widthBreakpoints: [{ position: 0, value: 300 }],
        heightBreakpoints: [{ position: 0, value: 200 }],
        cells: [], // No cells!
      };

      expect(() => calculatePrice(300, 200, incompleteMatrix)).toThrow(
        "No price found for position (0, 0)"
      );
    });

    it("handles decimal dimension values correctly (rounds up)", () => {
      const price = calculatePrice(450.5, 350.7, testMatrix);
      expect(price).toBe(30.0); // Both round up to position 1
    });
  });
});
