# CLAUDE.md — my-todo-app

Supabase Auth で保護された TODO アプリ。このファイルはプロジェクト固有のルールを定める。
作業前に必ず読み、不明点は実装前に確認すること。

## 使用技術

| 種別 | 技術 | バージョン |
|------|------|-----------|
| フレームワーク | Next.js（App Router） | 16.3.2 |
| UI | React | 19.2 |
| 言語 | TypeScript | 5 |
| スタイリング | Tailwind CSS（`@tailwindcss/postcss`） | 4 |
| 認証 | Supabase Auth（`@supabase/ssr` / `@supabase/supabase-js`） | 0.12 / 2.112 |
| DB アクセス | Prisma + `@prisma/adapter-pg` + pg | 7.9 |

- バージョンは `package.json` を正とする。
- Next.js 16 は従来の `middleware.ts` ではなく `proxy.ts` を使う（末尾の AGENTS.md 参照）。

## ファイル配置ルール

| 置くもの | 場所 |
|----------|------|
| ページ・レイアウト・Route Handler | `app/` |
| 共通 UI コンポーネント | `src/components/` |
| Supabase クライアントなどのユーティリティ | `lib/` |
| Prisma スキーマ・マイグレーション | `prisma/` |
| 静的ファイル | `public/` |

- import はパスエイリアス `@/` を使う（`tsconfig.json` の `@/*` → `./*`）。
- Supabase クライアントは用途で使い分ける：
  - ブラウザ側（Client Component）→ `lib/supabase/client.ts`
  - リクエスト毎のセッション更新・リダイレクト → `lib/supabase/middleware.ts`（`proxy.ts` から呼ぶ）

## コーディングルール

- 関数名・変数名はキャメルケース（例: `handleSubmit`, `fetchTodos`）。React コンポーネント名のみパスカルケース。
- ES modules（`import` / `export`）を使う。`require` は使わない。
- import は分割して書く（例: `import { createClient } from "@/lib/supabase/client"`）。
- Server Component を基本とし、`"use client"` はフォーム入力やイベント処理など必要最小限の範囲に留める。
- 認証チェック（未ログイン → `/login`、ログイン済み → `/`）は `proxy.ts` に集約し、各ページで重複実装しない。
- サーバー側でのユーザー取得は `getUser()` を使う（`getSession()` はトークンを検証しないため使わない）。
- スタイルは Tailwind のユーティリティクラスで書き、独自 CSS は `app/globals.css` に最小限だけ置く。

## 禁止事項

- `any` を使わない（型が不明な場合は `unknown` で受けて絞り込む）。
- `console.log` を残さない。
- `.env` などの秘密情報をコミットしない（`.gitignore` 済み）。
- モック・ダミー実装を勝手に入れない（必要なら事前に確認する）。
- 指示にない機能・ファイルを追加しない。

## 補足情報

- API のベース URL は `/api` で始まる。Route Handler は `app/api/**/route.ts` に置く。
- 使用する環境変数（値は `.env` にのみ置く）：
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `DIRECT_URL`（Prisma CLI 用の直接接続）
- 型チェックは `npx tsc --noEmit`、Lint は `npm run lint` で行う。

@AGENTS.md
