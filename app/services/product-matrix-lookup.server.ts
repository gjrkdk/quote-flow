/**
 * Product Matrix Lookup Service
 *
 * Queries the database for a product's assigned price matrix with all
 * breakpoints and cells, then transforms to MatrixData format for price calculation.
 */

import { prisma } from "~/db.server";
import type { MatrixData } from "~/services/price-calculator.server";

export interface ProductMatrixResult {
  matrixData: MatrixData;
  matrixName: string;
  dimensionRange: {
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
  };
  unit: string;
  currency: string;
}

/**
 * Looks up the price matrix assigned to a product.
 *
 * Process:
 * 1. Query ProductMatrix by productId with matrix+breakpoints+cells included
 * 2. Validate that matrix belongs to the authenticated store (prevents cross-store access)
 * 3. Transform Prisma result to MatrixData format for calculatePrice()
 *
 * @param productId - Product GID (e.g., "gid://shopify/Product/12345")
 * @param storeId - Authenticated store ID for ownership validation
 * @returns Matrix data and name, or null if not found or unauthorized
 */
export async function lookupProductMatrix(
  productId: string,
  storeId: string
): Promise<ProductMatrixResult | null> {
  // Query the database
  const productMatrix = await prisma.productMatrix.findUnique({
    where: { productId },
    include: {
      matrix: {
        include: {
          widthBreakpoints: true,
          cells: true,
          store: {
            select: {
              unitPreference: true,
              currency: true,
            },
          },
        },
      },
    },
  });

  // No matrix assigned to this product
  if (!productMatrix) {
    return null;
  }

  // Validate ownership - prevent cross-store access
  if (productMatrix.matrix.storeId !== storeId) {
    return null;
  }

  // Transform to MatrixData format (same pattern as draft-order.server.ts)
  const widthBreakpoints = productMatrix.matrix.widthBreakpoints
    .filter((bp) => bp.axis === "width")
    .sort((a, b) => a.position - b.position)
    .map((bp) => ({ position: bp.position, value: bp.value }));

  const heightBreakpoints = productMatrix.matrix.widthBreakpoints
    .filter((bp) => bp.axis === "height")
    .sort((a, b) => a.position - b.position)
    .map((bp) => ({ position: bp.position, value: bp.value }));

  const cells = productMatrix.matrix.cells.map((cell) => ({
    widthPosition: cell.widthPosition,
    heightPosition: cell.heightPosition,
    price: cell.price,
  }));

  const matrixData: MatrixData = {
    widthBreakpoints,
    heightBreakpoints,
    cells,
  };

  // Calculate dimension ranges from breakpoints
  const minWidth = widthBreakpoints[0]?.value ?? 0;
  const maxWidth = widthBreakpoints[widthBreakpoints.length - 1]?.value ?? 0;
  const minHeight = heightBreakpoints[0]?.value ?? 0;
  const maxHeight = heightBreakpoints[heightBreakpoints.length - 1]?.value ?? 0;

  return {
    matrixData,
    matrixName: productMatrix.matrix.name,
    dimensionRange: {
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
    },
    unit: productMatrix.matrix.store.unitPreference,
    currency: productMatrix.matrix.store.currency,
  };
}
