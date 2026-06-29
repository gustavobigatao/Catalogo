import nodemailer from "nodemailer";
import { getSupabase } from "../config/supabase";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

const transporter = SMTP_HOST && SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

export async function checkAndNotifyLowStock() {
  if (!transporter || !ADMIN_EMAIL) {
    console.warn("[stockAlert] SMTP not configured, skipping notification");
    return;
  }

  const supabase = getSupabase();
  const { data: products, error } = await supabase
    .from("products")
    .select("nome, quantidade_estoque, numero_produto")
    .lte("quantidade_estoque", 2);

  if (error) {
    console.error("[stockAlert] Error fetching low stock products:", error);
    return;
  }

  if (!products || products.length === 0) return;

  const productList = (products as { nome: string; quantidade_estoque: number; numero_produto: string }[])
    .map(p => `  • ${p.nome} (#${p.numero_produto}) — ${p.quantidade_estoque} un.`)
    .join("\n");

  try {
    await transporter.sendMail({
      from: `"Premium Catalog" <${SMTP_USER}>`,
      to: ADMIN_EMAIL,
      subject: `[Alerta] Estoque baixo — ${products.length} produto(s)`,
      text: `Os seguintes produtos estão com estoque baixo (≤2 unidades):\n\n${productList}\n\nAcesse o painel admin para reabastecer.`,
    });
    console.log(`[stockAlert] Email sent to ${ADMIN_EMAIL} about ${products.length} product(s)`);
  } catch (err) {
    console.error("[stockAlert] Error sending email:", err);
  }
}
