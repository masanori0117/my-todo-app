"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "@/src/components/LogoutButton";
import type {
  CreateTodoRequest,
  ErrorResponse,
  TodoItem,
  TodoResponse,
  TodosResponse,
} from "@/app/api/todos/route";
import type { UpdateTodoRequest } from "@/app/api/todos/[id]/route";

const DEFAULT_ERROR_MESSAGE = "処理に失敗しました。もう一度お試しください。";

const INPUT_CLASS =
  "w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500";

// 未ログイン時（セッション切れなど）は proxy がリダイレクトするため、
// fetch の結果がリダイレクト済み or 401 ならログイン画面へ戻す
const isUnauthorized = (res: Response) => res.redirected || res.status === 401;

const readErrorMessage = async (res: Response) => {
  try {
    const data = (await res.json()) as ErrorResponse;
    return data.error || DEFAULT_ERROR_MESSAGE;
  } catch {
    return DEFAULT_ERROR_MESSAGE;
  }
};

export default function Home() {
  const router = useRouter();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });

    const fetchTodos = async () => {
      try {
        const res = await fetch("/api/todos");
        if (isUnauthorized(res)) {
          router.push("/login");
          return;
        }
        if (!res.ok) {
          setError(await readErrorMessage(res));
          return;
        }
        const data = (await res.json()) as TodosResponse;
        setTodos(data.todos);
      } catch {
        setError(DEFAULT_ERROR_MESSAGE);
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, [router]);

  const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (trimmed === "" || submitting) return;

    setError(null);
    setSubmitting(true);
    try {
      const body: CreateTodoRequest = { title: trimmed };
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (isUnauthorized(res)) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      const data = (await res.json()) as TodoResponse;
      setTodos((prev) => [data.todo, ...prev]);
      setTitle("");
    } catch {
      setError(DEFAULT_ERROR_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (todo: TodoItem) => {
    setError(null);
    try {
      const body: UpdateTodoRequest = { isCompleted: !todo.isCompleted };
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (isUnauthorized(res)) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      const data = (await res.json()) as TodoResponse;
      setTodos((prev) =>
        prev.map((t) => (t.id === data.todo.id ? data.todo : t))
      );
    } catch {
      setError(DEFAULT_ERROR_MESSAGE);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (isUnauthorized(res)) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError(DEFAULT_ERROR_MESSAGE);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-4 py-4">
          <h1 className="shrink-0 text-lg font-semibold">My TODO App</h1>
          <div className="flex min-w-0 items-center gap-3">
            <span className="min-w-0 max-w-[10rem] truncate text-sm text-zinc-400 sm:max-w-xs">
              {email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-lg sm:p-6">
          <form
            onSubmit={handleAdd}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <label htmlFor="new-todo" className="sr-only">
              新しい TODO
            </label>
            <input
              id="new-todo"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="新しい TODO を入力"
              className={`${INPUT_CLASS} flex-1`}
            />
            <button
              type="submit"
              disabled={submitting || title.trim() === ""}
              className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "追加中..." : "追加"}
            </button>
          </form>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <div className="mt-4">
            {loading ? (
              <p className="py-6 text-center text-sm text-zinc-400">
                読み込み中...
              </p>
            ) : todos.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-400">
                TODO はまだありません
              </p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {todos.map((todo) => (
                  <li key={todo.id} className="flex items-center gap-3 py-3">
                    <input
                      type="checkbox"
                      checked={todo.isCompleted}
                      onChange={() => handleToggle(todo)}
                      aria-label={`${todo.title} を${
                        todo.isCompleted ? "未完了" : "完了"
                      }にする`}
                      className="h-4 w-4 shrink-0 cursor-pointer accent-indigo-500"
                    />
                    <span
                      className={`min-w-0 flex-1 break-words ${
                        todo.isCompleted
                          ? "text-zinc-500 line-through"
                          : "text-zinc-100"
                      }`}
                    >
                      {todo.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(todo.id)}
                      aria-label={`${todo.title} を削除`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400"
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="h-4 w-4"
                      >
                        <path d="M3 3l10 10M13 3L3 13" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
