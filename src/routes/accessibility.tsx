import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LegalFooter } from "@/components/LegalFooter";

export const Route = createFileRoute("/accessibility")({
  head: () => ({
    meta: [
      { title: "Accessibility Statement — Study Buddy" },
      {
        name: "description",
        content:
          "Study Buddy's accessibility statement (הצהרת נגישות) describing our commitment to WCAG 2.1 AA and IS 5568 under the Equal Rights for Persons with Disabilities Law.",
      },
      { property: "og:title", content: "Accessibility Statement — Study Buddy" },
      {
        property: "og:description",
        content:
          "Study Buddy's commitment to digital accessibility under WCAG 2.1 AA and Israeli Standard 5568.",
      },
    ],
  }),
  component: AccessibilityPage,
});

const LAST_UPDATED = "June 20, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function AccessibilityPage() {
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
          <h1 className="font-display text-3xl font-bold tracking-tight">Accessibility Statement</h1>
          <p className="mt-1 font-display text-lg text-muted-foreground" dir="rtl" lang="he">
            הצהרת נגישות
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </header>

        <div className="space-y-7">
          <Section title="Our commitment">
            <p>
              Study Buddy is committed to making its service accessible to everyone, including people
              with disabilities, in line with the Equal Rights for Persons with Disabilities Law,
              5758-1998, and its accessibility regulations.
            </p>
          </Section>

          <Section title="Conformance standard">
            <p>
              We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA, which is
              the basis of Israeli Standard 5568 (ת"י 5568) for web content accessibility.
            </p>
          </Section>

          <Section title="What we've done">
            <ul className="list-disc space-y-1 pl-5">
              <li>Semantic HTML structure with proper headings, labels, and landmarks.</li>
              <li>All form fields have clear, visible labels — not placeholder text alone.</li>
              <li>ARIA attributes (such as required and invalid states) and inline, linked error messages.</li>
              <li>Full keyboard navigation with visible focus indicators.</li>
              <li>Color contrast of at least 4.5:1 for normal text.</li>
              <li>Layout that supports right-to-left (RTL) reading for Hebrew content.</li>
            </ul>
          </Section>

          <Section title="Ongoing effort">
            <p>
              Accessibility is an ongoing process. We continue to test and improve the service, and we
              welcome feedback that helps us do better.
            </p>
          </Section>

          <Section title="Contact for accessibility issues">
            <p>
              If you encounter an accessibility barrier, or need assistance using the service, please
              contact us through the app and we will work to resolve the issue as quickly as possible.
            </p>
          </Section>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center">
          <Link to="/auth">
            <Button>Back to sign in</Button>
          </Link>
        </div>

        <LegalFooter />
      </div>
    </div>
  );
}
