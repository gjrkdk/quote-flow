import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import {
  Page,
  Card,
  TextField,
  Select,
  Banner,
  BlockStack,
  Text,
  InlineStack,
  Button,
  Checkbox,
  Badge,
} from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import { authenticate } from "~/shopify.server";
import { prisma } from "~/db.server";
import { OptionGroupUpdateSchema } from "~/validators/option-group.validators";
import {
  getOptionGroup,
  updateOptionGroup,
  assignOptionGroupToProduct,
  unassignOptionGroupFromProduct
} from "~/services/option-group.server";
import { ZodError } from "zod";

interface Choice {
  id?: string;
  label: string;
  modifierType: "FIXED" | "PERCENTAGE";
  modifierValue: number;
  isDefault: boolean;
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { id } = params;

  if (!id) {
    throw new Response("Option group ID is required", { status: 400 });
  }

  // Find store
  const store = await prisma.store.findUnique({
    where: { shop: session.shop },
    select: { id: true },
  });

  if (!store) {
    throw new Response("Store not found", { status: 404 });
  }

  // Get option group
  const optionGroup = await getOptionGroup(id, store.id);

  if (!optionGroup) {
    throw new Response("Option group not found", { status: 404 });
  }

  // Get assigned products with their option group counts
  const assignedProducts = await prisma.productOptionGroup.findMany({
    where: { optionGroupId: id },
    include: {
      product: true,
    },
  });

  // For each assigned product, count how many option groups it has total
  const assignedProductsWithCounts = await Promise.all(
    assignedProducts.map(async (assignment) => {
      const groupCount = await prisma.productOptionGroup.count({
        where: { productId: assignment.product.productId },
      });

      return {
        assignmentId: assignment.id,
        productId: assignment.product.productId,
        productTitle: assignment.product.productTitle,
        groupCount,
      };
    })
  );

  // Get all products for the store that are NOT already assigned to this group
  const assignedProductIds = assignedProducts.map((a) => a.product.productId);

  const allProducts = await prisma.productMatrix.findMany({
    where: {
      matrix: { storeId: store.id },
      productId: { notIn: assignedProductIds },
    },
    select: {
      productId: true,
      productTitle: true,
    },
    orderBy: { productTitle: "asc" },
  });

  // Remove duplicates (same product might be in multiple matrices)
  const uniqueProducts = Array.from(
    new Map(allProducts.map((p) => [p.productId, p])).values()
  );

