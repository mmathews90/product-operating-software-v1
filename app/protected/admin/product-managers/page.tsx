import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProductManagers } from "@/lib/actions/product-managers";
import { getPMLevels } from "@/lib/actions/pm-levels";
import { PMManager } from "@/components/admin/pm-manager";

async function PMContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [productManagers, levels] = await Promise.all([
    getProductManagers(),
    getPMLevels(),
  ]);

  return <PMManager productManagers={productManagers} levels={levels} />;
}

export default function AdminProductManagersPage() {
  return (
    <Suspense>
      <PMContent />
    </Suspense>
  );
}
