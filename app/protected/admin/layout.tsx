import { Suspense } from "react";
import { AdminNavLink } from "@/components/admin-nav-link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure assessment criteria and manage product managers.
        </p>
      </div>

      <div className="flex border-b border-border">
        <Suspense>
          <AdminNavLink href="/protected/admin/criteria" label="Criteria" />
          <AdminNavLink
            href="/protected/admin/product-managers"
            label="Product Managers"
          />
        </Suspense>
      </div>

      {children}
    </div>
  );
}
