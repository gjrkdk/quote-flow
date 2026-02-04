-- AlterTable: remove unused scope column
ALTER TABLE "Store" DROP COLUMN IF EXISTS "scope";

-- DropIndex: redundant index on shop (already covered by unique constraint)
DROP INDEX IF EXISTS "Store_shop_idx";
