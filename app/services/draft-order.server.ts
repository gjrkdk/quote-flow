/**
 * Draft Order Service
 *
 * Creates Shopify Draft Orders with custom matrix-based pricing.
 * Handles price calculation, dimension validation, API retries, and local record keeping.
 */

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
  variantId?: string; // GID format — optional, will query if not provided
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
  };
  error?: string;
}

/**
 * Queries Shopify for the first variant of a product.
 *
 * @param admin - Shopify GraphQL admin client
 * @param productId - Product GID (e.g., "gid://shopify/Product/123")
 * @returns Variant GID or null if not found
 */
async function getProductVariant(
  admin: any,
  productId: string
): Promise<string | null> {
  const response = await admin.graphql(
    `#graphql
      query GetProductVariant($productId: ID!) {
        product(id: $productId) {
          variants(first: 1) {
            edges {
              node {
                id
              }
            }
          }
        }
      }`,
    {
      variables: { productId },
    }
  );

  const data = await response.json();

  if (data.errors) {
    console.error("GraphQL errors:", data.errors);
    return null;
  }

  const variant = data.data?.product?.variants?.edges?.[0]?.node;
  return variant?.id || null;
}

/**
 * Formats a dimension value for display based on unit preference.
 * Value is already in the merchant's display unit (same as breakpoints).
 *
 * @param value - Dimension value in merchant's display unit
 * @param unit - Unit preference ("mm" or "cm")
 * @returns Formatted string (e.g., "180mm" or "18cm")
 */
function formatDimension(value: number, unit: string): string {
  return `${value}${unit}`;
}

/**
 * Creates a Draft Order in Shopify with custom matrix-based pricing.
 *
 * Process:
 * 1. Load and validate matrix data
 * 2. Validate dimensions
 * 3. Calculate price from matrix
 * 4. Query product variant if not provided
 * 5. Create Draft Order via GraphQL with retry logic
 * 6. Save local record in database
 *
 * @param input - Draft Order creation parameters
 * @returns Result with Draft Order details or error
 */
export async function createDraftOrder(
  input: CreateDraftOrderInput
): Promise<CreateDraftOrderResult> {
  const {
    admin,
    storeId,
    matrixId,
    productId,
    variantId: inputVariantId,
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
      widthBreakpoints: true,
      cells: true,
    },
  });

  if (!matrix) {
    return {
      success: false,
      error: "Matrix not found",
    };
  }

  // Transform Prisma breakpoint data into MatrixData format
  const widthBreakpoints = matrix.widthBreakpoints
    .filter((bp) => bp.axis === "width")
    .sort((a, b) => a.position - b.position)
    .map((bp) => ({ position: bp.position, value: bp.value }));

  const heightBreakpoints = matrix.widthBreakpoints
    .filter((bp) => bp.axis === "height")
    .sort((a, b) => a.position - b.position)
    .map((bp) => ({ position: bp.position, value: bp.value }));

  const cells = matrix.cells.map((cell) => ({
    widthPosition: cell.widthPosition,
    heightPosition: cell.heightPosition,
    price: cell.price,
  }));

  const matrixData: MatrixData = {
    widthBreakpoints,
    heightBreakpoints,
    cells,
  };

  // Step 2: Validate dimensions
  const validation = validateDimensions(width, height, quantity);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
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

  // Step 4: Get variant ID if not provided
  let variantId = inputVariantId;
  if (!variantId) {
    const fetchedVariantId = await getProductVariant(admin, productId);
    if (!fetchedVariantId) {
      return {
        success: false,
        error: "Product variant not found",
      };
    }
    variantId = fetchedVariantId;
  }

  // Step 5: Format dimensions for display
  const widthDisplay = formatDimension(width, unitPreference);
  const heightDisplay = formatDimension(height, unitPreference);

  // Step 6: Create Draft Order via GraphQL with retry logic
  const draftOrderInput = {
    lineItems: [
      {
        variantId,
        quantity,
        originalUnitPrice: calculatedPrice,
        customAttributes: [
          { key: "Width", value: widthDisplay },
          { key: "Height", value: heightDisplay },
        ],
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

        // Check for GraphQL errors
        if (data.errors) {
          throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
        }

        // Check for userErrors (these should NOT be retried)
        if (
          data.data?.draftOrderCreate?.userErrors &&
          data.data.draftOrderCreate.userErrors.length > 0
        ) {
          const errors = data.data.draftOrderCreate.userErrors
            .map((e: any) => `${e.field}: ${e.message}`)
            .join(", ");
          throw new Error(`Draft Order creation failed: ${errors}`);
        }

        // Check if draftOrder exists in response
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
          // Only retry on rate limit errors (429)
          // Do NOT retry on userErrors or GraphQL errors
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

  // Step 7: Save local record in database
  try {
    await prisma.$transaction(async (tx) => {
      // Create Draft Order record
      await tx.draftOrderRecord.create({
        data: {
          storeId,
          matrixId,
          shopifyDraftOrderId: draftOrder.id,
          shopifyOrderName: draftOrder.name,
          productId,
          variantId,
          width,
          height,
          quantity,
          calculatedPrice,
          totalPrice: draftOrder.totalPrice,
        },
      });

      // Increment store counter
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
    // Draft Order was created in Shopify, but we failed to save locally
    // Return success anyway since the Draft Order exists
    return {
      success: true,
      draftOrder: {
        id: draftOrder.id,
        name: draftOrder.name,
        totalPrice: draftOrder.totalPrice,
      },
      error: "Draft Order created but failed to save local record",
    };
  }

  // Success!
  return {
    success: true,
    draftOrder: {
      id: draftOrder.id,
      name: draftOrder.name,
      totalPrice: draftOrder.totalPrice,
    },
  };
}
