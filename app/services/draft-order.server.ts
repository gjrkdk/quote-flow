/**
 * Draft Order Service
 *
 * Creates Shopify Draft Orders with custom matrix-based pricing.
 * Handles price calculation, dimension validation, API retries, and local record keeping.
 */

// GraphQL Admin API: This service uses the draftOrderCreate GraphQL mutation
// (not the REST Admin API) per Shopify's recommended migration path.

import { BreakpointAxis, type Prisma } from "@prisma/client";
import { backOff } from "exponential-backoff";
import { prisma } from "~/db.server";
import {
  calculatePrice,
  validateDimensions,
  type MatrixData,
} from "./price-calculator.server";

export interface CreateDraftOrderInput {
  admin: any; // Shopify admin GraphQL client from authenticate.admin
  storeId: string;
  matrixId: string;
  productId: string; // GID format
  productTitle: string;
  width: number; // in merchant's display unit (same unit as breakpoints)
  height: number; // in merchant's display unit (same unit as breakpoints)
  quantity: number;
  unitPreference: string; // "mm" or "cm" for display
}

export interface CreateDraftOrderResult {
  success: boolean;
  draftOrder?: {
    id: string;
    name: string;
    totalPrice: string;
    invoiceUrl?: string;
  };
  error?: string;
}

export interface SubmitDraftOrderInput {
  admin: any; // Shopify admin GraphQL client (embedded or REST-created)
  storeId: string;
  matrixId: string;
  productId: string;
  productTitle: string;
  width: number;
  height: number;
  quantity: number;
  unitPrice: number;
  unit: string; // "mm" or "cm" for display
  options?: Array<{
    optionGroupName: string;
    choiceLabel: string;
  }>;
}

function formatDimension(value: number, unit: string): string {
  return `${value}${unit}`;
}

/**
 * Submits a Draft Order to Shopify via GraphQL with retry logic
 * and saves a local record. Shared by both the admin UI and REST API.
 *
 * @param input - Pre-validated Draft Order parameters with calculated price
 * @returns Result with Draft Order details or error
 */
export async function submitDraftOrder(
  input: SubmitDraftOrderInput
): Promise<CreateDraftOrderResult> {
  const {
    admin,
    storeId,
    matrixId,
    productId,
    productTitle,
    width,
    height,
    quantity,
    unitPrice,
    unit,
    options,
  } = input;

  const widthDisplay = formatDimension(width, unit);
  const heightDisplay = formatDimension(height, unit);

  // Build custom attributes: start with dimensions
  const customAttributes = [
    { key: "Width", value: widthDisplay },
    { key: "Height", value: heightDisplay },
  ];

  // Add option selections if provided
  if (options && options.length > 0) {
    for (const option of options) {
      customAttributes.push({
        key: option.optionGroupName,
        value: option.choiceLabel,
      });
    }
  }

  // Create Draft Order via GraphQL with retry logic.
  // Use a custom line item (title + originalUnitPrice) instead of variantId,
  // because Shopify ignores originalUnitPrice when variantId is present.
  const draftOrderInput = {
    lineItems: [
      {
        title: productTitle,
        quantity,
        originalUnitPrice: unitPrice,
        customAttributes,
      },
    ],
    tags: ["price-matrix"],
  };

  let draftOrderResult: any;
  try {
    draftOrderResult = await backOff(
      async () => {
        const response = await admin.graphql(
          `#graphql
            mutation DraftOrderCreate($input: DraftOrderInput!) {
              draftOrderCreate(input: $input) {
                draftOrder {
                  id
                  name
                  totalPrice
                  invoiceUrl
                }
                userErrors {
                  field
                  message
                }
              }
            }`,
          {
            variables: { input: draftOrderInput },
          }
        );

        const data = await response.json();

        if (data.errors) {
          throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
        }

        if (
          data.data?.draftOrderCreate?.userErrors &&
          data.data.draftOrderCreate.userErrors.length > 0
        ) {
          const errors = data.data.draftOrderCreate.userErrors
            .map((e: any) => `${e.field}: ${e.message}`)
            .join(", ");
          throw new Error(`Draft Order creation failed: ${errors}`);
        }

        if (!data.data?.draftOrderCreate?.draftOrder) {
          throw new Error("Draft Order not returned from Shopify");
        }

        return data.data.draftOrderCreate;
      },
      {
        numOfAttempts: 3,
        startingDelay: 1000,
        timeMultiple: 2,
        maxDelay: 5000,
        jitter: "full",
        retry: (error: any) => {
          const is429 =
            error.message?.includes("429") ||
            error.message?.includes("RATE_LIMITED");
          return is429;
        },
      }
    );
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create Draft Order in Shopify",
    };
  }

  const draftOrder = draftOrderResult.draftOrder;

  // Save local record in database
  try {
    await prisma.$transaction(async (tx) => {
      await tx.draftOrderRecord.create({
        data: {
          storeId,
          matrixId,
          shopifyDraftOrderId: draftOrder.id,
          shopifyOrderName: draftOrder.name,
          productId,
          width,
          height,
          quantity,
          calculatedPrice: unitPrice,
          totalPrice: parseFloat(draftOrder.totalPrice),
          optionSelections: (options ?? null) as Prisma.InputJsonValue,
        },
      });

      await tx.store.update({
        where: { id: storeId },
        data: {
          totalDraftOrdersCreated: {
            increment: 1,
          },
        },
      });
    });
  } catch (error) {
    console.error("Failed to save Draft Order record:", error);
    return {
      success: true,
      draftOrder: {
        id: draftOrder.id,
        name: draftOrder.name,
        totalPrice: draftOrder.totalPrice,
        invoiceUrl: draftOrder.invoiceUrl,
      },
      error: "Draft Order created but failed to save local record",
    };
  }

  return {
    success: true,
    draftOrder: {
      id: draftOrder.id,
      name: draftOrder.name,
      totalPrice: draftOrder.totalPrice,
      invoiceUrl: draftOrder.invoiceUrl,
    },
  };
}

