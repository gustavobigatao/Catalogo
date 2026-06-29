import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = "product-images";

async function setupStorage() {
  console.log(`Creating bucket "${BUCKET}"...`);

  const { data: existing, error: listError } = await supabaseAdmin.storage.getBucket(BUCKET);
  if (existing) {
    console.log(`Bucket "${BUCKET}" already exists.`);
  } else {
    const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
      public: true,
    });
    if (error) {
      console.error("Error creating bucket:", error.message);
      process.exit(1);
    }
    console.log(`Bucket "${BUCKET}" created successfully!`);
  }

  console.log("\nSetup complete! Add the real SUPABASE_SERVICE_ROLE_KEY to your .env file.");
}

setupStorage().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
