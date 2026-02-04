import { Page, Card, Button, BlockStack, Text, InlineStack, List } from "@shopify/polaris";

export default function ErrorPage() {
  return (
    <Page title="Installation Error">
      <BlockStack gap="500">
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h2">
              Something went wrong
            </Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              We couldn't complete the installation. This usually resolves by
              trying again. Common causes include:
            </Text>
            <List type="bullet">
              <List.Item>OAuth authentication failed or was cancelled</List.Item>
              <List.Item>Required permissions were not granted</List.Item>
              <List.Item>Network connection was interrupted</List.Item>
            </List>
            <InlineStack gap="300">
              <Button url="/auth/login" variant="primary">
                Try installing again
              </Button>
              <Button variant="plain" url="mailto:support@example.com" external>
                Contact support
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
