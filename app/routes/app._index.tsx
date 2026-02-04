import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useActionData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Button,
  InlineStack,
  Banner,
  TextField,
  Modal,
  Toast,
  Frame,
} from "@shopify/polaris";
import { useEffect, useState, useCallback } from "react";
import { authenticate } from "~/shopify.server";
import { ensureStoreExists } from "~/hooks/afterInstall.server";
import { prisma } from "~/db.server";
import {
  generateApiKey,
  hashApiKey,
  getApiKeyPrefix,
} from "~/utils/api-key.server";

interface ActionResponse {
  success: boolean;
  message: string;
  newApiKey: string | null;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const { store, isNewInstall, apiKey } = await ensureStoreExists(
    session.shop,
    session.accessToken ?? "",
  );

  return json({
    store: {
      id: store.id,
      shop: store.shop,
      apiKeyPrefix: store.apiKeyPrefix,
      onboardingCompleted: store.onboardingCompleted,
    },
    newApiKey: isNewInstall ? apiKey ?? null : null,
  });
};

export const action = async ({
  request,
}: ActionFunctionArgs): Promise<ReturnType<typeof json<ActionResponse>>> => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "dismiss-welcome") {
    await prisma.store.update({
      where: { shop: session.shop },
      data: { onboardingCompleted: true },
    });
    return json({ success: true, message: "Welcome dismissed", newApiKey: null });
  }

  if (intent === "regenerate-key") {
    const newApiKey = generateApiKey();

    await prisma.store.update({
      where: { shop: session.shop },
      data: {
        apiKeyHash: hashApiKey(newApiKey),
        apiKeyPrefix: getApiKeyPrefix(newApiKey),
      },
    });

    return json({
      success: true,
      message: "API key regenerated",
      newApiKey,
    });
  }

  return json({ success: false, message: "Invalid action", newApiKey: null });
};

export default function Index() {
  const { store, newApiKey } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  const [visibleApiKey, setVisibleApiKey] = useState<string | null>(newApiKey);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (actionData?.success) {
      setToastMessage(actionData.message);
      if (actionData.newApiKey) {
        setVisibleApiKey(actionData.newApiKey);
        setShowRegenerateModal(false);
      }
    }
  }, [actionData]);

  const handleDismissWelcome = useCallback(() => {
    submit({ intent: "dismiss-welcome" }, { method: "post" });
  }, [submit]);

  const handleCopyApiKey = useCallback(() => {
    if (visibleApiKey) {
      navigator.clipboard.writeText(visibleApiKey);
      setToastMessage("API key copied to clipboard");
    }
  }, [visibleApiKey]);

  const handleRegenerateKey = useCallback(() => {
    submit({ intent: "regenerate-key" }, { method: "post" });
  }, [submit]);

  const maskedKey = store.apiKeyPrefix
    ? `${store.apiKeyPrefix}${"*".repeat(60)}`
    : "No API key";

  return (
    <Frame>
      <Page title="Dashboard">
        <Layout>
          {!store.onboardingCompleted && (
            <Layout.Section>
              <Banner
                title="You're all set! Here's how to get started"
                onDismiss={handleDismissWelcome}
              >
                <BlockStack gap="200">
                  <Text as="p">
                    Welcome to Price Matrix! Follow these steps to start
                    offering dimension-based pricing:
                  </Text>
                  <BlockStack gap="100">
                    <Text as="p">
                      1. Create your first pricing matrix below
                    </Text>
                    <Text as="p">
                      2. Copy your API key from the section below
                    </Text>
                    <Text as="p">
                      3. Add the widget to your storefront
                    </Text>
                  </BlockStack>
                  <Text as="p">
                    <a
                      href="https://shopify.dev/docs/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View documentation
                    </a>
                  </Text>
                </BlockStack>
              </Banner>
            </Layout.Section>
          )}

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    API Key
                  </Text>
                  <Text as="p" tone="subdued">
                    Use this key to authenticate API requests from your
                    storefront.
                  </Text>
                </BlockStack>

                {visibleApiKey ? (
                  <BlockStack gap="300">
                    <Banner tone="warning">
                      <Text as="p">
                        Save this key now — you won't be able to see it again.
                        If you lose it, you'll need to regenerate a new one.
                      </Text>
                    </Banner>
                    <TextField
                      label="API Key"
                      value={visibleApiKey}
                      readOnly
                      autoComplete="off"
                      labelHidden
                    />
                    <InlineStack gap="200">
                      <Button onClick={handleCopyApiKey}>Copy Key</Button>
                      <Button onClick={() => setVisibleApiKey(null)}>
                        Hide Key
                      </Button>
                    </InlineStack>
                  </BlockStack>
                ) : (
                  <BlockStack gap="300">
                    <TextField
                      label="API Key"
                      value={maskedKey}
                      readOnly
                      autoComplete="off"
                      labelHidden
                    />
                    <InlineStack gap="200">
                      <Button onClick={() => setShowRegenerateModal(true)}>
                        Regenerate Key
                      </Button>
                    </InlineStack>
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Pricing Matrices
                  </Text>
                  <Text as="p" tone="subdued">
                    No pricing matrices yet. Create your first matrix to start
                    offering dimension-based pricing on your products.
                  </Text>
                </BlockStack>
                <InlineStack align="start">
                  <Button variant="primary">Create Matrix</Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Modal
          open={showRegenerateModal}
          onClose={() => setShowRegenerateModal(false)}
          title="Regenerate API Key"
          primaryAction={{
            content: "Regenerate",
            onAction: handleRegenerateKey,
            destructive: true,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: () => setShowRegenerateModal(false),
            },
          ]}
        >
          <Modal.Section>
            <BlockStack gap="200">
              <Text as="p">
                This will generate a new API key and invalidate your current
                key.
              </Text>
              <Text as="p" tone="critical">
                Any storefront using the old key will stop working until you
                update it with the new key.
              </Text>
            </BlockStack>
          </Modal.Section>
        </Modal>

        {toastMessage && (
          <Toast
            content={toastMessage}
            onDismiss={() => setToastMessage(null)}
            duration={3000}
          />
        )}
      </Page>
    </Frame>
  );
}
