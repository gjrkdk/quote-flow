import { authenticate } from "~/shopify.server";

// Billing plan constants
export const PLAN_NAME = "UNLIMITED_PLAN";
export const PLAN_PRICE = "$12/month";
export const FREE_MATRIX_LIMIT = 1;
export const PLAN_FEATURES = ["Unlimited matrices", "CSV import"];

interface BillingStatusResult {
  hasActivePayment: boolean;
  needsUpgrade: boolean;
}

interface RequirePaidPlanResult {
  needsUpgrade: boolean;
  plan?: string;
  price?: string;
  features?: string[];
}

interface CanCreateMatrixResult {
  allowed: boolean;
  reason?: "free_limit";
  limit?: number;
}

/**
 * Check if the store has an active paid plan subscription
 */
export async function checkBillingStatus(
  request: Request,
): Promise<BillingStatusResult> {
  const { billing } = await authenticate.admin(request);

  const { hasActivePayment } = await billing.check({
    plans: [PLAN_NAME],
    isTest: process.env.NODE_ENV !== "production",
  });

  return {
    hasActivePayment,
    needsUpgrade: !hasActivePayment,
  };
}

/**
 * Check if store has paid plan, return upgrade details if not
 */
export async function requirePaidPlan(
  request: Request,
): Promise<RequirePaidPlanResult> {
  const { hasActivePayment, needsUpgrade } = await checkBillingStatus(request);

  if (!hasActivePayment) {
    return {
      needsUpgrade: true,
      plan: PLAN_NAME,
      price: PLAN_PRICE,
      features: PLAN_FEATURES,
    };
  }

  return {
    needsUpgrade: false,
  };
}

/**
 * Check if store can create a new matrix based on current count and billing status
 */
export async function canCreateMatrix(
  request: Request,
  currentMatrixCount: number,
): Promise<CanCreateMatrixResult> {
  // Free tier allows 1 matrix
  if (currentMatrixCount < FREE_MATRIX_LIMIT) {
    return { allowed: true };
  }

  // Check if they have paid plan for unlimited matrices
  const { hasActivePayment } = await checkBillingStatus(request);

  if (hasActivePayment) {
    return { allowed: true };
  }

  // Free tier limit reached
  return {
    allowed: false,
    reason: "free_limit",
    limit: FREE_MATRIX_LIMIT,
  };
}
