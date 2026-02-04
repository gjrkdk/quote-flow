import type { ActionFunctionArgs } from "@remix-run/node";
import type { Prisma } from "@prisma/client";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  if (
    topic === "CUSTOMERS_DATA_REQUEST" ||
    topic === "CUSTOMERS_REDACT" ||
    topic === "SHOP_REDACT"
  ) {
    await prisma.gdprRequest.create({
      data: {
        shop,
        type: topic,
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
        where: { shop, type: "CUSTOMERS_REDACT", processedAt: null },
        data: { processedAt: new Date() },
      });
      break;

    case "SHOP_REDACT":
      await prisma.store.deleteMany({ where: { shop } });
      await prisma.gdprRequest.updateMany({
        where: { shop, type: "SHOP_REDACT", processedAt: null },
        data: { processedAt: new Date() },
      });
      break;

    case "APP_UNINSTALLED":
      // Keep store data for potential reinstall.
      break;
  }

  return new Response(null, { status: 200 });
};
