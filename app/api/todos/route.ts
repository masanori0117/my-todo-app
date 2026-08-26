import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser,
  isValidDueDateString,
  toDbDate,
  toTodoItem,
  unauthorized,
} from "@/lib/todos";
import type { ErrorResponse, TodoResponse, TodosResponse } from "@/lib/todos";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const todos = await prisma.todo.findMany({
    where: { userId: user.id },
    orderBy: [
      { isCompleted: "asc" },
      { dueDate: { sort: "asc", nulls: "last" } },
      { createdAt: "desc" },
    ],
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

  const rawDueDate =
    typeof body === "object" && body !== null && "dueDate" in body
      ? body.dueDate
      : null;

  let dueDate: Date | null = null;
  if (typeof rawDueDate === "string" && rawDueDate !== "") {
    if (!isValidDueDateString(rawDueDate)) {
      return NextResponse.json<ErrorResponse>(
        { error: "期限は YYYY-MM-DD 形式で指定してください" },
        { status: 400 }
      );
    }
    dueDate = toDbDate(rawDueDate);
  } else if (rawDueDate !== null && rawDueDate !== undefined && rawDueDate !== "") {
    return NextResponse.json<ErrorResponse>(
      { error: "期限は YYYY-MM-DD 形式で指定してください" },
      { status: 400 }
    );
  }

  const todo = await prisma.todo.create({
    data: { userId: user.id, title, dueDate },
  });

  return NextResponse.json<TodoResponse>(
    { todo: toTodoItem(todo) },
    { status: 201 }
  );
}
