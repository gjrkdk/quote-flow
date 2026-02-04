import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, useActionData, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  TextField,
  ChoiceList,
  PageActions,
  Banner,
  BlockStack,
  Text,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "~/shopify.server";
import { prisma } from "~/db.server";

type Template = "small" | "medium" | "custom";

interface TemplateDefinition {
  widths: number[];
  heights: number[];
}

// Template definitions with breakpoint values in mm
const TEMPLATE_BREAKPOINTS_MM: Record<Exclude<Template, "custom">, TemplateDefinition> = {
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
    select: { unitPreference: true },
  });

  return json({
    unitPreference: store?.unitPreference || "mm",
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const formData = await request.formData();
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
      const widths = store.unitPreference === "cm"
        ? mmToCm(templateDef.widths)
        : templateDef.widths;
      const heights = store.unitPreference === "cm"
        ? mmToCm(templateDef.heights)
        : templateDef.heights;

      // 3. Create width breakpoints
      const widthBreakpoints = widths.map((value, index) => ({
        matrixId: matrix.id,
        axis: "width",
        value,
        position: index,
      }));

      // 4. Create height breakpoints
      const heightBreakpoints = heights.map((value, index) => ({
        matrixId: matrix.id,
        axis: "height",
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
  const { unitPreference } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const [name, setName] = useState("");
  const [template, setTemplate] = useState<Template[]>(["small"]);

  const isSubmitting = navigation.state === "submitting";

  // Get template preview text
  const getTemplatePreview = (selectedTemplate: Template): string => {
    if (selectedTemplate === "custom") {
      return "Empty grid — add your own breakpoints";
    }

    const templateDef = TEMPLATE_BREAKPOINTS_MM[selectedTemplate];
    const values = unitPreference === "cm"
      ? mmToCm(templateDef.widths)
      : templateDef.widths;

    return `Breakpoints: ${values.join(", ")} ${unitPreference}`;
  };

  return (
    <Page
      title="Create matrix"
      backAction={{ url: "/app/matrices" }}
    >
      <Form method="post">
        <Layout>
          {actionData && "error" in actionData && (
            <Layout.Section>
              <Banner tone="critical">
                {actionData.error}
              </Banner>
            </Layout.Section>
          )}

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <TextField
                  label="Matrix name"
                  value={name}
                  onChange={setName}
                  name="name"
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
                    ]}
                    selected={template}
                    onChange={(value) => setTemplate(value as Template[])}
                    name="template"
                  />
                  <Text as="p" tone="subdued" variant="bodySm">
                    {getTemplatePreview(template[0])}
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <PageActions
          primaryAction={{
            content: "Create",
            submit: true,
            loading: isSubmitting,
            disabled: !name.trim() || isSubmitting,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              url: "/app/matrices",
            },
          ]}
        />
      </Form>
    </Page>
  );
}
