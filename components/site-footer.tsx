import Link from "next/link";
import { Brand } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-[rgba(124,189,242,0.12)]">
      <div className="flex flex-col items-center justify-between gap-4 px-10 py-8 text-sm text-dim sm:flex-row">
        <Brand mark="h-6 w-6" boxText="AI" href="https://fluxion-sys.ai" external />
        <div className="flex items-center gap-5">
          <Link href="/info" className="transition-colors hover:text-gold-soft">Info</Link>
          <Link href="/pricing" className="transition-colors hover:text-gold-soft">Pricing</Link>
          <span>© {new Date().getFullYear()} Fluxion</span>
        </div>
      </div>
    </footer>
  );
}
