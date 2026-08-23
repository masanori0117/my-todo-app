import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FAILURE_PATH = "/login?error=confirm";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  // オープンリダイレクト防止: アプリ内パスのみ許可
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  const supabase = await createClient();

  // カスタムテンプレート（token_hash）方式
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      redirect(FAILURE_PATH);
    }
    redirect(next);
  }

  // デフォルトテンプレート（PKCE code）方式: signUp の emailRedirectTo 経由で届く
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      redirect(FAILURE_PATH);
    }
    redirect(next);
  }

  redirect(FAILURE_PATH);
}
