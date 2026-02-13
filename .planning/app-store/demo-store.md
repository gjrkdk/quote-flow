# Test Store Credentials: Price Matrix App

**Purpose:** Provide Shopify App Store reviewers with complete access to test the Price Matrix app functionality.

**Last Updated:** 2026-02-12

---

## Store Access

**Store URL:** https://dynamic-pricing-demo.myshopify.com

**Admin Credentials:**
- **Email:** [FILL_IN]
- **Password:** [FILL_IN]

**Notes:**
- App is already installed on this development store (installed during Phase 9 development)
- Store has been set up with test data for evaluation
- 14-day billing trial is active (no charges during review)

---

## App Installation Verification

1. Log in to admin at: https://dynamic-pricing-demo.myshopify.com/admin
2. Navigate to **Apps** section in left sidebar
3. Confirm **Price Matrix** appears in installed apps list
4. Click **Price Matrix** to open the embedded app

Expected: App loads successfully within Shopify Admin interface

---

## API Access Information

The app includes a REST API for headless storefronts. API keys can be accessed within the app:

1. Open Price Matrix app
2. Navigate to **Settings** page
3. Copy the **API Key** displayed in the credentials section

**Base API URL:** https://quote-flow-one.vercel.app/api

**Note:** API endpoints are documented in the app's Settings page under "API Documentation"

---

## Test Scenarios

### Scenario 1: Create and Assign a Price Matrix

**Purpose:** Verify basic matrix creation and product assignment functionality

**Steps:**
1. Open Price Matrix app
2. Navigate to **Matrices** page
3. Click **Create Matrix** button
4. Enter matrix name: "Test Print Sizes"
5. Select units: **Centimeters (cm)**
6. Create a 3x3 grid:
   - Width breakpoints: 10, 20, 30
   - Height breakpoints: 10, 20, 30
   - Fill in sample prices (e.g., $10, $15, $20, $25, $30, $35, $40, $45, $50)
7. Click **Save Matrix**
8. Navigate to **Products** tab
9. Click **Assign Products** button
10. Use Shopify resource picker to select a product
11. Click **Save**

**Expected Outcome:**
- Matrix saves successfully
- Product assignment shows the selected product
- Product now has dimension-based pricing available

---

### Scenario 2: Create Option Groups with Modifiers

**Purpose:** Verify option groups feature (v1.2) with both fixed and percentage modifiers

**Steps:**
1. Navigate to **Option Groups** page
2. Click **Create Option Group** button
3. Enter name: "Finish Type"
4. Select type: **REQUIRED**
5. Add choices:
   - Choice 1: Label "Matte", Modifier Type "FIXED", Value "1000" (represents $10.00)
   - Choice 2: Label "Glossy", Modifier Type "PERCENTAGE", Value "15" (represents 15%)
6. Click **Save Option Group**
7. Navigate to **Products** tab
8. Click **Assign to Products**
9. Select the same product from Scenario 1
10. Click **Save**

**Expected Outcome:**
- Option group saves successfully with 2 choices
- Product assignment shows the option group is assigned
- Product now has both dimension pricing and option modifiers

---

### Scenario 3: Fetch Price via REST API

**Purpose:** Verify REST API functionality with dimensions and options

**Prerequisites:** API Key from Settings page, product ID from previous scenarios

