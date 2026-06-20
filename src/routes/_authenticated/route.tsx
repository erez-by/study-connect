import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { MessageNotifier } from "@/components/MessageNotifier";
import { isUnlocked } from "@/lib/unlock";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    const ok = isUnlocked();
    if (!ok) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    setUnlocked(true);
  }, [navigate]);

  if (!unlocked) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <MessageNotifier />
      <Outlet />
    </div>
  );
}
