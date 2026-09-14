import { ReactNode, useState } from "react";

import { Header } from "./header";
import { Sidebar } from "./sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[#f4f6f9] text-[#202735]">
      <Header
        onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
        sidebarCollapsed={sidebarCollapsed}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} />
        <main className="min-w-0 flex-1 overflow-y-auto bg-[#f4f6f9] p-4 md:p-6 xl:p-7">
          <div className="mx-auto w-full max-w-[1360px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
