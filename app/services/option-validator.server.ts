/**
 * Option Validator Service
 *
 * Validates option selections against product's assigned option groups.
 * Enforces business rules: group assignment, choice membership, one-per-group, required groups.
 */

import { getProductOptionGroups } from "./option-group.server";
import type { OptionGroup, OptionChoice } from "@prisma/client";

export interface OptionSelection {
  optionGroupId: string;
  choiceId: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  validatedGroups?: Array<OptionGroup & { choices: OptionChoice[] }>;
}

/**
 * Validates option selections against a product's assigned option groups.
 *
 * Business rules enforced:
 * 1. Product must exist and be authorized for the store
 * 2. All selected option groups must be assigned to the product
 * 3. All selected choices must belong to their respective option groups
 * 4. At most one selection per option group (no duplicates)
 * 5. All REQUIRED groups must have a selection (OPTIONAL can be omitted)
 *
 * @param productId - Product ID in GID format
 * @param selections - Array of option selections (optionGroupId + choiceId pairs)
 * @param storeId - Store ID for authorization
 * @returns ValidationResult with valid flag, error message if invalid, and validated groups on success
 *
 * @example
 * // Valid selection
 * const result = await validateOptionSelections(
 *   "gid://shopify/Product/12345",
 *   [
 *     { optionGroupId: "group1", choiceId: "choice1" },
 *     { optionGroupId: "group2", choiceId: "choice2" }
 *   ],
 *   "store123"
 * );
 * // { valid: true, validatedGroups: [...] }
 *
 * @example
 * // Invalid: group not assigned to product
 * const result = await validateOptionSelections(
 *   "gid://shopify/Product/12345",
 *   [{ optionGroupId: "unknownGroup", choiceId: "choice1" }],
 *   "store123"
 * );
 * // { valid: false, error: 'Option group "unknownGroup" is not assigned to this product' }
 */
export async function validateOptionSelections(
  productId: string,
  selections: OptionSelection[],
  storeId: string
): Promise<ValidationResult> {
  // Rule 1: Fetch product's assigned option groups
  const productGroups = await getProductOptionGroups(productId, storeId);

  if (!productGroups) {
    return {
      valid: false,
      error: "Product not found or not authorized",
    };
  }

  // Build efficient lookup structures
  const groupMap = new Map<string, OptionGroup & { choices: OptionChoice[] }>();
  const choiceMap = new Map<string, Map<string, OptionChoice>>(); // groupId -> (choiceId -> choice)

  for (const group of productGroups) {
    groupMap.set(group.id, group);
    const groupChoices = new Map<string, OptionChoice>();
    for (const choice of group.choices) {
      groupChoices.set(choice.id, choice);
    }
    choiceMap.set(group.id, groupChoices);
  }

  // Rule 2: Check all selected groups are assigned to product
  for (const selection of selections) {
    const group = groupMap.get(selection.optionGroupId);
    if (!group) {
      return {
        valid: false,
        error: `Option group "${selection.optionGroupId}" is not assigned to this product`,
      };
    }
  }

  // Rule 3: Check all selected choices belong to their groups
  for (const selection of selections) {
    const groupChoices = choiceMap.get(selection.optionGroupId);
    if (!groupChoices) {
      // Should not happen if Rule 2 passed, but defensive
      return {
        valid: false,
        error: `Option group "${selection.optionGroupId}" not found`,
      };
    }

    const choice = groupChoices.get(selection.choiceId);
    if (!choice) {
      const group = groupMap.get(selection.optionGroupId);
      return {
        valid: false,
        error: `Choice "${selection.choiceId}" does not belong to option group "${group?.name || selection.optionGroupId}"`,
      };
    }
  }

  // Rule 4: Check at most one selection per group
  const selectedGroups = new Set<string>();
  for (const selection of selections) {
    if (selectedGroups.has(selection.optionGroupId)) {
      const group = groupMap.get(selection.optionGroupId);
      return {
        valid: false,
        error: `Multiple selections for option group "${group?.name || selection.optionGroupId}" (only one allowed)`,
      };
    }
    selectedGroups.add(selection.optionGroupId);
  }

  // Rule 5: Check all REQUIRED groups have a selection
  for (const group of productGroups) {
    if (group.requirement === "REQUIRED" && !selectedGroups.has(group.id)) {
      return {
        valid: false,
        error: `Required option group "${group.name}" must have a selection`,
      };
    }
  }

  // All validations passed
  return {
    valid: true,
    validatedGroups: productGroups,
  };
}
