import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, GraduationCap, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BGU_DOMAIN } from "@/lib/constants";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Study Buddy" },
      {
        name: "description",
        content:
          "Study Buddy Terms of Service for Ben-Gurion University students, including our reports and safety policy.",
      },
      { property: "og:title", content: "Terms of Service — Study Buddy" },
      {
        property: "og:description",
        content:
          "Study Buddy Terms of Service for Ben-Gurion University students, including our reports and safety policy.",
      },
    ],
  }),
  component: TermsPage,
});

const LAST_UPDATED = "June 19, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function TermsPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
          <span className="flex items-center gap-2 font-display font-bold tracking-tight">
            <GraduationCap className="h-5 w-5 text-primary" />
            Study<span className="text-primary">Buddy</span>
          </span>
        </div>

        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </header>

        <div className="space-y-7">
          <Section title="1. Acceptance of these terms">
            <p>
              Study Buddy ("Study Buddy", "we", "us") is a platform that helps students find study
              partners, share daily availability, and coordinate study sessions. By creating an
              account, signing in, or otherwise using Study Buddy, you agree to be bound by these
              Terms of Service. If you do not agree, please do not use the service.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <p>
              Study Buddy is intended for current Ben-Gurion University (BGU) students. You may only
              register with a valid university email address ending in <strong>{BGU_DOMAIN}</strong>.
              You are responsible for ensuring you are eligible to use the service.
            </p>
          </Section>

          <Section title="3. Your account and PIN">
            <p>
              You access Study Buddy with a secure magic link sent to your university email, and you
              may set a 4-digit PIN for faster sign-ins on your device. You are responsible for
              keeping your email account and PIN secure, and for all activity that occurs under your
              account. Notify us promptly of any unauthorized use.
            </p>
          </Section>

          <Section title="4. Acceptable use">
            <p>You agree not to use Study Buddy to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Harass, threaten, intimidate, bully, or discriminate against any person.</li>
              <li>Post content that is unlawful, hateful, sexually explicit, or otherwise abusive.</li>
              <li>
                Engage in academic dishonesty, including arranging or facilitating cheating, exam
                fraud, or other violations of university academic-integrity rules.
              </li>
              <li>Impersonate another person or misrepresent your identity or affiliation.</li>
              <li>Spam, solicit, advertise, or use the service for commercial purposes.</li>
              <li>Attempt to disrupt, hack, or gain unauthorized access to the service or its data.</li>
            </ul>
          </Section>

          <Section title="5. User content">
            <p>
              You are solely responsible for the profile information, messages, photos, and other
              content you share. You retain ownership of your content, and you grant us a limited
              license to host and display it for the purpose of operating the service. We may remove
              content that violates these terms.
            </p>
          </Section>

          <div className="rounded-xl border border-primary/30 bg-secondary/40 p-5">
            <div className="mb-2 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold text-foreground">
                6. Reports &amp; safety
              </h2>
            </div>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                Study Buddy lets any user report another user or block them. We take reports
                seriously.
              </p>
              <p>
                <strong className="text-foreground">
                  If a user is reported, their account and the reported activity may be reviewed by
                  the Study Buddy team.
                </strong>{" "}
                Where warranted — for example in cases of harassment, threats, sexual misconduct,
                violations of university academic-integrity rules, or other unlawful conduct — the
                matter <strong className="text-foreground">may be referred and reported to the
                relevant Ben-Gurion University authorities</strong> (such as the Dean of Students or
                university disciplinary bodies) for further action.
              </p>
              <p>
                We may also suspend or terminate accounts that violate these terms. By using Study
                Buddy you acknowledge and accept this reports and safety policy.
              </p>
            </div>
          </div>

          <Section title="7. Availability and scheduling disclaimer">
            <p>
              Study Buddy helps students discover and coordinate with each other, but we do not
              guarantee the conduct, identity, reliability, or safety of any other user. Meetings and
              study sessions are arranged at your own discretion and risk. Use good judgment and meet
              in safe, public campus locations.
            </p>
          </Section>

          <Section title="8. Privacy">
            <p>
              We collect the information you provide (such as your email, profile details, and
              messages) to operate the service. Your messages are visible to the people you exchange
              them with. We do not sell your personal data. Reported content and account data may be
              retained and used for safety and moderation purposes as described above.
            </p>
          </Section>

          <Section title="9. No warranty">
            <p>
              Study Buddy is provided "as is" and "as available", without warranties of any kind,
              whether express or implied. We do not warrant that the service will be uninterrupted,
              secure, or error-free.
            </p>
          </Section>

          <Section title="10. Limitation of liability">
            <p>
              To the maximum extent permitted by law, Study Buddy and its operators will not be
              liable for any indirect, incidental, or consequential damages arising from your use of
              the service or your interactions with other users.
            </p>
          </Section>

          <Section title="11. Changes to these terms">
            <p>
              We may update these terms from time to time. If we make material changes, we will
              update the "Last updated" date above and may ask you to accept the revised terms.
              Continued use of the service after changes take effect constitutes acceptance.
            </p>
          </Section>

          <Section title="12. Contact">
            <p>
              Questions about these terms or a safety concern? Reach out through the report option in
              the app, and the Study Buddy team will review your message.
            </p>
          </Section>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center">
          <Link to="/auth">
            <Button>Back to sign in</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
