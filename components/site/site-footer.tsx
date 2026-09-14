import Link from "next/link";
import { Brand } from "@/components/site/brand";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-hairline">
      <div className="flex flex-col items-center justify-between gap-4 px-10 py-8 text-sm text-dim sm:flex-row">
        <Brand mark="h-6 w-6" boxText="AI" href="https://fluxion-sys.ai" external />
        <div className="flex items-center gap-5">
          <Link href="/pricing" className="transition-colors hover:text-gold-soft">Pricing</Link>
          <Link href="/terms" className="transition-colors hover:text-gold-soft">Terms</Link>
          <Link href="/privacy" className="transition-colors hover:text-gold-soft">Privacy</Link>
          <Link href="/refunds" className="transition-colors hover:text-gold-soft">Refunds</Link>
          <span>© {new Date().getFullYear()} Fluxion</span>
        </div>
      </div>
    </footer>
  );
}
