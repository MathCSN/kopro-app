import { ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar, AdminMobileSidebar } from "./AdminSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AdminLayoutProps {
  children: ReactNode;
  onLogout?: () => void | Promise<void>;
}

export function AdminLayout({ children, onLogout }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = useCallback(async () => {
    if (onLogout) {
      await onLogout();
      return;
    }
    await logout();
    navigate("/", { replace: true });
  }, [logout, navigate, onLogout]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <AdminSidebar onLogout={handleLogout} />

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-kopro-amber flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-semibold text-white">Kopro Admin</span>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-slate-900 border-slate-800 [&>button]:hidden">
              <AdminMobileSidebar onLogout={handleLogout} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-auto">
        {/* Mobile top padding */}
        <div className="h-14 md:hidden shrink-0" />

        <div className="flex-1 p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
