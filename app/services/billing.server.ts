// Billing plan constants
export const PLAN_NAME = "UNLIMITED_PLAN";
export const PLAN_PRICE = "$12/month";
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
  _request: Request,
): Promise<BillingStatusResult> {
  // TODO: re-enable billing checks when freemium is restored
  return {
    hasActivePayment: true,
    needsUpgrade: false,
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
  _request: Request,
  _currentMatrixCount: number,
): Promise<CanCreateMatrixResult> {
  // TODO: re-enable billing checks when freemium is restored
  return { allowed: true };
}
