-- CreateEnum
CREATE TYPE "breakpoint_axis" AS ENUM ('width', 'height');

-- CreateEnum
CREATE TYPE "unit_preference" AS ENUM ('mm', 'cm');

-- CreateEnum
CREATE TYPE "gdpr_request_type" AS ENUM ('CUSTOMERS_DATA_REQUEST', 'CUSTOMERS_REDACT', 'SHOP_REDACT');

-- DropForeignKey
ALTER TABLE "Breakpoint" DROP CONSTRAINT "Breakpoint_matrixId_fkey";

-- DropForeignKey
ALTER TABLE "DraftOrderRecord" DROP CONSTRAINT "DraftOrderRecord_matrixId_fkey";

-- DropForeignKey
ALTER TABLE "DraftOrderRecord" DROP CONSTRAINT "DraftOrderRecord_storeId_fkey";

-- DropForeignKey
ALTER TABLE "MatrixCell" DROP CONSTRAINT "MatrixCell_matrixId_fkey";

-- DropForeignKey
ALTER TABLE "PriceMatrix" DROP CONSTRAINT "PriceMatrix_storeId_fkey";

-- DropForeignKey
ALTER TABLE "ProductMatrix" DROP CONSTRAINT "ProductMatrix_matrixId_fkey";

-- DropTable
DROP TABLE "Breakpoint";

-- DropTable
DROP TABLE "DraftOrderRecord";

-- DropTable
DROP TABLE "GdprRequest";

-- DropTable
DROP TABLE "MatrixCell";

-- DropTable
DROP TABLE "PriceMatrix";

-- DropTable
DROP TABLE "ProductMatrix";

-- DropTable
DROP TABLE "Store";

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "access_token" TEXT,
    "api_key_hash" TEXT,
    "api_key_prefix" TEXT,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "unit_preference" "unit_preference" NOT NULL DEFAULT 'mm',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "total_draft_orders_created" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gdpr_requests" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "type" "gdpr_request_type" NOT NULL,
    "payload" JSONB NOT NULL,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gdpr_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_matrices" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_matrices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breakpoints" (
    "id" SERIAL NOT NULL,
    "matrix_id" TEXT NOT NULL,
    "axis" "breakpoint_axis" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "breakpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matrix_cells" (
    "id" SERIAL NOT NULL,
    "matrix_id" TEXT NOT NULL,
    "width_position" INTEGER NOT NULL,
    "height_position" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "matrix_cells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_matrices" (
    "id" SERIAL NOT NULL,
    "matrix_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_title" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_matrices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_order_records" (
    "id" SERIAL NOT NULL,
    "store_id" TEXT NOT NULL,
    "matrix_id" TEXT NOT NULL,
    "shopify_draft_order_id" TEXT NOT NULL,
    "shopify_order_name" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "calculated_price" DOUBLE PRECISION NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draft_order_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stores_shop_key" ON "stores"("shop");

-- CreateIndex
CREATE INDEX "gdpr_requests_shop_idx" ON "gdpr_requests"("shop");

-- CreateIndex
CREATE INDEX "gdpr_requests_type_idx" ON "gdpr_requests"("type");

-- CreateIndex
CREATE INDEX "price_matrices_store_id_idx" ON "price_matrices"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "breakpoints_matrix_id_axis_value_key" ON "breakpoints"("matrix_id", "axis", "value");

-- CreateIndex
CREATE UNIQUE INDEX "matrix_cells_matrix_id_width_position_height_position_key" ON "matrix_cells"("matrix_id", "width_position", "height_position");

-- CreateIndex
CREATE INDEX "product_matrices_matrix_id_idx" ON "product_matrices"("matrix_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_matrices_product_id_key" ON "product_matrices"("product_id");

-- CreateIndex
CREATE INDEX "draft_order_records_store_id_idx" ON "draft_order_records"("store_id");

-- CreateIndex
CREATE INDEX "draft_order_records_matrix_id_idx" ON "draft_order_records"("matrix_id");

-- CreateIndex
CREATE INDEX "draft_order_records_shopify_draft_order_id_idx" ON "draft_order_records"("shopify_draft_order_id");

-- AddForeignKey
ALTER TABLE "price_matrices" ADD CONSTRAINT "price_matrices_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "breakpoints" ADD CONSTRAINT "breakpoints_matrix_id_fkey" FOREIGN KEY ("matrix_id") REFERENCES "price_matrices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matrix_cells" ADD CONSTRAINT "matrix_cells_matrix_id_fkey" FOREIGN KEY ("matrix_id") REFERENCES "price_matrices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_matrices" ADD CONSTRAINT "product_matrices_matrix_id_fkey" FOREIGN KEY ("matrix_id") REFERENCES "price_matrices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_order_records" ADD CONSTRAINT "draft_order_records_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_order_records" ADD CONSTRAINT "draft_order_records_matrix_id_fkey" FOREIGN KEY ("matrix_id") REFERENCES "price_matrices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

