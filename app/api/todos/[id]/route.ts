import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  UUID_PATTERN,
  getAuthUser,
  isValidDueDateString,
  notFound,
  toDbDate,
  toTodoItem,
  unauthorized,
} from "@/lib/todos";
import type { ErrorResponse, TodoResponse } from "@/lib/todos";

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

  if (typeof body !== "object" || body === null) {
    return NextResponse.json<ErrorResponse>(
      { error: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  const data: { isCompleted?: boolean; dueDate?: Date | null } = {};

  if ("isCompleted" in body) {
    if (typeof body.isCompleted !== "boolean") {
      return NextResponse.json<ErrorResponse>(
        { error: "isCompleted は真偽値で指定してください" },
        { status: 400 }
      );
    }
    data.isCompleted = body.isCompleted;
  }

  if ("dueDate" in body) {
    if (body.dueDate === null) {
      data.dueDate = null;
    } else if (
      typeof body.dueDate === "string" &&
      isValidDueDateString(body.dueDate)
    ) {
      data.dueDate = toDbDate(body.dueDate);
    } else {
      return NextResponse.json<ErrorResponse>(
        { error: "dueDate は YYYY-MM-DD 形式または null で指定してください" },
        { status: 400 }
      );
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json<ErrorResponse>(
      { error: "更新する項目がありません" },
      { status: 400 }
    );
  }

  // userId で絞ることで、他ユーザーの TODO は更新対象にならない
  const { count } = await prisma.todo.updateMany({
    where: { id, userId: user.id },
    data,
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
