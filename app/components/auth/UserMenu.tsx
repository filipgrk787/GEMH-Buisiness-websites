"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-3 pl-3 border-l border-zinc-200">
      <div className="hidden sm:flex items-center gap-2 text-sm">
        <div className="w-8 h-8 rounded-full bg-[#0A3D62] text-white flex items-center justify-center">
          <User size={16} />
        </div>
        <div className="leading-tight">
          <div className="font-medium text-zinc-800">{session.user.name || session.user.email}</div>
          <div className="text-[10px] text-zinc-500">{session.user.email}</div>
        </div>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="btn btn-ghost text-sm px-3 py-1.5 flex items-center gap-1.5"
        title="Sign out"
      >
        <LogOut size={15} />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </div>
  );
}
