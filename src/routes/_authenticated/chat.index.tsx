import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type { Message, Profile } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudentAvatar } from "@/components/StudentAvatar";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatList,
});

type Conversation = { other: Profile; last: Message };

function ChatList() {
  const { user } = useSession();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ["conversations", userId],
    enabled: !!userId,
    refetchInterval: 8000,
    queryFn: async (): Promise<Conversation[]> => {
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (!msgs?.length) return [];
      const latest = new Map<string, Message>();
      for (const m of msgs) {
        const other = m.sender_id === userId ? m.receiver_id : m.sender_id;
        if (!latest.has(other)) latest.set(other, m);
      }
      const ids = [...latest.keys()];
      const { data: profs } = await supabase.from("profiles").select("*").in("id", ids);
      const map = new Map<string, Profile>((profs ?? []).map((p) => [p.id, p]));
      return ids
        .filter((id) => map.has(id))
        .map((id) => ({ other: map.get(id)!, last: latest.get(id)! }));
    },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 font-display text-2xl font-bold tracking-tight">Chats</h1>

      {query.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !query.data?.length ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            <MessageCircle className="h-7 w-7" />
          </div>
          <h3 className="font-display text-lg font-semibold">No conversations yet</h3>
          <p className="max-w-xs text-sm text-muted-foreground">
            Find someone on the billboard and tap Message to start coordinating.
          </p>
          <Button asChild className="mt-2">
            <Link to="/dashboard">Browse billboard</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {query.data.map((c) => {
            const name = `${c.other.first_name ?? "Student"}${c.other.last_initial ? ` ${c.other.last_initial}.` : ""}`;
            const fromMe = c.last.sender_id === userId;
            return (
              <Link key={c.other.id} to="/chat/$userId" params={{ userId: c.other.id }}>
                <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-secondary/50">
                  <StudentAvatar name={c.other.first_name} avatarUrl={c.other.avatar_url} seed={c.other.id} className="h-12 w-12" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-semibold">{name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {fromMe && "You: "}
                      {c.last.content}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
