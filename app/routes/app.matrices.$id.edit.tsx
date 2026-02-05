import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import {
  Page,
  Card,
  Banner,
  BlockStack,
  Text,
  Button,
  InlineStack,
  TextField,
  Select,
} from "@shopify/polaris";
import { useState, useEffect, useCallback } from "react";
import { authenticate } from "~/shopify.server";
import { prisma } from "~/db.server";
import { MatrixGrid } from "~/components/MatrixGrid";
import { UnsavedChangesPrompt } from "~/components/UnsavedChangesPrompt";
import { ProductPicker } from "~/components/ProductPicker";
import { createDraftOrder } from "~/services/draft-order.server";

interface LoaderData {
  matrix: {
    id: string;
    name: string;
  };
  widthBreakpoints: number[];
  heightBreakpoints: number[];
  cells: Record<string, number>;
  unit: string;
  productCount: number;
  products: Array<{
    id: string;
    productId: string;
    productTitle: string;
  }>;
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { id } = params;

  if (!id) {
    throw new Response("Matrix ID is required", { status: 400 });
  }

  // Find store
  const store = await prisma.store.findUnique({
    where: { shop: session.shop },
    select: { id: true, unitPreference: true },
  });

  if (!store) {
    throw new Response("Store not found", { status: 404 });
  }

  // Fetch matrix with all relations
  const matrix = await prisma.priceMatrix.findUnique({
    where: { id, storeId: store.id },
    include: {
      widthBreakpoints: { orderBy: { position: "asc" } },
      cells: true,
      products: { orderBy: { assignedAt: "desc" } },
      _count: { select: { products: true } },
    },
  });

  if (!matrix) {
    throw new Response("Matrix not found", { status: 404 });
  }

  // Separate breakpoints by axis
  const widthBreakpoints = matrix.widthBreakpoints
    .filter((bp) => bp.axis === "width")
    .sort((a, b) => a.position - b.position)
    .map((bp) => bp.value);

  const heightBreakpoints = matrix.widthBreakpoints
    .filter((bp) => bp.axis === "height")
    .sort((a, b) => a.position - b.position)
    .map((bp) => bp.value);

  // Build cell map
  const cellsMap: Record<string, number> = {};
  matrix.cells.forEach((cell) => {
    const key = `${cell.widthPosition},${cell.heightPosition}`;
    cellsMap[key] = cell.price;
  });

