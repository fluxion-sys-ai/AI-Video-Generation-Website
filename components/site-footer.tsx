import { Brand } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-[rgba(124,189,242,0.14)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-[#6E82A0] sm:flex-row">
        <Brand mark="h-5 w-5" />
        <p>© {new Date().getFullYear()} — Frontend demo. No real generation.</p>
      </div>
    </footer>
  );
}
