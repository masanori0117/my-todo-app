import type { TodoItem } from "@/lib/todos";

type DueStatus = "overdue" | "soon" | "normal";

// この日数以内（当日含む）は「期限が近い」として警告表示する
const SOON_THRESHOLD_DAYS = 3;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// "YYYY-MM-DD" をローカルタイム 0:00 の Date にする
const parseDueDateLocal = (dueDate: string): Date => {
  const [year, month, day] = dueDate.split("-").map(Number);
  return new Date(year, month - 1, day);
};

// 今日（ローカル）0:00 から見た残り日数。0 = 今日、負 = 期限超過
const diffDaysFromToday = (dueDate: string): number => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round(
    (parseDueDateLocal(dueDate).getTime() - today.getTime()) / MS_PER_DAY
  );
};

export const getDueStatus = (dueDate: string): DueStatus => {
  const diff = diffDaysFromToday(dueDate);
  if (diff < 0) return "overdue";
  if (diff <= SOON_THRESHOLD_DAYS) return "soon";
  return "normal";
};

export const formatDueDate = (dueDate: string): string => {
  const diff = diffDaysFromToday(dueDate);
  if (diff < 0) return `${-diff}日超過`;
  if (diff === 0) return "今日";
  if (diff === 1) return "明日";
  const date = parseDueDateLocal(dueDate);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

// サーバー側 orderBy（未完了優先 → 期限昇順・なしは後ろ → 作成日降順）と同一規則
const compareTodos = (a: TodoItem, b: TodoItem): number => {
  if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
  if (a.dueDate !== b.dueDate) {
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
  return 0;
};

export const sortTodos = (todos: TodoItem[]): TodoItem[] =>
  [...todos].sort(compareTodos);
