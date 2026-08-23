import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { Todo } from "@/generated/prisma/client";

// ---- API の型定義（画面側は import type で参照する） ----
export type TodoItem = {
  id: string;
  title: string;
  isCompleted: boolean;
  /** ISO 8601 文字列 */
  createdAt: string;
};

export type TodosResponse = { todos: TodoItem[] };
export type CreateTodoRequest = { title: string };
export type TodoResponse = { todo: TodoItem };
export type ErrorResponse = { error: string };

const getAuthUser = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

const toTodoItem = (todo: Todo): TodoItem => ({
  id: todo.id,
  title: todo.title,
  isCompleted: todo.isCompleted,
  createdAt: todo.createdAt.toISOString(),
});

const unauthorized = () =>
  NextResponse.json<ErrorResponse>({ error: "認証が必要です" }, { status: 401 });

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const todos = await prisma.todo.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json<TodosResponse>({ todos: todos.map(toTodoItem) });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ErrorResponse>(
      { error: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  const title =
    typeof body === "object" &&
    body !== null &&
    "title" in body &&
    typeof body.title === "string"
      ? body.title.trim()
      : "";

  if (title === "") {
    return NextResponse.json<ErrorResponse>(
      { error: "タイトルを入力してください" },
      { status: 400 }
    );
  }

  const todo = await prisma.todo.create({
    data: { userId: user.id, title },
  });

  return NextResponse.json<TodoResponse>(
    { todo: toTodoItem(todo) },
    { status: 201 }
  );
}
