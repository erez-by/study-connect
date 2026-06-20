import { Link } from "@tanstack/react-router";

/** Shared footer with the legally-required policy links. */
export function LegalFooter({ className }: { className?: string }) {
  return (
    <footer className={className ?? "mt-8"}>
      <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <Link to="/terms" className="underline-offset-2 hover:text-foreground hover:underline">
          Terms of Use
        </Link>
        <span aria-hidden="true">·</span>
        <Link to="/privacy" className="underline-offset-2 hover:text-foreground hover:underline">
          Privacy Policy
        </Link>
        <span aria-hidden="true">·</span>
        <Link to="/accessibility" className="underline-offset-2 hover:text-foreground hover:underline">
          Accessibility Statement (הצהרת נגישות)
        </Link>
      </nav>
    </footer>
  );
}
