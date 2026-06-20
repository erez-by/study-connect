import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { GraduationCap, Mail, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PinPad } from "@/components/PinPad";
import { LegalFooter } from "@/components/LegalFooter";
import { BGU_DOMAIN, isValidBguEmail } from "@/lib/constants";
import { getPinStatus, setPin, verifyPin, loginWithPin } from "@/lib/pin.functions";
import { setUnlocked, isUnlocked, clearUnlocked } from "@/lib/unlock";
import { cn } from "@/lib/utils";

const MARKETING_KEY = "sb_marketing_opt_in";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Study Buddy" },
      { name: "description", content: "Sign in to Study Buddy with your BGU email." },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup";
type Step = "loading" | "form" | "sent" | "pin-setup" | "pin-unlock";

function AuthPage() {
  const navigate = useNavigate();
  const checkPin = useServerFn(getPinStatus);
  const savePin = useServerFn(setPin);
  const checkPinValue = useServerFn(verifyPin);
  const doLogin = useServerFn(loginWithPin);

  const [step, setStep] = useState<Step>("loading");
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [pin, setPinState] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  async function routeOnward() {
    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user.id;
    if (!uid) {
      setStep("form");
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("profile_completed")
      .eq("id", uid)
      .maybeSingle();
    navigate({ to: profile?.profile_completed ? "/dashboard" : "/onboarding", replace: true });
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setStep("form");
        return;
      }
      const status = await checkPin();
      if (!status.hasPin) {
        setStep("pin-setup");
        return;
      }
      if (isUnlocked()) {
        await routeOnward();
        return;
      }
      setStep("pin-unlock");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidBguEmail(email)) {
      toast.error(`Please use your university email ending in ${BGU_DOMAIN}`);
      return;
    }
    if (!agreedToTerms) {
      toast.error("Please accept the Terms of Service to continue");
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setStep("sent");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidBguEmail(email)) {
      toast.error(`Please use your university email ending in ${BGU_DOMAIN}`);
      return;
    }
    if (loginPin.length !== 4) {
      toast.error("Enter your 4-digit PIN");
      return;
    }
    setBusy(true);
    try {
      const res = await doLogin({ data: { email: email.trim().toLowerCase(), pin: loginPin } });
      if (res.status === "not_found") {
        toast.error("No account found for this email — please sign up.");
        setMode("signup");
        setLoginPin("");
        return;
      }
      if (res.status === "no_pin") {
        toast.error("Finish signing up to set your PIN first.");
        setMode("signup");
        setLoginPin("");
        return;
      }
      if (res.status === "locked") {
        toast.error(`Too many attempts. Try again in ${res.minutes} minute${res.minutes === 1 ? "" : "s"}.`);
        setLoginPin("");
        return;
      }
      if (res.status === "invalid") {
        toast.error(`Incorrect PIN. ${res.remaining} attempt${res.remaining === 1 ? "" : "s"} left.`);
        setLoginPin("");
        return;
      }
      // status === "ok"
      const { error } = await supabase.auth.verifyOtp({
        type: "magiclink",
        token_hash: res.tokenHash,
      });
      if (error) {
        toast.error("Could not sign you in. Please try again.");
        setLoginPin("");
        return;
      }
      sessionStorage.setItem("sb_unlocked", "true");
      toast.success("Welcome back! 🎉");
      await routeOnward();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoginPin("");
    } finally {
      setBusy(false);
    }
  }

  async function handleSetPin() {
    if (pin.length !== 4) return;
    if (pin !== confirmPin) {
      toast.error("PINs don't match — try again");
      setConfirmPin("");
      return;
    }
    setBusy(true);
    try {
      await savePin({ data: { pin } });
      sessionStorage.setItem("sb_unlocked", "true");
      toast.success("PIN set! You're all set.");
      await routeOnward();
    } catch {
      toast.error("Could not save PIN. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlock(value: string) {
    setBusy(true);
    try {
      const res = await checkPinValue({ data: { pin: value } });
      if (res.valid) {
        sessionStorage.setItem("sb_unlocked", "true");
        await routeOnward();
      } else {
        toast.error("Incorrect PIN");
        setPinState("");
      }
    } catch {
      toast.error("Something went wrong. Try again.");
      setPinState("");
    } finally {
      setBusy(false);
    }
  }

  async function handleUseDifferentEmail() {
    await supabase.auth.signOut();
    sessionStorage.removeItem("sb_unlocked");
    setPinState("");
    setConfirmPin("");
    setStep("form");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <GraduationCap className="h-6 w-6" />
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">
            Study<span className="text-primary">Buddy</span>
          </h1>
        </div>

        <Card className="p-6 shadow-lg">
          {step === "loading" && (
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Loading…</p>
            </div>
          )}

          {step === "form" && (
            <div className="space-y-5">
              <div
                role="tablist"
                aria-label="Choose login or sign up"
                className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "login"}
                  onClick={() => setMode("login")}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                  )}
                >
                  Log in
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "signup"}
                  onClick={() => setMode("signup")}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                  )}
                >
                  Sign up
                </button>
              </div>

              {mode === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5 text-center">
                    <h2 className="font-display text-xl font-semibold">Welcome back 👋</h2>
                    <p className="text-sm text-muted-foreground">
                      Log in with your BGU email and your 4-digit PIN.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">University email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder={`yourname${BGU_DOMAIN}`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-pin" className="block text-center">
                      Your PIN
                    </Label>
                    <PinPad value={loginPin} onChange={setLoginPin} disabled={busy} />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Forgot your PIN?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className="font-medium text-primary underline underline-offset-2"
                    >
                      Sign in by email
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleSendLink} className="space-y-4">
                  <div className="space-y-1.5 text-center">
                    <h2 className="font-display text-xl font-semibold">Create your account</h2>
                    <p className="text-sm text-muted-foreground">
                      Sign up with your BGU email. We'll send you a secure magic link, then you'll pick a PIN.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">University email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder={`yourname${BGU_DOMAIN}`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Only {BGU_DOMAIN} emails are allowed.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="terms" className="text-xs font-normal leading-relaxed text-muted-foreground">
                      I agree to the{" "}
                      <Link
                        to="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline underline-offset-2"
                      >
                        Terms of Service
                      </Link>
                      , including the reports &amp; safety policy.
                    </Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={sending || !agreedToTerms}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send magic link"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">Google sign-in coming soon.</p>
                </form>
              )}
            </div>
          )}

          {step === "sent" && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Mail className="h-7 w-7" />
              </div>
              <h2 className="font-display text-xl font-semibold">Check your inbox</h2>
              <p className="text-sm text-muted-foreground">
                We sent a magic link to <span className="font-medium text-foreground">{email}</span>. Click it
                to sign in — you can keep this tab open.
              </p>
              <Button variant="ghost" className="w-full" onClick={() => setStep("form")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Use a different email
              </Button>
            </div>
          )}

          {step === "pin-setup" && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display text-xl font-semibold">Create a login PIN</h2>
                <p className="text-sm text-muted-foreground">
                  {confirmPin.length === 0 && pin.length < 4
                    ? "Pick a 4-digit PIN — you'll use it to log in next time."
                    : "Re-enter your PIN to confirm."}
                </p>
              </div>
              {pin.length < 4 ? (
                <PinPad value={pin} onChange={setPinState} autoFocus />
              ) : (
                <PinPad value={confirmPin} onChange={setConfirmPin} onComplete={handleSetPin} autoFocus />
              )}
              <div className="flex flex-col gap-2">
                {pin.length === 4 && (
                  <Button onClick={handleSetPin} disabled={busy || confirmPin.length !== 4} className="w-full">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm PIN"}
                  </Button>
                )}
                {pin.length === 4 && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setPinState("");
                      setConfirmPin("");
                    }}
                  >
                    Start over
                  </Button>
                )}
              </div>
            </div>
          )}

          {step === "pin-unlock" && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display text-xl font-semibold">Enter your PIN</h2>
                <p className="text-sm text-muted-foreground">Welcome back! Enter your 4-digit PIN to continue.</p>
              </div>
              <PinPad value={pin} onChange={setPinState} onComplete={handleUnlock} disabled={busy} autoFocus />
              {busy && <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />}
              <Button variant="ghost" className="w-full" onClick={handleUseDifferentEmail}>
                Sign in with a different email
              </Button>
            </div>
          )}
        </Card>

        <LegalFooter />
      </div>
    </div>
  );
}
