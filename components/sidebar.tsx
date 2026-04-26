import { ThemeSwitcher } from "@/components/theme-switcher";
import { SidebarNavLink } from "@/components/sidebar-nav-link";
import { SidebarUserServer } from "@/components/sidebar-user-server";
import { Separator } from "@/components/ui/separator";
import { ClipboardList, LayoutDashboard, Settings } from "lucide-react";
import { Suspense } from "react";

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-border flex flex-col h-screen sticky top-0">
      <div className="p-5 flex items-center justify-between">
        <span className="font-semibold text-sm">Product Operating Software</span>
        <ThemeSwitcher />
      </div>

      <Separator />

      <nav className="flex-1 flex flex-col p-3">
        <Suspense>
          <SidebarNavLink
            href="/protected"
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="Dashboard"
            exact
          />
        </Suspense>
        <Suspense>
          <SidebarNavLink
            href="/protected/assessments"
            icon={<ClipboardList className="h-4 w-4" />}
            label="Assessments"
          />
        </Suspense>
      </nav>

      <Separator />

      <div className="flex flex-col gap-1 p-3">
        <Suspense>
          <SidebarNavLink
            href="/protected/admin"
            icon={<Settings className="h-4 w-4" />}
            label="Admin"
          />
        </Suspense>
      </div>

      <Separator />

      <div className="p-3">
        <Suspense>
          <SidebarUserServer />
        </Suspense>
      </div>
    </aside>
  );
}
