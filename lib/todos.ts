import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Todo } from "@/generated/prisma/client";

// ---- API の型定義（画面側は import type で参照する） ----
export type TodoItem = {
  id: string;
  title: string;
  isCompleted: boolean;
  /** "YYYY-MM-DD"。期限なしは null */
  dueDate: string | null;
  /** ISO 8601 文字列 */
  createdAt: string;
};

export type TodosResponse = { todos: TodoItem[] };
export type CreateTodoRequest = { title: string; dueDate?: string | null };
export type UpdateTodoRequest = { isCompleted?: boolean; dueDate?: string | null };
export type TodoResponse = { todo: TodoItem };
export type ErrorResponse = { error: string };

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DUE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// "YYYY-MM-DD" を UTC 深夜の Date に変換する（@db.Date 保存用。サーバーの TZ に依存させない）
export const toDbDate = (dueDate: string): Date =>
  new Date(`${dueDate}T00:00:00.000Z`);

// 形式チェックに加え、往復一致で 2025-02-30 のような存在しない日付も弾く
export const isValidDueDateString = (value: string): boolean =>
  DUE_DATE_PATTERN.test(value) &&
  toDbDate(value).toISOString().slice(0, 10) === value;

export const getAuthUser = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

export const toTodoItem = (todo: Todo): TodoItem => ({
  id: todo.id,
  title: todo.title,
  isCompleted: todo.isCompleted,
  dueDate: todo.dueDate ? todo.dueDate.toISOString().slice(0, 10) : null,
  createdAt: todo.createdAt.toISOString(),
});

export const unauthorized = () =>
  NextResponse.json<ErrorResponse>({ error: "認証が必要です" }, { status: 401 });

export const notFound = () =>
  NextResponse.json<ErrorResponse>(
    { error: "TODO が見つかりません" },
    { status: 404 }
  );