**Steps:**
1. Get API key from Settings page
2. Find Shopify product ID (format: gid://shopify/Product/{numeric-id})
3. Use API testing tool (Postman/curl) to make request:

```bash
curl -X POST https://quote-flow-one.vercel.app/api/calculate-price \
  -H "X-API-Key: [YOUR_API_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "gid://shopify/Product/[NUMERIC_ID]",
    "dimensions": {
      "width": 15,
      "height": 15
    },
    "options": [
      {
        "optionGroupId": "[OPTION_GROUP_ID_FROM_STEP_2]",
        "choiceId": "[CHOICE_ID_FOR_MATTE]"
      }
    ]
  }'
```

**Expected Outcome:**
- API returns 200 OK status
- Response includes:
  - `price`: Calculated price for 15x15 dimensions (rounds up to 20x20 cell)
  - `basePrice`: Original matrix price
  - `optionModifiers`: Array with Matte finish modifier applied (+$10.00)
  - `dimensions`: Echo of input dimensions
  - `selectedOptions`: Array with selected choices

---

### Scenario 4: Create Draft Order with Options

**Purpose:** Verify Draft Order creation with dimension pricing and option modifiers

**Steps:**
1. Use REST API or embedded widget (if available on storefront)
2. Make request to create draft order:

```bash
curl -X POST https://quote-flow-one.vercel.app/api/create-draft-order \
  -H "X-API-Key: [YOUR_API_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "gid://shopify/Product/[NUMERIC_ID]",
    "dimensions": {
      "width": 25,
      "height": 25
    },
    "options": [
      {
        "optionGroupId": "[OPTION_GROUP_ID]",
        "choiceId": "[CHOICE_ID_FOR_GLOSSY]"
      }
    ],
    "quantity": 1
  }'
```

3. Navigate to **Orders** > **Draft Orders** in Shopify Admin
4. Locate the newly created draft order

**Expected Outcome:**
- API returns draft order ID
- Draft order appears in Shopify Admin
- Line item includes:
  - Custom product with calculated price
  - Custom attributes showing dimensions (Width: 25cm, Height: 25cm)
  - Custom attributes showing selected options (Finish Type: Glossy)
  - Total price = base price (from 30x30 cell) + 15% modifier

---

### Scenario 5: GDPR Webhook Testing (Optional)

**Purpose:** Verify compliance webhook handling (required for App Store)

**Steps:**
1. Navigate to Shopify Partner Dashboard
2. Go to Apps > Price Matrix > Settings
3. Use webhook testing tool to send test GDPR webhooks:
   - `customers/data_request`
   - `customers/redact`
   - `shop/redact`

**Expected Outcome:**
- All webhooks return 200 OK within 200ms
- Webhook events are logged in app database (GdprRequest model)
- Async job queue processes deletions for `customers/redact` and `shop/redact`

---

## Data Setup Notes

The test store includes:

- **Products:** 5-10 sample products across different categories (art prints, fabric, custom items)
- **Matrices:** 2-3 pre-configured price matrices with various grid sizes
- **Option Groups:** 2-3 option groups demonstrating FIXED and PERCENTAGE modifiers
- **Assignments:** Products have both matrices and option groups assigned

**Test data is realistic:** Prices reflect typical custom product ranges, dimensions use common units (cm), option groups represent real-world customization choices

---

## Troubleshooting

### Issue: API returns 401 Unauthorized
**Solution:** Verify API key is correct (copy from Settings page), ensure `X-API-Key` header is included

### Issue: Product picker shows no products
**Solution:** Store may need products created. Navigate to Shopify Admin > Products and add test products

### Issue: Widget not appearing on storefront
**Solution:** App is designed for headless storefronts. Widget requires manual integration via React component or REST API

### Issue: Draft Order creation fails
**Solution:** Verify product has a price matrix assigned, dimensions are within breakpoint ranges, option groups (if used) are assigned to product

---

## Contact for Questions

If reviewers encounter issues during testing:

**Developer Contact:** robinkonijnendijk@gmail.com
**Response Time:** Within 24 hours

---

## Security & Privacy Notes

- **No customer PII stored:** App does not store customer data beyond what's required for draft orders (handled by Shopify)
- **GDPR compliant:** All required webhooks implemented with async processing
- **Billing trial:** 14-day free trial active, no charges during review period
- **Data deletion:** `shop/redact` webhook fully deletes all store data from app database
- **API authentication:** All API endpoints require valid API key authentication

---

**Placeholder Notice:** This document contains `[FILL_IN]` placeholders for sensitive credentials. These MUST be populated with actual working credentials before submission to Shopify App Store.
