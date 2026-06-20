import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Ban,
  Flag,
  Loader2,
  ShieldOff,
  Handshake,
  Star,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type { Message, Profile } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StudentAvatar } from "@/components/StudentAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RatingDialog } from "@/components/RatingDialog";
import { getMeetupState, confirmMeetup } from "@/lib/meetup";
import { getStudyTip } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** After this many messages in the thread, inject a friendly study tip. */
const TIP_EVERY = 6;

export const Route = createFileRoute("/_authenticated/chat/$userId")({
  component: ChatThread,
});

function ChatThread() {
  const { userId: otherId } = Route.useParams();
  const { user } = useSession();
  const me = user?.id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);

  const other = useQuery({
    queryKey: ["chat-profile", otherId],
    queryFn: async (): Promise<Profile | null> => {
      const { data } = await supabase.from("profiles").select("*").eq("id", otherId).maybeSingle();
      return data;
    },
  });

  const blocked = useQuery({
    queryKey: ["blocked", me, otherId],
    enabled: !!me,
    queryFn: async (): Promise<boolean> => {
      const { data } = await supabase
        .from("blocks")
        .select("id")
        .eq("blocker_id", me!)
        .eq("blocked_id", otherId)
        .maybeSingle();
      return !!data;
    },
  });

  const messages = useQuery({
    queryKey: ["messages", me, otherId],
    enabled: !!me,
    refetchInterval: 4000,
    queryFn: async (): Promise<Message[]> => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${me},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${me})`,
        )
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const meetup = useQuery({
    queryKey: ["meetup", me, otherId],
    enabled: !!me,
    refetchInterval: 8000,
    queryFn: () => getMeetupState(me!, otherId),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data?.length]);

  async function handleConfirmMeetup() {
    if (!me) return;
    setConfirming(true);
    try {
      await confirmMeetup(me, otherId);
      toast.success("Meetup confirmed! 🤝");
      meetup.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not confirm meetup");
    } finally {
      setConfirming(false);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !me) return;
    setSending(true);
    const { error } = await supabase
      .from("messages")
      .insert({ sender_id: me, receiver_id: otherId, content });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraft("");
    messages.refetch();
  }

  async function handleBlock() {
    if (!me) return;
    const { error } = await supabase.from("blocks").insert({ blocker_id: me, blocked_id: otherId });
    setBlockOpen(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("User blocked");
    queryClient.invalidateQueries();
  }

  async function handleUnblock() {
    if (!me) return;
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("blocker_id", me)
      .eq("blocked_id", otherId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("User unblocked");
    queryClient.invalidateQueries();
  }

  async function handleReport() {
    if (!me) return;
    const { error } = await supabase
      .from("reports")
      .insert({ reporter_id: me, reported_id: otherId, reason: reportReason.trim() || null });
    setReportOpen(false);
    setReportReason("");
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Report submitted. Thank you for keeping the community safe.");
  }

  const name = other.data
    ? `${other.data.first_name ?? "Student"}${other.data.last_initial ? ` ${other.data.last_initial}.` : ""}`
    : "…";
  const isBlocked = blocked.data === true;

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-2xl flex-col px-4">
      <div className="flex items-center gap-2 border-b border-border py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/chat" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Link
          to="/profile/$userId"
          params={{ userId: otherId }}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <StudentAvatar name={other.data?.first_name} avatarUrl={other.data?.avatar_url} seed={otherId} className="h-10 w-10" />
          <div className="min-w-0">
            <p className="truncate font-display font-semibold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{other.data?.degree ?? ""}</p>
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setReportOpen(true)}>
              <Flag className="mr-2 h-4 w-4" /> Report user
            </DropdownMenuItem>
            {isBlocked ? (
              <DropdownMenuItem onClick={handleUnblock}>
                <ShieldOff className="mr-2 h-4 w-4" /> Unblock user
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="text-destructive" onClick={() => setBlockOpen(true)}>
                <Ban className="mr-2 h-4 w-4" /> Block user
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {messages.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.data?.length ? (
          messages.data.map((m, i) => {
            const mine = m.sender_id === me;
            // Inject a relaxed study tip after every TIP_EVERY messages.
            const showTip = (i + 1) % TIP_EVERY === 0;
            return (
              <div key={m.id}>
                <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                      mine
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-secondary text-secondary-foreground",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <span className={cn("mt-0.5 block text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                {showTip && (
                  <div className="my-3 flex justify-center">
                    <div className="flex max-w-[85%] items-start gap-2 rounded-2xl border border-gold/30 bg-gold/10 px-3.5 py-2.5 text-sm">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      <p className="leading-snug text-foreground/90">
                        <span className="font-semibold">Study tip: </span>
                        {getStudyTip(Math.floor((i + 1) / TIP_EVERY) - 1)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Say hi 👋 and plan when & where to meet.
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {isBlocked ? (
        <div className="border-t border-border py-4 text-center text-sm text-muted-foreground">
          You blocked this user. <button onClick={handleUnblock} className="font-medium text-primary underline">Unblock</button> to message again.
        </div>
      ) : (
        <form onSubmit={send} className="flex items-center gap-2 border-t border-border py-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            maxLength={1000}
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={sending || !draft.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      )}

      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {other.data?.first_name ?? "this user"}?</AlertDialogTitle>
            <AlertDialogDescription>
              They won't be able to appear in your conversations and you won't be able to message each other
              until you unblock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock}>Block</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Report {other.data?.first_name ?? "user"}</DialogTitle>
            <DialogDescription>
              Tell us what happened. Reports are reviewed by the Study Buddy team to keep the
              community safe, and serious cases may be reported to university authorities.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Describe the issue (optional)"
            maxLength={500}
            rows={4}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReport}>
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
