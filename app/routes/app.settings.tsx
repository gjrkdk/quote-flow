import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Select,
  Banner,
  BlockStack,
} from "@shopify/polaris";
import { UnitPreference } from "@prisma/client";
import { authenticate } from "~/shopify.server";
import { prisma } from "~/db.server";
import { useEffect, useState } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Fetch store's current unit preference
  const store = await prisma.store.findUnique({
    where: { shop },
    select: { unitPreference: true },
  });

  return json({
    unitPreference: store?.unitPreference || "mm",
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");
  const unit = formData.get("unit");

  if (intent === "update-unit" && typeof unit === "string") {
    // Validate unit value
    if (unit !== UnitPreference.mm && unit !== UnitPreference.cm) {
      return json({ error: "Invalid unit value" }, { status: 400 });
    }

    // Update store's unit preference
    await prisma.store.update({
      where: { shop },
      data: { unitPreference: unit as UnitPreference },
    });

    return json({ success: true });
  }

  return json({ error: "Invalid request" }, { status: 400 });
};

export default function Settings() {
  const { unitPreference } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Show success banner when save succeeds
  useEffect(() => {
    if (fetcher.data && "success" in fetcher.data && fetcher.data.success) {
      setShowSuccessBanner(true);
      const timer = setTimeout(() => setShowSuccessBanner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [fetcher.data]);

  const handleUnitChange = (value: string) => {
    const formData = new FormData();
    formData.append("intent", "update-unit");
    formData.append("unit", value);
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <Page title="Settings" backAction={{ onAction: () => navigate("/app") }}>
      {showSuccessBanner && (
        <div style={{ marginBottom: "1rem" }}>
          <Banner tone="success" onDismiss={() => setShowSuccessBanner(false)}>
            Settings saved successfully
          </Banner>
        </div>
      )}
      <Layout>
        <Layout.AnnotatedSection
          title="Measurement units"
          description="Choose the unit of measurement for all your pricing matrices. This applies to all matrices in your store."
        >
          <Card>
            <BlockStack gap="400">
              <Select
                label="Unit"
                options={[
                  { label: "Millimeters (mm)", value: "mm" },
                  { label: "Centimeters (cm)", value: "cm" },
                ]}
                value={unitPreference}
                onChange={handleUnitChange}
                disabled={fetcher.state === "submitting"}
              />
            </BlockStack>
          </Card>
        </Layout.AnnotatedSection>
      </Layout>
    </Page>
  );
}