  return json({
    matrix: {
      id: matrix.id,
      name: matrix.name,
    },
    widthBreakpoints,
    heightBreakpoints,
    cells: cellsMap,
    unit: store.unitPreference,
    productCount: matrix._count.products,
    products: matrix.products.map((p) => ({
      id: p.id,
      productId: p.productId,
      productTitle: p.productTitle,
    })),
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const { id } = params;

  if (!id) {
    return json({ error: "Matrix ID is required" }, { status: 400 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "save") {
    const dataStr = formData.get("data");
    if (!dataStr || typeof dataStr !== "string") {
      return json({ error: "Invalid data" }, { status: 400 });
    }

    const data = JSON.parse(dataStr);
    const { name, widthBreakpoints, heightBreakpoints, cells } = data;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return json({ error: "Matrix name is required" }, { status: 400 });
    }

    if (name.length > 100) {
      return json(
        { error: "Matrix name must be 100 characters or less" },
        { status: 400 }
      );
    }

    if (!Array.isArray(widthBreakpoints) || widthBreakpoints.length === 0) {
      return json(
        { error: "At least one width breakpoint is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(heightBreakpoints) || heightBreakpoints.length === 0) {
      return json(
        { error: "At least one height breakpoint is required" },
        { status: 400 }
      );
    }

    if (widthBreakpoints.length > 50 || heightBreakpoints.length > 50) {
      return json(
        { error: "Maximum 50 breakpoints per axis" },
        { status: 400 }
      );
    }

    // Validate all breakpoints are positive numbers
    if (
      widthBreakpoints.some((bp: number) => typeof bp !== "number" || bp <= 0) ||
      heightBreakpoints.some((bp: number) => typeof bp !== "number" || bp <= 0)
    ) {
      return json(
        { error: "All breakpoints must be positive numbers" },
        { status: 400 }
      );
    }

    // Validate all cells are filled and positive
    const expectedCellCount = widthBreakpoints.length * heightBreakpoints.length;
    if (Object.keys(cells).length !== expectedCellCount) {
      return json(
        { error: "All cells must be filled" },
        { status: 400 }
      );
    }

    for (const [key, value] of Object.entries(cells)) {
      if (typeof value !== "number" || value < 0) {
        return json(
          { error: "All prices must be non-negative numbers" },
          { status: 400 }
        );
      }
    }

    // Find store
    const store = await prisma.store.findUnique({
      where: { shop: session.shop },
      select: { id: true },
    });

    if (!store) {
      return json({ error: "Store not found" }, { status: 404 });
    }

    // Verify matrix belongs to this store
    const matrix = await prisma.priceMatrix.findUnique({
      where: { id, storeId: store.id },
    });

    if (!matrix) {
      return json({ error: "Matrix not found" }, { status: 404 });
    }

    // Sort breakpoints ascending
    const sortedWidths = [...widthBreakpoints].sort((a, b) => a - b);
    const sortedHeights = [...heightBreakpoints].sort((a, b) => a - b);

    // Save in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update matrix name
      await tx.priceMatrix.update({
        where: { id },
        data: { name },
      });

      // 2. Delete all existing breakpoints
      await tx.breakpoint.deleteMany({
        where: { matrixId: id },
      });

      // 3. Delete all existing cells
      await tx.matrixCell.deleteMany({
        where: { matrixId: id },
      });

      // 4. Create new width breakpoints
      const widthBreakpointData = sortedWidths.map((value, index) => ({
        matrixId: id,
        axis: "width",
        value,
        position: index,
      }));

      await tx.breakpoint.createMany({
        data: widthBreakpointData,
      });

      // 5. Create new height breakpoints
      const heightBreakpointData = sortedHeights.map((value, index) => ({
        matrixId: id,
        axis: "height",
        value,
        position: index,
      }));

      await tx.breakpoint.createMany({
        data: heightBreakpointData,
      });

      // 6. Create new cells
      const cellData = [];
      for (let widthPos = 0; widthPos < sortedWidths.length; widthPos++) {
        for (let heightPos = 0; heightPos < sortedHeights.length; heightPos++) {
          const key = `${widthPos},${heightPos}`;
          const price = cells[key] ?? 0;
          cellData.push({
            matrixId: id,
            widthPosition: widthPos,
            heightPosition: heightPos,
            price,
          });
        }
      }

      await tx.matrixCell.createMany({
        data: cellData,
      });
    });

    return json({ success: true });
  }

  if (intent === "rename") {
    const name = formData.get("name");

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return json({ error: "Matrix name is required" }, { status: 400 });
    }

    if (name.length > 100) {
      return json(
        { error: "Matrix name must be 100 characters or less" },
        { status: 400 }
      );
    }

    // Find store
    const store = await prisma.store.findUnique({
      where: { shop: session.shop },
      select: { id: true },
    });

    if (!store) {
      return json({ error: "Store not found" }, { status: 404 });
    }

    // Update matrix name
    await prisma.priceMatrix.update({
      where: { id, storeId: store.id },
      data: { name },
    });

    return json({ success: true });
  }

  if (intent === "assign-products") {
    const productsStr = formData.get("products");
    const confirmed = formData.get("confirmed") === "true";

    if (!productsStr || typeof productsStr !== "string") {
      return json({ error: "Invalid products data" }, { status: 400 });
    }

    const products = JSON.parse(productsStr) as Array<{
      id: string;
      title: string;
    }>;

    if (!Array.isArray(products) || products.length === 0) {
      return json({ error: "No products provided" }, { status: 400 });
    }

    // Find store
    const store = await prisma.store.findUnique({
      where: { shop: session.shop },
      select: { id: true },
    });

    if (!store) {
      return json({ error: "Store not found" }, { status: 404 });
    }

    // Verify matrix belongs to this store
    const matrix = await prisma.priceMatrix.findUnique({
      where: { id, storeId: store.id },
    });

    if (!matrix) {
      return json({ error: "Matrix not found" }, { status: 404 });
    }

    // Extract product IDs (handle both gid:// and numeric formats)
    const productIds = products.map((p) => {
      if (p.id.startsWith("gid://shopify/Product/")) {
        return p.id;
      }
      return `gid://shopify/Product/${p.id}`;
    });

    // Check for conflicts - products already assigned to DIFFERENT matrices
    const existingAssignments = await prisma.productMatrix.findMany({
      where: {
        productId: { in: productIds },
        matrixId: { not: id },
      },
      include: {
        matrix: { select: { name: true } },
      },
    });

    if (existingAssignments.length > 0 && !confirmed) {
      // Return conflicts for user confirmation
      const conflicts = existingAssignments.map((assignment) => ({
        productId: assignment.productId,
        productTitle: assignment.productTitle,
        currentMatrixName: assignment.matrix.name,
      }));

      return json({
        success: false,
        conflicts,
      });
    }

    // Assign products in transaction
    await prisma.$transaction(async (tx) => {
      // Delete old assignments for these products (if reassigning)
      await tx.productMatrix.deleteMany({
        where: { productId: { in: productIds } },
      });

      // Create new assignments
      const productMatrixData = products.map((product) => {
        const productId = product.id.startsWith("gid://shopify/Product/")
          ? product.id
          : `gid://shopify/Product/${product.id}`;

        return {
          matrixId: id,
          productId,
          productTitle: product.title,
        };
      });

      await tx.productMatrix.createMany({
        data: productMatrixData,
      });
    });

    return json({ success: true });
  }

  if (intent === "remove-product") {
    const productMatrixId = formData.get("productMatrixId");

    if (!productMatrixId || typeof productMatrixId !== "string") {
      return json({ error: "Product matrix ID is required" }, { status: 400 });
    }

    // Find store
    const store = await prisma.store.findUnique({
      where: { shop: session.shop },
      select: { id: true },
    });

    if (!store) {
      return json({ error: "Store not found" }, { status: 404 });
    }

    // Verify the product assignment belongs to this matrix (security check)
    const productMatrix = await prisma.productMatrix.findUnique({
      where: { id: productMatrixId },
      include: {
        matrix: { select: { storeId: true } },
      },
    });

    if (!productMatrix || productMatrix.matrix.storeId !== store.id || productMatrix.matrixId !== id) {
      return json(
        { error: "Product assignment not found or access denied" },
        { status: 404 }
      );
    }

    // Delete assignment
    await prisma.productMatrix.delete({
      where: { id: productMatrixId },
    });

    return json({ success: true });
  }

  if (intent === "create-test-draft-order") {
    const productId = formData.get("productId");
    const widthStr = formData.get("width");
    const heightStr = formData.get("height");
    const quantityStr = formData.get("quantity");

    // Validate input
    if (!productId || typeof productId !== "string") {
      return json({ error: "Product is required" }, { status: 400 });
    }

    if (!widthStr || !heightStr || !quantityStr) {
      return json(
        { error: "Width, height, and quantity are required" },
        { status: 400 }
      );
    }

    const width = parseFloat(widthStr as string);
    const height = parseFloat(heightStr as string);
    const quantity = parseInt(quantityStr as string, 10);

    if (isNaN(width) || isNaN(height) || isNaN(quantity)) {
      return json(
        { error: "Width, height, and quantity must be valid numbers" },
        { status: 400 }
      );
    }

    // Find store
    const store = await prisma.store.findUnique({
      where: { shop: session.shop },
      select: { id: true, unitPreference: true },
    });

    if (!store) {
      return json({ error: "Store not found" }, { status: 404 });
    }

    // Find product assignment to get product title
    const productMatrix = await prisma.productMatrix.findFirst({
      where: { productId, matrixId: id },
    });

    if (!productMatrix) {
      return json(
        { error: "Product not assigned to this matrix" },
        { status: 404 }
      );
    }

    // Pass dimensions as-is (in the same unit as breakpoints are stored)
    // Breakpoints are stored in the merchant's display unit, so no conversion needed for price calculation
    const result = await createDraftOrder({
      admin,
      storeId: store.id,
      matrixId: id,
      productId,
      productTitle: productMatrix.productTitle,
      width,
      height,
      quantity,
      unitPreference: store.unitPreference,
    });

    if (!result.success) {
      return json({ error: result.error || "Failed to create draft order" });
    }

    return json({
      success: true,
      draftOrder: result.draftOrder,
    });
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function MatrixEdit() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();

  // State for grid data
  const [name, setName] = useState(loaderData.matrix.name);
  const [widthBreakpoints, setWidthBreakpoints] = useState(
    loaderData.widthBreakpoints
  );
  const [heightBreakpoints, setHeightBreakpoints] = useState(
    loaderData.heightBreakpoints
  );
  const [cells, setCells] = useState<Map<string, number>>(() => {
    const map = new Map<string, number>();
    Object.entries(loaderData.cells).forEach(([key, value]) => {
      map.set(key, value);
    });
    return map;
  });

  // Track dirty state
  const [isDirty, setIsDirty] = useState(false);
  const [emptyCells, setEmptyCells] = useState<Set<string>>(new Set());
  const [validationError, setValidationError] = useState<string | null>(null);

  // Product assignment state
  const [conflictProducts, setConflictProducts] = useState<
    Array<{
      productId: string;
      productTitle: string;
      currentMatrixName: string;
    }>
  >([]);
  const [pendingProducts, setPendingProducts] = useState<
    Array<{ id: string; title: string }>
  >([]);

  // Test Draft Order state
  const [testProductId, setTestProductId] = useState<string>("");
  const [testWidth, setTestWidth] = useState<string>("");
  const [testHeight, setTestHeight] = useState<string>("");
  const [testQuantity, setTestQuantity] = useState<string>("1");
  const testFetcher = useFetcher<typeof action>();

  // Mark as dirty when data changes
  useEffect(() => {
    setIsDirty(true);
  }, [widthBreakpoints, heightBreakpoints, cells, name]);

  // Handle cell change
  const handleCellChange = useCallback(
    (col: number, row: number, value: number | null) => {
      setCells((prev) => {
        const newCells = new Map(prev);
        const key = `${col},${row}`;
        if (value === null) {
          newCells.delete(key);
        } else {
          newCells.set(key, value);
        }
        return newCells;
      });
    },
    []
  );

  // Handle add width breakpoint
  const handleAddWidthBreakpoint = useCallback(
    (value: number) => {
      if (widthBreakpoints.length >= 50) {
        alert("Maximum 50 width breakpoints");
        return;
      }

      // Add breakpoint
      const newWidths = [...widthBreakpoints, value].sort((a, b) => a - b);
      setWidthBreakpoints(newWidths);

      // Add cells for new column
      setCells((prev) => {
        const newCells = new Map(prev);
        const newColIndex = newWidths.indexOf(value);

        // Shift existing cells if needed
        if (newColIndex < newWidths.length - 1) {
          // Need to re-index all cells
          const tempCells = new Map<string, number>();
          for (let row = 0; row < heightBreakpoints.length; row++) {
            for (let col = 0; col < newWidths.length; col++) {
              if (col === newColIndex) {
                // New column, no value
                continue;
              }
              const oldCol = col < newColIndex ? col : col - 1;
              const oldKey = `${oldCol},${row}`;
              const newKey = `${col},${row}`;
              const value = prev.get(oldKey);
              if (value !== undefined) {
                tempCells.set(newKey, value);
              }
            }
          }
          return tempCells;
        } else {
          // Adding to the end
          return newCells;
        }
      });
    },
    [widthBreakpoints, heightBreakpoints.length]
  );

  // Handle add height breakpoint
  const handleAddHeightBreakpoint = useCallback(
    (value: number) => {
      if (heightBreakpoints.length >= 50) {
        alert("Maximum 50 height breakpoints");
        return;
      }

      // Add breakpoint
      const newHeights = [...heightBreakpoints, value].sort((a, b) => a - b);
      setHeightBreakpoints(newHeights);

      // Add cells for new row
      setCells((prev) => {
        const newCells = new Map(prev);
        const newRowIndex = newHeights.indexOf(value);

        // Shift existing cells if needed
        if (newRowIndex < newHeights.length - 1) {
          // Need to re-index all cells
          const tempCells = new Map<string, number>();
          for (let col = 0; col < widthBreakpoints.length; col++) {
            for (let row = 0; row < newHeights.length; row++) {
              if (row === newRowIndex) {
                // New row, no value
                continue;
              }
              const oldRow = row < newRowIndex ? row : row - 1;
              const oldKey = `${col},${oldRow}`;
              const newKey = `${col},${row}`;
              const value = prev.get(oldKey);
              if (value !== undefined) {
                tempCells.set(newKey, value);
              }
            }
          }
          return tempCells;
        } else {
          // Adding to the end
          return newCells;
        }
      });
    },
    [heightBreakpoints, widthBreakpoints.length]
  );

  // Handle remove width breakpoint
  const handleRemoveWidthBreakpoint = useCallback(
    (index: number) => {
      if (widthBreakpoints.length <= 1) {
        alert("At least one width breakpoint is required");
        return;
      }

      // Remove breakpoint
      const newWidths = widthBreakpoints.filter((_, i) => i !== index);
      setWidthBreakpoints(newWidths);

      // Re-index cells
      setCells((prev) => {
        const newCells = new Map<string, number>();
        for (let row = 0; row < heightBreakpoints.length; row++) {
          let newCol = 0;
          for (let col = 0; col < widthBreakpoints.length; col++) {
            if (col === index) continue; // Skip removed column
            const oldKey = `${col},${row}`;
            const newKey = `${newCol},${row}`;
            const value = prev.get(oldKey);
            if (value !== undefined) {
              newCells.set(newKey, value);
            }
            newCol++;
          }
        }
        return newCells;
      });
    },
    [widthBreakpoints, heightBreakpoints.length]
  );

  // Handle remove height breakpoint
  const handleRemoveHeightBreakpoint = useCallback(
    (index: number) => {
      if (heightBreakpoints.length <= 1) {
        alert("At least one height breakpoint is required");
        return;
      }

      // Remove breakpoint
      const newHeights = heightBreakpoints.filter((_, i) => i !== index);
      setHeightBreakpoints(newHeights);

      // Re-index cells
      setCells((prev) => {
        const newCells = new Map<string, number>();
        for (let col = 0; col < widthBreakpoints.length; col++) {
          let newRow = 0;
          for (let row = 0; row < heightBreakpoints.length; row++) {
            if (row === index) continue; // Skip removed row
            const oldKey = `${col},${row}`;
            const newKey = `${col},${newRow}`;
            const value = prev.get(oldKey);
            if (value !== undefined) {
              newCells.set(newKey, value);
            }
            newRow++;
          }
        }
        return newCells;
      });
    },
    [heightBreakpoints, widthBreakpoints.length]
  );

  // Validate before save
  const validateAndSave = useCallback(() => {
    // Check all cells are filled
    const expectedCellCount = widthBreakpoints.length * heightBreakpoints.length;
    const empty = new Set<string>();

    for (let col = 0; col < widthBreakpoints.length; col++) {
      for (let row = 0; row < heightBreakpoints.length; row++) {
        const key = `${col},${row}`;
        const value = cells.get(key);
        if (value === undefined || value === null) {
          empty.add(key);
        }
      }
    }

    if (empty.size > 0) {
      setEmptyCells(empty);
      setValidationError(
        `${empty.size} cell${empty.size === 1 ? " is" : "s are"} empty. Please fill all cells before saving.`
      );
      return;
    }

    setEmptyCells(new Set());
    setValidationError(null);

    // Serialize data
    const cellsObj: Record<string, number> = {};
    cells.forEach((value, key) => {
      cellsObj[key] = value;
    });

    const data = {
      name,
      widthBreakpoints,
      heightBreakpoints,
      cells: cellsObj,
    };

    // Submit
    const formData = new FormData();
    formData.append("intent", "save");
    formData.append("data", JSON.stringify(data));
    fetcher.submit(formData, { method: "post" });
  }, [name, widthBreakpoints, heightBreakpoints, cells, fetcher]);

  // Reset dirty state on successful save
  useEffect(() => {
    if (fetcher.data && "success" in fetcher.data && fetcher.data.success) {
      setIsDirty(false);
      setValidationError(null);
    }
  }, [fetcher.data]);

  // Handle product assignment response
  useEffect(() => {
    if (
      fetcher.data &&
      "conflicts" in fetcher.data &&
      Array.isArray(fetcher.data.conflicts)
    ) {
      setConflictProducts(
        fetcher.data.conflicts as Array<{
          productId: string;
          productTitle: string;
          currentMatrixName: string;
        }>
      );
    }
  }, [fetcher.data]);

  // Product assignment handlers
  const handleAssignProducts = useCallback(
    (products: Array<{ id: string; title: string }>) => {
      setPendingProducts(products);
      const formData = new FormData();
      formData.append("intent", "assign-products");
      formData.append("products", JSON.stringify(products));
      formData.append("confirmed", "false");
      fetcher.submit(formData, { method: "post" });
    },
    [fetcher]
  );

  const handleRemoveProduct = useCallback(
    (productMatrixId: string) => {
      const formData = new FormData();
      formData.append("intent", "remove-product");
      formData.append("productMatrixId", productMatrixId);
      fetcher.submit(formData, { method: "post" });
    },
    [fetcher]
  );

  const handleConfirmReassign = useCallback(
    (productIds: string[]) => {
      const formData = new FormData();
      formData.append("intent", "assign-products");
      formData.append("products", JSON.stringify(pendingProducts));
      formData.append("confirmed", "true");
      fetcher.submit(formData, { method: "post" });
      setConflictProducts([]);
      setPendingProducts([]);
    },
    [fetcher, pendingProducts]
  );

  const handleCancelReassign = useCallback(() => {
    setConflictProducts([]);
    setPendingProducts([]);
  }, []);

  // Test Draft Order handler
  const handleCreateTestDraftOrder = useCallback(() => {
    if (!testProductId || !testWidth || !testHeight || !testQuantity) {
      return;
    }

    const formData = new FormData();
    formData.append("intent", "create-test-draft-order");
    formData.append("productId", testProductId);
    formData.append("width", testWidth);
    formData.append("height", testHeight);
    formData.append("quantity", testQuantity);
    testFetcher.submit(formData, { method: "post" });
  }, [testProductId, testWidth, testHeight, testQuantity, testFetcher]);

  const isLoading = fetcher.state === "submitting" || fetcher.state === "loading";
  const hasEmptyGrid = widthBreakpoints.length === 0 || heightBreakpoints.length === 0;

  return (
    <Page
      title={name}
      backAction={{ onAction: () => navigate("/app/matrices") }}
      primaryAction={
        <Button
          variant="primary"
          onClick={validateAndSave}
          loading={isLoading}
          disabled={!isDirty || isLoading || hasEmptyGrid}
        >
          Save
        </Button>
      }
    >
      <BlockStack gap="400">
        {fetcher.data && "error" in fetcher.data && (
          <Banner tone="critical">{fetcher.data.error}</Banner>
        )}

        {fetcher.data && "success" in fetcher.data && fetcher.data.success && (
          <Banner tone="success">Matrix saved successfully</Banner>
        )}

        {validationError && <Banner tone="warning">{validationError}</Banner>}

        {hasEmptyGrid ? (
          <Card>
            <Banner tone="info">
              Add width and height breakpoints to start building your price grid.
            </Banner>
          </Card>
        ) : (
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Price Grid
              </Text>
              <MatrixGrid
                widthBreakpoints={widthBreakpoints}
                heightBreakpoints={heightBreakpoints}
                cells={cells}
                unit={loaderData.unit}
                onCellChange={handleCellChange}
                onAddWidthBreakpoint={handleAddWidthBreakpoint}
                onAddHeightBreakpoint={handleAddHeightBreakpoint}
                onRemoveWidthBreakpoint={handleRemoveWidthBreakpoint}
                onRemoveHeightBreakpoint={handleRemoveHeightBreakpoint}
                emptyCells={emptyCells}
              />
            </BlockStack>
          </Card>
        )}

        <ProductPicker
          assignedProducts={loaderData.products}
          onAssign={handleAssignProducts}
          onRemove={handleRemoveProduct}
          conflictProducts={conflictProducts}
          onConfirmReassign={handleConfirmReassign}
          onCancelReassign={handleCancelReassign}
        />

        <Card>
          <BlockStack gap="400">
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Test Draft Order
              </Text>
              <Text as="p" tone="subdued">
                Create a test Draft Order in Shopify to verify your pricing
                matrix works correctly. This creates a real draft order visible
                in your Shopify admin.
              </Text>
            </BlockStack>

            {loaderData.products.length === 0 ? (
              <Banner tone="info">
                Assign at least one product to test Draft Order creation.
              </Banner>
            ) : (
              <BlockStack gap="300">
                <Select
                  label="Product"
                  options={[
                    { label: "Select a product", value: "" },
                    ...loaderData.products.map((p) => ({
                      label: p.productTitle,
                      value: p.productId,
                    })),
                  ]}
                  value={testProductId}
                  onChange={setTestProductId}
                />

                <InlineStack gap="300">
                  <TextField
                    label={`Width (${loaderData.unit})`}
                    type="number"
                    value={testWidth}
                    onChange={setTestWidth}
                    autoComplete="off"
                  />
                  <TextField
                    label={`Height (${loaderData.unit})`}
                    type="number"
                    value={testHeight}
                    onChange={setTestHeight}
                    autoComplete="off"
                  />
                  <TextField
                    label="Quantity"
                    type="number"
                    value={testQuantity}
                    onChange={setTestQuantity}
                    autoComplete="off"
                  />
                </InlineStack>

                <InlineStack align="start">
                  <Button
                    variant="primary"
                    onClick={handleCreateTestDraftOrder}
                    loading={testFetcher.state === "submitting"}
                    disabled={
                      !testProductId ||
                      !testWidth ||
                      !testHeight ||
                      !testQuantity ||
                      testFetcher.state === "submitting"
                    }
                  >
                    Create Test Draft Order
                  </Button>
                </InlineStack>

                {testFetcher.data && "error" in testFetcher.data && (
                  <Banner tone="critical">
                    {String(testFetcher.data.error)}
                  </Banner>
                )}

                {testFetcher.data &&
                  "success" in testFetcher.data &&
                  testFetcher.data.success &&
                  "draftOrder" in testFetcher.data &&
                  testFetcher.data.draftOrder ? (
                    <Banner tone="success">
                      <BlockStack gap="200">
                        <Text as="p">
                          Draft Order created successfully:{" "}
                          <strong>
                            {String((testFetcher.data.draftOrder as any).name)}
                          </strong>
                        </Text>
                        <Text as="p" tone="subdued">
                          View this draft order in your Shopify admin under
                          Orders &gt; Drafts. You can filter by the
                          "price-matrix" tag.
                        </Text>
                      </BlockStack>
                    </Banner>
                  ) : null}
              </BlockStack>
            )}
          </BlockStack>
        </Card>
      </BlockStack>

      <UnsavedChangesPrompt isDirty={isDirty} />
    </Page>
  );
}
