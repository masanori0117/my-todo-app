import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { Todo } from "@/generated/prisma/client";
import type {
  ErrorResponse,
  TodoItem,
  TodoResponse,
} from "@/app/api/todos/route";

// ---- API の型定義（画面側は import type で参照する） ----
export type UpdateTodoRequest = { isCompleted: boolean };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

const notFound = () =>
  NextResponse.json<ErrorResponse>(
    { error: "TODO が見つかりません" },
    { status: 404 }
  );

export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/todos/[id]">
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return notFound();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ErrorResponse>(
      { error: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("isCompleted" in body) ||
    typeof body.isCompleted !== "boolean"
  ) {
    return NextResponse.json<ErrorResponse>(
      { error: "isCompleted は真偽値で指定してください" },
      { status: 400 }
    );
  }

  // userId で絞ることで、他ユーザーの TODO は更新対象にならない
  const { count } = await prisma.todo.updateMany({
    where: { id, userId: user.id },
    data: { isCompleted: body.isCompleted },
  });
  if (count === 0) return notFound();

  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) return notFound();

  return NextResponse.json<TodoResponse>({ todo: toTodoItem(todo) });
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext<"/api/todos/[id]">
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return notFound();

  // userId で絞ることで、他ユーザーの TODO は削除対象にならない
  const { count } = await prisma.todo.deleteMany({
    where: { id, userId: user.id },
  });
  if (count === 0) return notFound();

  return new NextResponse(null, { status: 204 });
}
