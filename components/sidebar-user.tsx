"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SidebarUser({
  email,
  displayName,
  role,
}: {
  email: string;
  displayName?: string;
  role?: string;
}) {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
          <User className="h-4 w-4 shrink-0" />
          <span className="truncate">{displayName ?? email}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuItem onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
