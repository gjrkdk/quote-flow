import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useRouteError, isRouteErrorResponse } from "@remix-run/react";
import { AppProvider, Page, Card, BlockStack, Text, Button, InlineStack } from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "~/shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ui-nav-menu": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function App() {
  return (
    <AppProvider i18n={{}}>
      <ui-nav-menu>
        <Link to="/app" rel="home">
          Dashboard
        </Link>
        <Link to="/app/settings">Settings</Link>
      </ui-nav-menu>
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  const isAuthError =
    isRouteErrorResponse(error) &&
    (error.status === 401 || error.status === 403);

  const title = isAuthError
    ? "Authentication Error"
    : "Something went wrong";

  const description = isAuthError
    ? "We couldn't verify your session. This usually happens when your session has expired or the app needs to be reinstalled."
    : "We encountered an unexpected error. This usually resolves by trying again.";

  return (
    <AppProvider i18n={{}}>
      <Page title={title}>
        <BlockStack gap="500">
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                {title}
              </Text>
              <Text variant="bodyMd" as="p" tone="subdued">
                {description}
              </Text>
              {!isAuthError && error instanceof Error && (
                <Text variant="bodySm" as="p" tone="subdued">
                  Error: {error.message}
                </Text>
              )}
              <InlineStack gap="300">
                <Button url="/auth/login" variant="primary">
                  Try installing again
                </Button>
                <Button
                  variant="plain"
                  url="mailto:support@example.com"
                  external
                >
                  Contact support
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </BlockStack>
      </Page>
    </AppProvider>
  );
}
