import { LookupView } from "@/components/citizen/LookupView";

export const metadata = { title: "Tra cứu phản ánh · PAKN Phường Xuân Lãnh" };

export default function Page() {
  return (
    <div className="min-h-screen">
      <header className="flex h-[54px] items-center bg-brand-deep px-4 text-[15px] font-bold uppercase text-white">PAKN Phường Xuân Lãnh · Tra cứu</header>
      <LookupView />
    </div>
  );
}
