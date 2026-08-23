"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // 確認メールのリンクを /auth/confirm に着地させ、code をセッションに交換する
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // メール確認が有効な場合はセッションが作成されないため、案内を表示する
    if (!data.session) {
      setMessage(
        "確認メールを送信しました。メール内のリンクから登録を完了してください。"
      );
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-semibold text-zinc-100">
          新規登録
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm text-zinc-400"
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm text-zinc-400"
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="6文字以上"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-emerald-400">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 py-2 font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "登録中..." : "登録する"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-indigo-400 hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
