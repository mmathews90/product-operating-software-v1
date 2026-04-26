import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProductManagers } from "@/lib/actions/product-managers";
import { PMManager } from "@/components/admin/pm-manager";

async function PMContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const productManagers = await getProductManagers();

  return <PMManager productManagers={productManagers} />;
}

export default function AdminProductManagersPage() {
  return (
    <Suspense>
      <PMContent />
    </Suspense>
  );
}
