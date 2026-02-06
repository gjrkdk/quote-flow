import type { ActionFunctionArgs } from "@remix-run/node";
import { GdprRequestType, type Prisma } from "@prisma/client";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
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
      // Shopify requires acknowledgement; customer data collection
      // will be implemented when the app stores customer-specific data.
      break;

    case "CUSTOMERS_REDACT":
      await prisma.gdprRequest.updateMany({
        where: { shop, type: GdprRequestType.CUSTOMERS_REDACT, processedAt: null },
        data: { processedAt: new Date() },
      });
      break;

    case "SHOP_REDACT":
      await prisma.store.deleteMany({ where: { shop } });
      await prisma.gdprRequest.updateMany({
        where: { shop, type: GdprRequestType.SHOP_REDACT, processedAt: null },
        data: { processedAt: new Date() },
      });
      break;

    case "APP_UNINSTALLED":
      // Keep store data for potential reinstall.
      break;
  }

  return new Response(null, { status: 200 });
};
