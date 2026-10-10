import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Legal({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#000000] text-[#ededed] font-sans antialiased py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link
            href="/overview"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#a1a1a1] hover:text-[#60eca8] transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>PORTAL // RETURN TO DASHBOARD</span>
          </Link>
          <div className="border-b border-white/8 pb-6">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#707070] block mb-1">
              DOCUMENTATION &amp; LEGAL
            </span>
            <h1 className="text-3xl font-semibold text-[#ededed] tracking-tight">{title}</h1>
            <p className="text-xs font-mono text-[#707070] mt-1">Last updated {updated}</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none text-sm text-[#a1a1a1] space-y-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-[#ededed] [&_h2]:pt-4 [&_h2]:border-t [&_h2]:border-white/8 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-[#60eca8] [&_a]:underline [&_code]:font-mono [&_code]:text-[#60eca8] [&_code]:bg-white/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded">
          {children}
        </div>
      </div>
    </main>
  );
}
