import Link from "next/link";
import { Brand } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-[rgba(124,189,242,0.12)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-[#6E82A0] sm:flex-row">
        <Brand mark="h-6 w-6" boxText="AI" href="https://fluxion-sys.ai" external />
        <div className="flex items-center gap-5">
          <Link href="/info" className="transition-colors hover:text-[#F5C46B]">Info</Link>
          <Link href="/pricing" className="transition-colors hover:text-[#F5C46B]">Pricing</Link>
          <span>© {new Date().getFullYear()} Fluxion</span>
        </div>
      </div>
    </footer>
  );
}
