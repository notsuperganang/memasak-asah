// web/src/app/(dashboard)/layout.tsx

import { Header } from "@/components/layout/header";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}