import { requireAuth } from "@/lib/auth/helpers";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileNav } from "@/components/layout/MobileNav";
import { FloatingActionButton } from "@/components/layout/FloatingActionButton";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { GlobalSearchProvider } from "@/components/search/GlobalSearchProvider";
import { ReactNode } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuth(); // Redirects to login if not authenticated

  return (
    <GlobalSearchProvider>
    <SidebarProvider>
      {/* Hide sidebar on mobile since we have bottom nav */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <SidebarInset>
        <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear border-b bg-background">
          <div className="flex items-center gap-2 px-3 md:px-4 flex-1 min-w-0 overflow-hidden">
            {/* Hide sidebar trigger on mobile */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
            </div>
            {/* Show breadcrumbs on desktop, hide on mobile */}
            <div className="hidden md:block min-w-0 flex-1 overflow-hidden">
              <Breadcrumbs />
            </div>
            {/* TopBar handles both mobile and desktop views internally */}
            <div className="md:hidden flex-1 min-w-0">
              <TopBar />
            </div>
          </div>
          <div className="flex-1 hidden md:block" />
          {/* Show TopBar on desktop (user menu only) */}
          <div className="hidden md:flex items-center px-4 shrink-0">
            <TopBar />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-3 md:p-4 pt-3 md:pt-4 pb-20 md:pb-4">
          {children}
        </div>
        <MobileNav />
        <FloatingActionButton href="/jobs/new" />
      </SidebarInset>
    </SidebarProvider>
    </GlobalSearchProvider>
  );
}
