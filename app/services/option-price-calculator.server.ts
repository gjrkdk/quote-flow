/**
 * Option Price Calculator Service
 *
 * Provides price calculation with option modifiers using integer arithmetic.
 * Handles fixed and percentage modifiers with non-compounding stacking and
 * ceiling rounding for percentage calculations.
 */

/**
 * Basis points divisor for percentage calculations.
 * 10000 basis points = 100%
 * e.g., 1000 basis points = 10%
 */
const BASIS_POINTS_DIVISOR = 10000;

export interface PriceModifier {
  type: "FIXED" | "PERCENTAGE";
  value: number; // FIXED: cents, PERCENTAGE: basis points (10000 = 100%)
  label: string; // e.g. "Tempered glass", "Economy finish"
}

export interface ModifierBreakdown {
  label: string;
  type: "FIXED" | "PERCENTAGE";
  originalValue: number; // raw modifier value as stored
  appliedAmountCents: number; // actual cents added/subtracted
}

export interface PriceBreakdownResult {
  basePriceCents: number;
  modifiers: ModifierBreakdown[];
  totalCents: number;
}

/**
 * Calculates the cents amount for a single modifier.
 *
 * @param basePriceCents - Base price from matrix in cents
 * @param modifier - Price modifier (FIXED or PERCENTAGE)
 * @returns Cents amount to add/subtract from base price
 *
 * @example
 * // Fixed modifier: returns value directly
 * calculateModifierAmount(1000, {type:'FIXED', value:500, label:'Glass'}) // 500
 *
 * @example
 * // Percentage modifier: calculates from base with ceiling round-up
 * calculateModifierAmount(1000, {type:'PERCENTAGE', value:1000, label:'Coating'}) // 100 (10% of $10.00)
 *
 * @example
 * // Ceiling rounds toward positive infinity (favorable to merchant)
 * calculateModifierAmount(999, {type:'PERCENTAGE', value:1500, label:'Premium'}) // 150 (Math.ceil(149.85))
 * calculateModifierAmount(999, {type:'PERCENTAGE', value:-1500, label:'Economy'}) // -149 (Math.ceil(-149.85))
 */
export function calculateModifierAmount(
  basePriceCents: number,
  modifier: PriceModifier
): number {
  if (modifier.type === "FIXED") {
    return modifier.value;
  }

  // PERCENTAGE: calculate from base price with ceiling round-up
  // Math.ceil rounds toward positive infinity for both positive and negative
  return Math.ceil((basePriceCents * modifier.value) / BASIS_POINTS_DIVISOR);
}

/**
 * Calculates total price with option modifiers applied.
 *
 * All modifiers are calculated from the base price (non-compounding).
 * Total is floored at $0.00 to prevent negative prices.
 *
 * @param basePriceCents - Base price from matrix in cents
 * @param modifiers - Array of price modifiers to apply
 * @returns Price breakdown with base, modifiers, and total
 *
 * @example
 * // Single fixed modifier
 * calculatePriceWithOptions(1000, [{type:'FIXED', value:500, label:'Glass'}])
 * // { basePriceCents: 1000, modifiers: [...], totalCents: 1500 }
 *
 * @example
 * // Non-compounding percentages
 * calculatePriceWithOptions(1000, [
 *   {type:'PERCENTAGE', value:1000, label:'A'},
 *   {type:'PERCENTAGE', value:500, label:'B'}
 * ])
 * // totalCents: 1150 (1000 + 100 + 50, NOT 1155 from compounding)
 *
 * @example
 * // Floor at zero prevents negative totals
 * calculatePriceWithOptions(1000, [{type:'FIXED', value:-1500, label:'Discount'}])
 * // { basePriceCents: 1000, modifiers: [...], totalCents: 0 }
 */
export function calculatePriceWithOptions(
  basePriceCents: number,
  modifiers: PriceModifier[]
): PriceBreakdownResult {
  // Build breakdown for each modifier
  const modifierBreakdowns: ModifierBreakdown[] = modifiers.map((modifier) => {
    const appliedAmount = calculateModifierAmount(basePriceCents, modifier);
    return {
      label: modifier.label,
      type: modifier.type,
      originalValue: modifier.value,
      appliedAmountCents: appliedAmount,
    };
  });

  // Sum all modifier amounts
  const totalModifierAmount = modifierBreakdowns.reduce(
    (sum, breakdown) => sum + breakdown.appliedAmountCents,
    0
  );

  // Calculate total and floor at zero
  const total = basePriceCents + totalModifierAmount;
  const totalCents = Math.max(0, total);

  return {
    basePriceCents,
    modifiers: modifierBreakdowns,
    totalCents,
  };
}
