import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  TextField,
  ChoiceList,
  Banner,
  BlockStack,
  Text,
  InlineStack,
  Button,
  DropZone,
  Collapsible,
  List,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { BreakpointAxis, UnitPreference } from "@prisma/client";
import { authenticate } from "~/shopify.server";
import { prisma } from "~/db.server";
import { parseMatrixCSV } from "~/services/csv-parser.server";
import { checkBillingStatus, requirePaidPlan, canCreateMatrix } from "~/services/billing.server";
import type { CSVParseResult } from "~/services/csv-parser.server";

type Template = "small" | "medium" | "custom" | "csv";

interface TemplateDefinition {
  widths: number[];
  heights: number[];
}

// Template definitions with breakpoint values in mm
const TEMPLATE_BREAKPOINTS_MM: Record<Exclude<Template, "custom" | "csv">, TemplateDefinition> = {
  small: {
    widths: [300, 600, 900],
    heights: [300, 600, 900],
  },
  medium: {
    widths: [200, 400, 600, 800, 1000],
    heights: [200, 400, 600, 800, 1000],
  },
};

// Convert mm to cm
const mmToCm = (values: number[]): number[] => values.map((v) => v / 10);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Fetch store to get unit preference
  const store = await prisma.store.findUnique({
    where: { shop: session.shop },
    select: { id: true, unitPreference: true },
  });

  if (!store) {
    throw new Response("Store not found", { status: 404 });
  }

  // Count current matrices
  const matrixCount = await prisma.priceMatrix.count({
    where: { storeId: store.id },
  });

  // Check billing status
  const billingStatus = await checkBillingStatus(request);
  const canCreate = await canCreateMatrix(request, matrixCount);

  return json({
    unitPreference: store.unitPreference,
    canCreate,
    hasPaidPlan: billingStatus.hasActivePayment,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  // Handle upgrade intent
  if (intent === "upgrade") {
    await billing.require({
      plans: ["UNLIMITED_PLAN"],
      isTest: process.env.NODE_ENV !== "production",
      onFailure: async () => {
        return redirect("/app/matrices/new");
      },
    });
    // This redirects to Shopify billing page and never returns
    return redirect("/app/matrices/new");
  }

  // Handle CSV preview intent
  if (intent === "preview_csv") {
    const csvContent = formData.get("csvContent");

    if (!csvContent || typeof csvContent !== "string") {
      return json({ error: "No CSV content provided" }, { status: 400 });
    }

    // Check if store has paid plan (CSV is paid feature)
    const paidPlanCheck = await requirePaidPlan(request);
    if (paidPlanCheck.needsUpgrade) {
      return json(
        { error: "CSV Import requires the Unlimited plan ($12/month)" },
        { status: 403 }
      );
    }

    // Parse the CSV
    const parseResult = await parseMatrixCSV(csvContent);

    // Convert Map to plain object for JSON serialization (Map becomes {} via JSON.stringify)
    const cellsObj: Record<string, number> = {};
    parseResult.cells.forEach((value, key) => {
      cellsObj[key] = value;
    });

    return json({
      intent: "preview_csv",
      preview: { ...parseResult, cells: cellsObj },
    });
  }

  // For matrix creation intents, enforce free tier limit
  if (intent === "create" || intent === "confirm_csv") {
    const store = await prisma.store.findUnique({
      where: { shop: session.shop },
    });

    if (!store) {
      return json({ error: "Store not found" }, { status: 404 });
    }

    const matrixCount = await prisma.priceMatrix.count({
      where: { storeId: store.id },
    });

    const canCreate = await canCreateMatrix(request, matrixCount);
    if (!canCreate.allowed) {
      return json(
        { error: "Free plan limit reached. Upgrade to create more matrices." },
        { status: 403 }
      );
    }
  }

  // Handle CSV confirm intent
  if (intent === "confirm_csv") {
    const csvContent = formData.get("csvContent");
    const name = formData.get("name");

    if (!csvContent || typeof csvContent !== "string") {
      return json({ error: "No CSV content provided" }, { status: 400 });
    }

    if (!name || typeof name !== "string") {
      return json({ error: "Matrix name is required" }, { status: 400 });
    }

    if (name.length > 100) {
      return json({ error: "Matrix name must be 100 characters or less" }, { status: 400 });
    }

    // Security check: require paid plan again
    const paidPlanCheck = await requirePaidPlan(request);
    if (paidPlanCheck.needsUpgrade) {
      return json(
        { error: "CSV Import requires the Unlimited plan ($12/month)" },
        { status: 403 }
      );
    }

    // Re-parse the CSV
    const parseResult = await parseMatrixCSV(csvContent);

    if (!parseResult.success || parseResult.validRows === 0) {
      return json({ error: "Invalid CSV data" }, { status: 400 });
    }

    // Find the store
    const store = await prisma.store.findUnique({
      where: { shop: session.shop },
    });

    if (!store) {
      return json({ error: "Store not found" }, { status: 404 });
    }

    // Create matrix from CSV in transaction
    const newMatrix = await prisma.$transaction(async (tx) => {
      // 1. Create the PriceMatrix
      const matrix = await tx.priceMatrix.create({
        data: {
          storeId: store.id,
          name,
        },
      });

      // 2. Create width breakpoints from parsed data
      const widthBreakpoints = parseResult.widths.map((value, index) => ({
        matrixId: matrix.id,
        axis: BreakpointAxis.width,
        value,
        position: index,
      }));

      // 3. Create height breakpoints from parsed data
      const heightBreakpoints = parseResult.heights.map((value, index) => ({
        matrixId: matrix.id,
        axis: BreakpointAxis.height,
        value,
        position: index,
      }));

      await tx.breakpoint.createMany({
        data: [...widthBreakpoints, ...heightBreakpoints],
      });

      // 4. Create cells from parsed data
      const cells = [];
      for (let widthPos = 0; widthPos < parseResult.widths.length; widthPos++) {
        for (let heightPos = 0; heightPos < parseResult.heights.length; heightPos++) {
          const cellKey = `${widthPos},${heightPos}`;
          const price = parseResult.cells.get(cellKey) || 0;
          cells.push({
            matrixId: matrix.id,
            widthPosition: widthPos,
            heightPosition: heightPos,
            price,
          });
        }
      }

      await tx.matrixCell.createMany({
        data: cells,
      });

      return matrix;
    });

    // Redirect to the matrix editor
    return redirect(`/app/matrices/${newMatrix.id}/edit`);
  }

  // Handle regular template creation (intent="create")
  const name = formData.get("name");
  const template = formData.get("template");

  // Validation
  if (!name || typeof name !== "string") {
    return json({ error: "Matrix name is required" }, { status: 400 });
  }

  if (name.length > 100) {
    return json({ error: "Matrix name must be 100 characters or less" }, { status: 400 });
  }

  if (!template || typeof template !== "string") {
    return json({ error: "Template selection is required" }, { status: 400 });
  }

  if (!["small", "medium", "custom"].includes(template)) {
    return json({ error: "Invalid template selection" }, { status: 400 });
  }

  // Find the store
  const store = await prisma.store.findUnique({
    where: { shop: session.shop },
  });

  if (!store) {
    return json({ error: "Store not found" }, { status: 404 });
  }

  // Create matrix in transaction
  const newMatrix = await prisma.$transaction(async (tx) => {
    // 1. Create the PriceMatrix
    const matrix = await tx.priceMatrix.create({
      data: {
        storeId: store.id,
        name,
      },
    });

    // 2. If not custom template, create breakpoints and cells
    if (template !== "custom") {
      const templateDef = TEMPLATE_BREAKPOINTS_MM[template as "small" | "medium"];

      // Use store's unit preference to determine breakpoint values
      const widths = store.unitPreference === UnitPreference.cm
        ? mmToCm(templateDef.widths)
        : templateDef.widths;
      const heights = store.unitPreference === UnitPreference.cm
        ? mmToCm(templateDef.heights)
        : templateDef.heights;

      // 3. Create width breakpoints
      const widthBreakpoints = widths.map((value, index) => ({
        matrixId: matrix.id,
        axis: BreakpointAxis.width,
        value,
        position: index,
      }));

      // 4. Create height breakpoints
      const heightBreakpoints = heights.map((value, index) => ({
        matrixId: matrix.id,
        axis: BreakpointAxis.height,
        value,
        position: index,
      }));

      await tx.breakpoint.createMany({
        data: [...widthBreakpoints, ...heightBreakpoints],
      });

      // 5. Create cells for every width x height combination
      const cells = [];
      for (let widthPos = 0; widthPos < widths.length; widthPos++) {
        for (let heightPos = 0; heightPos < heights.length; heightPos++) {
          cells.push({
            matrixId: matrix.id,
            widthPosition: widthPos,
            heightPosition: heightPos,
            price: 0,
          });
        }
      }

      await tx.matrixCell.createMany({
        data: cells,
      });
    }

    return matrix;
  });

  // Redirect to the matrix editor
  return redirect(`/app/matrices/${newMatrix.id}/edit`);
};

export default function NewMatrix() {
  const { unitPreference, canCreate, hasPaidPlan } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();
  const upgradeFetcher = useFetcher();

  const [name, setName] = useState("");
  const [template, setTemplate] = useState<Template[]>(["small"]);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [showErrors, setShowErrors] = useState(false);

  const isSubmitting = fetcher.state === "submitting" || fetcher.state === "loading";
  const isUpgrading = upgradeFetcher.state === "submitting";
  const actionData = fetcher.data;

  // Handle file drop
  const handleDrop = useCallback(
    (_droppedFiles: File[], acceptedFiles: File[], _rejectedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setCsvContent(content);
        };
        reader.readAsText(file);
      }
    },
    []
  );

  // Get template preview text
  const getTemplatePreview = (selectedTemplate: Template): string => {
    if (selectedTemplate === "custom") {
      return "Empty grid — add your own breakpoints";
    }

    if (selectedTemplate === "csv") {
      return "Upload a CSV file with width, height, and price columns";
    }

    const templateDef = TEMPLATE_BREAKPOINTS_MM[selectedTemplate];
    const values = unitPreference === "cm"
      ? mmToCm(templateDef.widths)
      : templateDef.widths;

    return `Breakpoints: ${values.join(", ")} ${unitPreference}`;
  };

  // Check if we're showing CSV preview
  // After JSON serialization, cells is a plain object (not a Map)
  const preview = actionData && "intent" in actionData && actionData.intent === "preview_csv"
    ? (actionData.preview as Omit<CSVParseResult, "cells"> & { cells: Record<string, number> })
    : null;

  // Reset to upload state
  const resetUpload = () => {
    setCsvContent(null);
    setFileName("");
  };

  return (
    <Page
      title="Create matrix"
      backAction={{ onAction: () => navigate("/app/matrices") }}
    >
      <Layout>
        {/* Free tier limit banner */}
        {!canCreate.allowed && (
          <Layout.Section>
            <Banner
              title="Free plan limit reached"
              tone="warning"
              action={{
                content: "Upgrade",
                onAction: () => {
                  upgradeFetcher.submit(
                    { intent: "upgrade" },
                    { method: "post" }
                  );
                },
                loading: isUpgrading,
              }}
            >
              Your free plan includes 1 matrix. Upgrade to create unlimited matrices.
            </Banner>
          </Layout.Section>
        )}

        {/* Error banner */}
        {actionData && "error" in actionData && (
          <Layout.Section>
            <Banner tone="critical">
              {actionData.error}
            </Banner>
          </Layout.Section>
        )}

        {/* CSV Preview */}
        {preview && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  CSV Preview
                </Text>

                <Banner
                  tone={preview.errors.length > 0 ? "warning" : "success"}
                >
                  {preview.validRows} valid rows, {preview.errors.length} errors found
                  {preview.success && ` • Grid: ${preview.widths.length} × ${preview.heights.length}`}
                </Banner>

                {preview.errors.length > 0 && (
                  <BlockStack gap="200">
                    <Button
                      onClick={() => setShowErrors(!showErrors)}
                      disclosure={showErrors ? "up" : "down"}
                    >
                      {showErrors ? "Hide" : "Show"} errors
                    </Button>
                    <Collapsible
                      open={showErrors}
                      id="csv-errors"
                      transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
                    >
                      <BlockStack gap="200">
                        <List type="bullet">
                          {preview.errors.map((error, idx) => (
                            <List.Item key={idx}>
                              <Text as="span" tone="critical">
                                Row {error.line}: {error.message}
                              </Text>
                            </List.Item>
                          ))}
                        </List>
                      </BlockStack>
                    </Collapsible>
                  </BlockStack>
                )}

                {preview.success && (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{
                      borderCollapse: "collapse",
                      width: "100%",
                      fontSize: "13px",
                    }}>
                      <thead>
                        <tr>
                          <th style={{
                            border: "1px solid #ddd",
                            padding: "8px",
                            backgroundColor: "#f6f6f7",
                            fontWeight: 600,
                          }}>
                            Width / Height
                          </th>
                          {preview.widths.map((width, idx) => (
                            <th key={idx} style={{
                              border: "1px solid #ddd",
                              padding: "8px",
                              backgroundColor: "#f6f6f7",
                              fontWeight: 600,
                            }}>
                              {width}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.heights.map((height, heightIdx) => (
                          <tr key={heightIdx}>
                            <th style={{
                              border: "1px solid #ddd",
                              padding: "8px",
                              backgroundColor: "#f6f6f7",
                              fontWeight: 600,
                            }}>
                              {height}
                            </th>
                            {preview.widths.map((_, widthIdx) => {
                              const cellKey = `${widthIdx},${heightIdx}`;
                              const price = preview.cells[cellKey];
                              return (
                                <td key={widthIdx} style={{
                                  border: "1px solid #ddd",
                                  padding: "8px",
                                  textAlign: "right",
                                }}>
                                  {price !== undefined ? price.toFixed(2) : "-"}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <InlineStack gap="300">
                  <Button onClick={resetUpload}>Cancel</Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      fetcher.submit(
                        { intent: "confirm_csv", name, csvContent: csvContent || "" },
                        { method: "post" }
                      );
                    }}
                    disabled={!preview.success || isSubmitting}
                    loading={isSubmitting}
                  >
                    Create Matrix
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* Main form - hidden when showing preview */}
        {!preview && (
          <>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <TextField
                    label="Matrix name"
                    value={name}
                    onChange={setName}
                    autoComplete="off"
                    maxLength={100}
                    placeholder="e.g., Premium Poster Pricing"
                    helpText="Choose a descriptive name for this pricing matrix"
                    requiredIndicator
                  />

                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">
                      Starting template
                    </Text>
                    <ChoiceList
                      title=""
                      titleHidden
                      choices={[
                        {
                          label: "Small (3 x 3)",
                          value: "small",
                          helpText: "3 x 3 grid — good for simple pricing",
                        },
                        {
                          label: "Medium (5 x 5)",
                          value: "medium",
                          helpText: "5 x 5 grid — more granular pricing",
                        },
                        {
                          label: "Custom",
                          value: "custom",
                          helpText: "Empty grid — add your own breakpoints",
                        },
                        {
                          label: "CSV Import",
                          value: "csv",
                          helpText: "Upload a CSV file with width, height, price columns",
                        },
                      ]}
                      selected={template}
                      onChange={(value) => setTemplate(value as Template[])}
                    />
                    <Text as="p" tone="subdued" variant="bodySm">
                      {getTemplatePreview(template[0])}
                    </Text>
                  </BlockStack>

                  {/* CSV Upload Section */}
                  {template[0] === "csv" && (
                    <BlockStack gap="400">
                      {!hasPaidPlan ? (
                        <Banner
                          title="CSV Import is a paid feature"
                          tone="info"
                          action={{
                            content: "Upgrade",
                            onAction: () => {
                              upgradeFetcher.submit(
                                { intent: "upgrade" },
                                { method: "post" }
                              );
                            },
                            loading: isUpgrading,
                          }}
                        >
                          Import hundreds of prices at once from a CSV file. Upgrade to the Unlimited plan for $12/month.
                        </Banner>
                      ) : (
                        <BlockStack gap="300">
                          <Text as="h4" variant="headingSm">
                            Upload CSV file
                          </Text>
                          <DropZone
                            accept=".csv"
                            type="file"
                            onDrop={handleDrop}
                          >
                            <DropZone.FileUpload
                              actionHint="Accepts .csv files"
                              actionTitle="Add file"
                            />
                          </DropZone>
                          {fileName && (
                            <InlineStack gap="200" blockAlign="center">
                              <Text as="span" variant="bodyMd">
                                Selected: {fileName}
                              </Text>
                              {csvContent && (
                                <Button
                                  variant="primary"
                                  onClick={() => {
                                    fetcher.submit(
                                      { intent: "preview_csv", csvContent },
                                      { method: "post" }
                                    );
                                  }}
                                  loading={isSubmitting}
                                >
                                  Preview
                                </Button>
                              )}
                            </InlineStack>
                          )}
                        </BlockStack>
                      )}
                    </BlockStack>
                  )}
                </BlockStack>
              </Card>
            </Layout.Section>

            {/* Only show Create button for non-CSV templates */}
            {template[0] !== "csv" && (
              <Layout.Section>
                <InlineStack gap="300" align="end">
                  <Button onClick={() => navigate("/app/matrices")}>Cancel</Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      fetcher.submit(
                        { intent: "create", name, template: template[0] },
                        { method: "post" }
                      );
                    }}
                    loading={isSubmitting}
                    disabled={!name.trim() || isSubmitting || !canCreate.allowed}
                  >
                    Create
                  </Button>
                </InlineStack>
              </Layout.Section>
            )}
          </>
        )}
      </Layout>
    </Page>
  );
}
