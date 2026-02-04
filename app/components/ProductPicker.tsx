import { useCallback, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Card,
  ResourceList,
  ResourceItem,
  Button,
  Modal,
  Text,
  BlockStack,
  InlineStack,
} from "@shopify/polaris";

interface ProductPickerProps {
  assignedProducts: Array<{
    id: string;
    productId: string;
    productTitle: string;
  }>;
  onAssign: (products: Array<{ id: string; title: string }>) => void;
  onRemove: (productMatrixId: string) => void;
  conflictProducts?: Array<{
    productId: string;
    productTitle: string;
    currentMatrixName: string;
  }>;
  onConfirmReassign?: (productIds: string[]) => void;
  onCancelReassign?: () => void;
}

export function ProductPicker({
  assignedProducts,
  onAssign,
  onRemove,
  conflictProducts = [],
  onConfirmReassign,
  onCancelReassign,
}: ProductPickerProps) {
  const shopify = useAppBridge();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleOpenPicker = useCallback(async () => {
    try {
      const selected = await shopify.resourcePicker({
        type: "product",
        multiple: true,
        filter: {
          hidden: false,
          variants: false,
        },
      });

      if (selected && selected.length > 0) {
        const products = selected.map((product) => ({
          id: product.id,
          title: product.title,
        }));
        onAssign(products);
      }
    } catch (error) {
      // User cancelled picker
      console.log("Product picker cancelled", error);
    }
  }, [shopify, onAssign]);

  const showConflictModal = conflictProducts.length > 0;

  return (
    <>
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="center">
            <Text as="h2" variant="headingMd">
              Products
            </Text>
            <Button onClick={handleOpenPicker}>Add products</Button>
          </InlineStack>

          {assignedProducts.length > 0 ? (
            <ResourceList
              resourceName={{ singular: "product", plural: "products" }}
              items={assignedProducts}
              renderItem={(item) => {
                const { id, productTitle } = item;
                return (
                  <ResourceItem
                    id={id}
                    onClick={() => {
                      // No-op - ResourceItem requires onClick
                    }}
                  >
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        {productTitle}
                      </Text>
                      <Button
                        variant="plain"
                        tone="critical"
                        onClick={() => onRemove(id)}
                      >
                        Remove
                      </Button>
                    </InlineStack>
                  </ResourceItem>
                );
              }}
            />
          ) : (
            <Text as="p" tone="subdued">
              No products assigned to this matrix. Click "Add products" to get
              started.
            </Text>
          )}
        </BlockStack>
      </Card>

      {showConflictModal && (
        <Modal
          open={showConflictModal}
          onClose={() => onCancelReassign?.()}
          title="Product reassignment warning"
          primaryAction={{
            content: "Reassign to this matrix",
            onAction: () => {
              const productIds = conflictProducts.map((p) => p.productId);
              onConfirmReassign?.(productIds);
            },
            destructive: true,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: () => onCancelReassign?.(),
            },
          ]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              <Text as="p">
                The following products are already assigned to other matrices.
                Reassigning them will remove them from their current matrices.
              </Text>
              <BlockStack gap="200">
                {conflictProducts.map((conflict) => (
                  <Text as="p" key={conflict.productId} fontWeight="semibold">
                    • {conflict.productTitle} (currently in "
                    {conflict.currentMatrixName}")
                  </Text>
                ))}
              </BlockStack>
            </BlockStack>
          </Modal.Section>
        </Modal>
      )}
    </>
  );
}
