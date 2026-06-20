import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import {
  ensureNotifyPermission,
  playPing,
  primeAudio,
  showNotification,
} from "@/lib/notify";

/**
 * Polls for newly received messages and, when the relevant chat isn't open and
 * focused, plays a subtle sound and fires a browser notification.
 * Renders nothing — mount once inside the authenticated layout.
 */
export function MessageNotifier() {
  const { user } = useSession();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    // Only alert on messages that arrive after this component mounts.
    let lastSeen = new Date().toISOString();

    const prime = () => primeAudio();
    window.addEventListener("pointerdown", prime, { once: true });
    ensureNotifyPermission();

    async function tick() {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("receiver_id", userId!)
        .gt("created_at", lastSeen)
        .order("created_at", { ascending: true });
      if (cancelled || !data?.length) return;
      lastSeen = data[data.length - 1].created_at;

      const path = window.location.pathname;
      const focused = document.visibilityState === "visible";
      // Skip alerts for the chat that's currently open and focused.
      const relevant = data.filter(
        (m) => !(focused && path.endsWith(`/chat/${m.sender_id}`)),
      );
      if (!relevant.length) return;

      playPing();

      const ids = [...new Set(relevant.map((m) => m.sender_id))];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, first_name")
        .in("id", ids);
      const names = new Map((profs ?? []).map((p) => [p.id, p.first_name ?? "A study buddy"]));
      const latest = relevant[relevant.length - 1];
      showNotification(
        `New message from ${names.get(latest.sender_id) ?? "a study buddy"}`,
        latest.content,
      );
    }

    const interval = window.setInterval(tick, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("pointerdown", prime);
    };
  }, [userId]);

  return null;
}