/**
 * Creates a Draft Order in Shopify with custom matrix-based pricing.
 * High-level orchestrator: loads matrix, validates, calculates price,
 * then delegates to submitDraftOrder for the Shopify API call.
 *
 * Used by the admin UI test flow on the matrix edit page.
 */
export async function createDraftOrder(
  input: CreateDraftOrderInput
): Promise<CreateDraftOrderResult> {
  const {
    admin,
    storeId,
    matrixId,
    productId,
    productTitle,
    width,
    height,
    quantity,
    unitPreference,
  } = input;

  // Step 1: Load matrix data from database
  const matrix = await prisma.priceMatrix.findUnique({
    where: { id: matrixId, storeId },
    include: {
      breakpoints: true,
      cells: true,
    },
  });

  if (!matrix) {
    return { success: false, error: "Matrix not found" };
  }

  const widthBreakpoints = matrix.breakpoints
    .filter((bp) => bp.axis === BreakpointAxis.width)
    .sort((a, b) => a.position - b.position)
    .map((bp) => ({ position: bp.position, value: bp.value }));

  const heightBreakpoints = matrix.breakpoints
    .filter((bp) => bp.axis === BreakpointAxis.height)
    .sort((a, b) => a.position - b.position)
    .map((bp) => ({ position: bp.position, value: bp.value }));

  const cells = matrix.cells.map((cell) => ({
    widthPosition: cell.widthPosition,
    heightPosition: cell.heightPosition,
    price: cell.price,
  }));

  const matrixData: MatrixData = { widthBreakpoints, heightBreakpoints, cells };

  // Step 2: Validate dimensions
  const validation = validateDimensions(width, height, quantity);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Step 3: Calculate price
  let calculatedPrice: number;
  try {
    calculatedPrice = calculatePrice(width, height, matrixData);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to calculate price from matrix",
    };
  }

  // Step 4: Delegate to shared submitDraftOrder
  return submitDraftOrder({
    admin,
    storeId,
    matrixId,
    productId,
    productTitle,
    width,
    height,
    quantity,
    unitPrice: calculatedPrice,
    unit: unitPreference,
  });
}
