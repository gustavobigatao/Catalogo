import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const BUCKET = "product-images";

function extractBase64Data(dataUrl: string): { buffer: Buffer; ext: string } {
  const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid image data URL");
  let ext = matches[1];
  if (ext === "jpeg") ext = "jpg";
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");
  return { buffer, ext };
}

export function isBase64DataUrl(value: string): boolean {
  return value.startsWith("data:image/");
}

export async function uploadImage(dataUrl: string, fileName: string): Promise<string> {
  const { buffer, ext } = extractBase64Data(dataUrl);
  const filePath = `${fileName}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType: `image/${ext}`,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

export async function deleteImage(publicUrl: string | null | undefined): Promise<void> {
  if (!publicUrl) return;
  if (isBase64DataUrl(publicUrl)) return;
  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split("/");
    const bucketIndex = pathParts.indexOf(BUCKET);
    if (bucketIndex === -1) return;
    const filePath = pathParts.slice(bucketIndex + 1).join("/");
    await supabaseAdmin.storage.from(BUCKET).remove([filePath]);
  } catch {
    // Ignore errors deleting
  }
}
