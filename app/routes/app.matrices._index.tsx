import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import {
  Page,
  Card,
  EmptyState,
  IndexTable,
  Text,
  Modal,
  BlockStack,
  InlineStack,
  Button,
} from "@shopify/polaris";
import { useState, useCallback, useEffect, useRef } from "react";
import { authenticate } from "~/shopify.server";
import { prisma } from "~/db.server";

interface Matrix {
  id: string;
  name: string;
  widthCount: number;
  heightCount: number;
  productCount: number;
  updatedAt: string;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Find the store
  const store = await prisma.store.findUnique({
    where: { shop: session.shop },
  });

  if (!store) {
    return json({ matrices: [] });
  }

  // Query matrices with breakpoints and product count
  const matrices = await prisma.priceMatrix.findMany({
    where: { storeId: store.id },
    include: {
      widthBreakpoints: true,
      _count: { select: { products: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Serialize data: count width/height breakpoints by axis
  const serialized: Matrix[] = matrices.map((matrix) => {
    const widthCount = matrix.widthBreakpoints.filter(
      (bp) => bp.axis === "width"
    ).length;
    const heightCount = matrix.widthBreakpoints.filter(
      (bp) => bp.axis === "height"
    ).length;

    return {
      id: matrix.id,
      name: matrix.name,
      widthCount,
      heightCount,
      productCount: matrix._count.products,
      updatedAt: matrix.updatedAt.toISOString(),
    };
  });

  return json({ matrices: serialized });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const matrixId = formData.get("matrixId");

  if (!matrixId || typeof matrixId !== "string") {
    return json({ error: "Matrix ID is required" }, { status: 400 });
  }

  if (intent === "delete") {
    // Cascade delete handles all related records
    await prisma.priceMatrix.delete({
      where: { id: matrixId },
    });
    return json({ success: true });
  }

  if (intent === "duplicate") {
    // Load full matrix with breakpoints and cells
    const original = await prisma.priceMatrix.findUnique({
      where: { id: matrixId },
      include: {
        widthBreakpoints: true,
        cells: true,
      },
    });

    if (!original) {
      return json({ error: "Matrix not found" }, { status: 404 });
    }

    // Create duplicate in transaction
    const duplicate = await prisma.$transaction(async (tx) => {
      // Create new matrix with modified name
      const newMatrix = await tx.priceMatrix.create({
        data: {
          storeId: original.storeId,
          name: `${original.name} (copy)`,
        },
      });

      // Copy all breakpoints
      if (original.widthBreakpoints.length > 0) {
        await tx.breakpoint.createMany({
          data: original.widthBreakpoints.map((bp) => ({
            matrixId: newMatrix.id,
            axis: bp.axis,
            value: bp.value,
            position: bp.position,
          })),
        });
      }

      // Copy all cells
      if (original.cells.length > 0) {
        await tx.matrixCell.createMany({
          data: original.cells.map((cell) => ({
            matrixId: newMatrix.id,
            widthPosition: cell.widthPosition,
            heightPosition: cell.heightPosition,
            price: cell.price,
          })),
        });
      }

      return newMatrix;
    });

    // Redirect to the new matrix's edit page
    return redirect(`/app/matrices/${duplicate.id}/edit`);
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function MatricesIndex() {
  const { matrices } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [matrixToDelete, setMatrixToDelete] = useState<Matrix | null>(null);
  const [deletedMatrixId, setDeletedMatrixId] = useState<string | null>(null);

  // Refs for focus management
  const rowRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  const handleRowClick = useCallback(
    (matrixId: string) => {
      navigate(`/app/matrices/${matrixId}/edit`);
    },
    [navigate]
  );

  const handleDeleteClick = useCallback((matrix: Matrix) => {
    setMatrixToDelete(matrix);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!matrixToDelete) return;

    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("matrixId", matrixToDelete.id);
    fetcher.submit(formData, { method: "post" });

    setDeleteModalOpen(false);
    setDeletedMatrixId(matrixToDelete.id);
    setMatrixToDelete(null);
  }, [matrixToDelete, fetcher]);

  const handleDuplicateClick = useCallback(
    (matrixId: string) => {
      const formData = new FormData();
      formData.append("intent", "duplicate");
      formData.append("matrixId", matrixId);
      fetcher.submit(formData, { method: "post" });
    },
    [fetcher]
  );

  // Focus management after delete
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data && deletedMatrixId) {
      if (matrices.length === 0) {
        // No matrices remain - focus on create button in empty state
        // Empty state button will be rendered after this component unmounts
        // Use a timeout to wait for the empty state to render
        setTimeout(() => {
          const emptyStateButton = document.getElementById(
            "create-matrix-btn"
          ) as HTMLButtonElement;
          if (emptyStateButton) {
            emptyStateButton.focus();
          }
        }, 100);
      } else {
        // Matrix was successfully deleted - focus on the first matrix in the list
        const firstMatrix = matrices[0];
        if (firstMatrix) {
          const rowElement = rowRefs.current.get(firstMatrix.id);
          if (rowElement) {
            rowElement.focus();
          }
        }
      }

      setDeletedMatrixId(null);
    }
  }, [fetcher.state, fetcher.data, deletedMatrixId, matrices]);

  // Empty state when no matrices
  if (matrices.length === 0) {
    return (
      <Page title="Matrices">
        <EmptyState
          heading="Create your first pricing matrix"
          action={{
            content: "Create matrix",
            onAction: () => navigate("/app/matrices/new"),
            id: "create-matrix-btn",
          }}
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>
            Set up dimension-based pricing by creating a matrix with width and
            height breakpoints. Assign it to products to offer custom pricing
            based on customer dimensions.
          </p>
        </EmptyState>
      </Page>
    );
  }

  // Table view when matrices exist
  const rowMarkup = matrices.map((matrix, index) => (
    <IndexTable.Row
      id={matrix.id}
      key={matrix.id}
      position={index}
      onClick={() => handleRowClick(matrix.id)}
    >
      <IndexTable.Cell>
        <span
          ref={(el) => {
            if (el) {
              rowRefs.current.set(matrix.id, el);
            } else {
              rowRefs.current.delete(matrix.id);
            }
          }}
          tabIndex={-1}
          style={{ outline: "none" }}
        >
          <Text as="span" fontWeight="semibold">
            {matrix.name}
          </Text>
        </span>
      </IndexTable.Cell>
      <IndexTable.Cell>
        {matrix.widthCount} x {matrix.heightCount}
      </IndexTable.Cell>
      <IndexTable.Cell>
        {matrix.productCount} {matrix.productCount === 1 ? "product" : "products"}
      </IndexTable.Cell>
      <IndexTable.Cell>
        {new Date(matrix.updatedAt).toLocaleDateString()}
      </IndexTable.Cell>
      <IndexTable.Cell>
        <div onClick={(e) => e.stopPropagation()}>
          <InlineStack gap="300">
            <Button
              variant="plain"
              size="slim"
              onClick={() => handleDuplicateClick(matrix.id)}
              loading={
                fetcher.state === "submitting" &&
                fetcher.formData?.get("matrixId") === matrix.id &&
                fetcher.formData?.get("intent") === "duplicate"
              }
            >
              Duplicate
            </Button>
            <Button
              variant="plain"
              size="slim"
              tone="critical"
              onClick={() => handleDeleteClick(matrix)}
            >
              Delete
            </Button>
          </InlineStack>
        </div>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page
      title="Matrices"
      primaryAction={{
        content: "Create matrix",
        onAction: () => navigate("/app/matrices/new"),
      }}
    >
      <Card padding="0">
        <IndexTable
          resourceName={{ singular: "matrix", plural: "matrices" }}
          itemCount={matrices.length}
          headings={[
            { title: "Name" },
            { title: "Grid size" },
            { title: "Products" },
            { title: "Last edited" },
            { title: "Actions" },
          ]}
          selectable={false}
        >
          {rowMarkup}
        </IndexTable>
      </Card>

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete matrix"
        primaryAction={{
          content: "Delete",
          onAction: handleDeleteConfirm,
          destructive: true,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setDeleteModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="200">
            <Text as="p">
              This will permanently delete the matrix "{matrixToDelete?.name}".
            </Text>
            {matrixToDelete && matrixToDelete.productCount > 0 && (
              <Text as="p" tone="critical">
                This will unassign {matrixToDelete.productCount}{" "}
                {matrixToDelete.productCount === 1 ? "product" : "products"}.
              </Text>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