  // Serialize response
  return json({
    optionGroup: {
      id: optionGroup.id,
      name: optionGroup.name,
      requirement: optionGroup.requirement,
      choices: optionGroup.choices.map((c) => ({
        id: c.id,
        label: c.label,
        modifierType: c.modifierType,
        modifierValue: c.modifierValue,
        isDefault: c.isDefault,
      })),
      productCount: optionGroup._count.products,
    },
    assignedProducts: assignedProductsWithCounts,
    availableProducts: uniqueProducts,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { id } = params;

  if (!id) {
    return json({ error: "Option group ID is required" }, { status: 400 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Handle save intent (update option group)
  if (!intent || intent === "save") {
    const dataStr = formData.get("data");

    if (!dataStr || typeof dataStr !== "string") {
      return json({ error: "Invalid form data" }, { status: 400 });
    }

    try {
      const data = JSON.parse(dataStr);
      const validated = OptionGroupUpdateSchema.parse(data);

      // Find store
      const store = await prisma.store.findUnique({
        where: { shop: session.shop },
        select: { id: true },
      });

      if (!store) {
        return json({ error: "Store not found" }, { status: 404 });
      }

      // Update option group
      const optionGroup = await updateOptionGroup(id, store.id, validated);

      if (!optionGroup) {
        return json({ error: "Option group not found" }, { status: 404 });
      }

      return json({ success: true });
    } catch (error) {
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0];
        return json(
          { error: firstIssue.message },
          { status: 400 }
        );
      }

      const message = error instanceof Error ? error.message : "Unknown error";
      return json({ error: message }, { status: 400 });
    }
  }

  // Handle assign intent
  if (intent === "assign") {
    const productId = formData.get("productId");

    if (!productId || typeof productId !== "string") {
      return json({ error: "Product ID is required" }, { status: 400 });
    }

    try {
      // Find store
      const store = await prisma.store.findUnique({
        where: { shop: session.shop },
        select: { id: true },
      });

      if (!store) {
        return json({ error: "Store not found" }, { status: 404 });
      }

      // Get option group to verify it exists
      const optionGroup = await getOptionGroup(id, store.id);

      if (!optionGroup) {
        return json({ error: "Option group not found" }, { status: 404 });
      }

      // Assign product to option group
      await assignOptionGroupToProduct(productId, id, store.id);

      return json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return json({ error: message }, { status: 400 });
    }
  }

  // Handle unassign intent
  if (intent === "unassign") {
    const productId = formData.get("productId");

    if (!productId || typeof productId !== "string") {
      return json({ error: "Product ID is required" }, { status: 400 });
    }

    try {
      // Unassign product from option group
      const result = await unassignOptionGroupFromProduct(productId, id);

      if (!result) {
        return json({ error: "Assignment not found" }, { status: 404 });
      }

      return json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return json({ error: message }, { status: 400 });
    }
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function EditOptionGroup() {
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();
  const assignFetcher = useFetcher<typeof action>();

  const [name, setName] = useState(loaderData.optionGroup.name);
  const [requirement, setRequirement] = useState<"REQUIRED" | "OPTIONAL">(
    loaderData.optionGroup.requirement as "REQUIRED" | "OPTIONAL"
  );
  const [choices, setChoices] = useState<Choice[]>(
    loaderData.optionGroup.choices.map((c) => ({
      id: c.id,
      label: c.label,
      modifierType: c.modifierType as "FIXED" | "PERCENTAGE",
      modifierValue: c.modifierValue,
      isDefault: c.isDefault,
    }))
  );

  const [selectedProductId, setSelectedProductId] = useState("");
  const [capError, setCapError] = useState<string | null>(null);

  // Banner state (auto-dismiss)
  const [showSaveBanner, setShowSaveBanner] = useState(false);
  const [showSaveError, setShowSaveError] = useState<string | null>(null);

  const isSubmitting = fetcher.state === "submitting" || fetcher.state === "loading";
  const actionData = fetcher.data;
  const assignActionData = assignFetcher.data;
  const isAssigning = assignFetcher.state === "submitting" || assignFetcher.state === "loading";

  // Add choice
  const addChoice = useCallback(() => {
    if (choices.length >= 20) return;
    setChoices((prev) => [
      ...prev,
      { label: "", modifierType: "FIXED", modifierValue: 0, isDefault: false },
    ]);
  }, [choices.length]);

  // Remove choice
  const removeChoice = useCallback((index: number) => {
    setChoices((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Update choice field
  const updateChoice = useCallback((index: number, field: keyof Choice, value: any) => {
    setChoices((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    const data = {
      name,
      requirement,
      choices,
    };

    fetcher.submit(
      { data: JSON.stringify(data) },
      { method: "post" }
    );
  }, [name, requirement, choices, fetcher]);

  // Handle product assignment
  const handleAssignProduct = useCallback(() => {
    if (!selectedProductId) return;

    const formData = new FormData();
    formData.append("intent", "assign");
    formData.append("productId", selectedProductId);
    assignFetcher.submit(formData, { method: "post" });
    setSelectedProductId("");
  }, [selectedProductId, assignFetcher]);

  // Handle product unassignment
  const handleUnassignProduct = useCallback((productId: string) => {
    const formData = new FormData();
    formData.append("intent", "unassign");
    formData.append("productId", productId);
    assignFetcher.submit(formData, { method: "post" });
  }, [assignFetcher]);

  // Handle assignment errors (cap enforcement)
  useEffect(() => {
    if (assignActionData && "error" in assignActionData) {
      if (assignActionData.error.includes("Maximum 5 option groups")) {
        setCapError(assignActionData.error);
      }
    } else if (assignActionData && "success" in assignActionData) {
      setCapError(null);
    }
  }, [assignActionData]);

  // Handle save response (auto-dismiss banners)
  useEffect(() => {
    if (actionData && "success" in actionData && actionData.success) {
      setShowSaveBanner(true);
      setShowSaveError(null);
      const timer = setTimeout(() => setShowSaveBanner(false), 4000);
      return () => clearTimeout(timer);
    }
    if (actionData && "error" in actionData) {
      setShowSaveError(String(actionData.error));
      setShowSaveBanner(false);
    }
  }, [actionData]);

  return (
    <Page
      title={name}
      backAction={{ onAction: () => navigate("/app/option-groups") }}
      primaryAction={
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={!name.trim() || choices.length === 0 || isSubmitting}
        >
          Save
        </Button>
      }
    >
      <BlockStack gap="400">
        {showSaveError && (
          <Banner tone="critical" onDismiss={() => setShowSaveError(null)}>{showSaveError}</Banner>
        )}

        {showSaveBanner && (
          <Banner tone="success" onDismiss={() => setShowSaveBanner(false)}>Option group saved successfully</Banner>
        )}

        {/* Group details card */}
        <Card>
          <BlockStack gap="400">
            <TextField
              label="Group name"
              value={name}
              onChange={setName}
              autoComplete="off"
              maxLength={100}
              placeholder="e.g., Material, Size, Finish"
              requiredIndicator
              helpText="Choose a descriptive name for this option group"
            />

            <Select
              label="Requirement"
              options={[
                { label: "Optional - customers can skip", value: "OPTIONAL" },
                { label: "Required - customers must select", value: "REQUIRED" },
              ]}
              value={requirement}
              onChange={(value) => setRequirement(value as "REQUIRED" | "OPTIONAL")}
              helpText={
                requirement === "OPTIONAL"
                  ? "Customers can skip this option. You can set a default choice below."
                  : "Customers must select one of the choices for this option."
              }
            />
          </BlockStack>
        </Card>

        {/* Choices card */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd">
                Choices
              </Text>
              <Button
                onClick={addChoice}
                disabled={choices.length >= 20}
              >
                Add choice
              </Button>
            </InlineStack>

            {choices.length >= 20 && (
              <Banner tone="warning">
                Maximum 20 choices per group.
              </Banner>
            )}

            <BlockStack gap="300">
              {choices.map((choice, index) => (
                <Card key={index}>
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Choice {index + 1}
                      </Text>
                      {choices.length > 1 && (
                        <Button
                          variant="plain"
                          tone="critical"
                          onClick={() => removeChoice(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </InlineStack>

                    <TextField
                      label="Label"
                      value={choice.label}
                      onChange={(value) => updateChoice(index, "label", value)}
                      autoComplete="off"
                      maxLength={100}
                      placeholder="e.g., Premium Glass, Standard Glass"
                      requiredIndicator
                    />

                    <Select
                      label="Modifier type"
                      options={[
                        { label: "Fixed amount (e.g., +$5.00)", value: "FIXED" },
                        { label: "Percentage (e.g., +10%)", value: "PERCENTAGE" },
                      ]}
                      value={choice.modifierType}
                      onChange={(value) =>
                        updateChoice(index, "modifierType", value as "FIXED" | "PERCENTAGE")
                      }
                    />

                    <TextField
                      label="Modifier value"
                      type="number"
                      value={String(choice.modifierValue)}
                      onChange={(value) => {
                        const parsed = parseInt(value, 10);
                        updateChoice(index, "modifierValue", isNaN(parsed) ? 0 : parsed);
                      }}
                      autoComplete="off"
                      helpText={
                        choice.modifierType === "FIXED"
                          ? "Enter amount in cents (500 = $5.00). Negative values allowed for discounts."
                          : "Enter percentage in basis points (1000 = 10%). Negative values allowed for discounts."
                      }
                    />

                    {requirement === "OPTIONAL" && (
                      <Checkbox
                        label="Set as default choice"
                        checked={choice.isDefault}
                        onChange={(checked) => updateChoice(index, "isDefault", checked)}
                        helpText="Optional groups can have one default choice pre-selected"
                      />
                    )}
                  </BlockStack>
                </Card>
              ))}
            </BlockStack>
          </BlockStack>
        </Card>

        {/* Product assignment section */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Assigned Products
            </Text>

            {/* Cap error banner */}
            {capError && (
              <Banner tone="critical">
                {capError}
              </Banner>
            )}

            {/* Assignment controls */}
            <InlineStack gap="300" blockAlign="end">
              <div style={{ flexGrow: 1 }}>
                <Select
                  label="Assign to product"
                  labelHidden
                  options={[
                    { label: "Select a product to assign", value: "" },
                    ...loaderData.availableProducts.map((p) => ({
                      label: p.productTitle,
                      value: p.productId,
                    })),
                  ]}
                  value={selectedProductId}
                  onChange={setSelectedProductId}
                />
              </div>
              <Button
                onClick={handleAssignProduct}
                disabled={!selectedProductId || isAssigning}
                loading={isAssigning}
              >
                Assign
              </Button>
            </InlineStack>

            {/* Product list */}
            {loaderData.assignedProducts.length > 0 ? (
              <BlockStack gap="300">
                {loaderData.assignedProducts.map((product) => (
                  <Card key={product.productId}>
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <InlineStack gap="200" blockAlign="center">
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            {product.productTitle}
                          </Text>
                          {product.groupCount >= 5 && (
                            <Badge tone="warning">At limit</Badge>
                          )}
                        </InlineStack>
                        <Text as="p" tone="subdued">
                          {product.groupCount} option {product.groupCount === 1 ? "group" : "groups"} assigned
                        </Text>
                      </BlockStack>
                      <Button
                        variant="plain"
                        tone="critical"
                        onClick={() => handleUnassignProduct(product.productId)}
                      >
                        Remove
                      </Button>
                    </InlineStack>
                  </Card>
                ))}
              </BlockStack>
            ) : (
              <Text as="p" tone="subdued">
                No products assigned. Select a product above to assign this option group.
              </Text>
            )}

            {/* Help text */}
            <Text as="p" tone="subdued">
              Groups are displayed alphabetically by name on the product page.
            </Text>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
