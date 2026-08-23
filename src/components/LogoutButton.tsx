import { signOut } from "@/app/actions/auth";

export function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm transition-colors hover:bg-zinc-800"
      >
        ログアウト
      </button>
    </form>
  );
}
