import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Suspense } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-8 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center">
              <Link href="/protected/assessments" className="font-semibold">
                Product Operating Software
              </Link>
              <div className="flex items-center gap-4 text-muted-foreground">
                <Link
                  href="/protected/assessments"
                  className="hover:text-foreground transition-colors"
                >
                  Assessments
                </Link>
                <Link
                  href="/protected/assessments/criteria"
                  className="hover:text-foreground transition-colors"
                >
                  Criteria
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              <Suspense>
                <AuthButton />
              </Suspense>
            </div>
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-8 w-full max-w-5xl p-5">
          {children}
        </div>
      </div>
    </main>
  );
}
