import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import {
  AppProvider as PolarisAppProvider,
  Button,
  Card,
  FormLayout,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";
import { prisma } from "~/db.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

/**
 * When the shop param is missing, try to recover by looking up the most
 * recently-active store in our DB and redirecting back into the Shopify
 * admin so that the embedded auth flow can start normally.
 *
 * This handles the common dev scenario (HMR reload, tunnel reconnect)
 * and also single-store production installs gracefully.
 */
async function tryAutoRedirect() {
  const store = await prisma.store.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { shop: true },
  });

  if (store) {
    const adminUrl = `https://${store.shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`;
    throw redirect(adminUrl);
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  // If shop param is missing, try auto-recovery before showing the form
  if (!url.searchParams.get("shop")) {
    await tryAutoRedirect();
  }

  const errors = loginErrorMessage(await login(request));

  return { errors };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));

  return { errors };
};

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;

  return (
    <PolarisAppProvider i18n={{}}>
      <Page>
        <Card>
          <Form method="post">
            <FormLayout>
              <Text variant="headingMd" as="h2">
                Log in
              </Text>
              <TextField
                type="text"
                name="shop"
                label="Shop domain"
                helpText="example.myshopify.com"
                value={shop}
                onChange={setShop}
                autoComplete="on"
                error={errors.shop}
              />
              <Button submit>Log in</Button>
            </FormLayout>
          </Form>
        </Card>
      </Page>
    </PolarisAppProvider>
  );
}
