import type { ActionFunctionArgs } from "@remix-run/node";
import { GdprRequestType, type Prisma } from "@prisma/client";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";
import { enqueueJob } from "~/services/job-queue.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const startTime = Date.now();
  const { topic, shop, payload } = await authenticate.webhook(request);

  const gdprTopicMap: Record<string, GdprRequestType> = {
    CUSTOMERS_DATA_REQUEST: GdprRequestType.CUSTOMERS_DATA_REQUEST,
    CUSTOMERS_REDACT: GdprRequestType.CUSTOMERS_REDACT,
    SHOP_REDACT: GdprRequestType.SHOP_REDACT,
  };

  const gdprType = gdprTopicMap[topic];
  if (gdprType) {
    await prisma.gdprRequest.create({
      data: {
        shop,
        type: gdprType,
        payload: payload as Prisma.InputJsonValue,
      },
    });
  }

  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST":
      // App does not store customer-specific data. Acknowledge receipt per Shopify requirements.
      break;

    case "CUSTOMERS_REDACT":
      // Enqueue async job for GDPR deletion (processed by Vercel Cron)
      await enqueueJob("customer_redact", { shop });
      break;

    case "SHOP_REDACT":
      // Enqueue async job for GDPR deletion (processed by Vercel Cron)
      await enqueueJob("shop_redact", { shop });
      break;

    case "APP_UNINSTALLED":
      // Keep store data for potential reinstall.
      break;
  }

  console.log(`[Webhook] ${topic} processed in ${Date.now() - startTime}ms`);
  return new Response(null, { status: 200 });
};
