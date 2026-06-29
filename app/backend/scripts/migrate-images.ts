import "dotenv/config";
import { getSupabase } from "../config/supabase";
import { uploadImage, isBase64DataUrl } from "../services/storage";

async function migrateImages() {
  const supabase = getSupabase();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, imagem")
    .not("imagem", "is", null);

  if (error) {
    console.error("Error fetching products:", error.message);
    process.exit(1);
  }

  const toMigrate = (products as { id: number; imagem: string }[]).filter((p) =>
    isBase64DataUrl(p.imagem)
  );

  if (toMigrate.length === 0) {
    console.log("No base64 images found to migrate.");
    return;
  }

  console.log(`Found ${toMigrate.length} products with base64 images. Migrating...`);

  for (const product of toMigrate) {
    try {
      console.log(`  Product #${product.id}: uploading...`);
      const url = await uploadImage(product.imagem, `product-${product.id}`);

      const { error: updateError } = await supabase
        .from("products")
        .update({ imagem: url })
        .eq("id", product.id);

      if (updateError) {
        console.error(`  Error updating product #${product.id}:`, updateError.message);
      } else {
        console.log(`  Product #${product.id}: migrated -> ${url}`);
      }
    } catch (err) {
      console.error(`  Error migrating product #${product.id}:`, err);
    }
  }

  console.log("\nMigration complete!");
}

migrateImages().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
