import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutGrid, FileText, BarChart3, Activity, LogOut, ExternalLink, Menu, Gauge } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import NotificationBell from "@/components/admin/NotificationBell";
import ProfileEditor from "@/components/admin/ProfileEditor";
import EmailTemplateEditor from "@/components/admin/EmailTemplateEditor";
import DigestReportDialog from "@/components/admin/DigestReportDialog";
import logo from "@/assets/movimento-circular-logo.png";
import { LogoImage } from "@/components/LogoImage";

type ModuleKey = "pipeline" | "propostas" | "dashboard" | "painel" | "performance";

const NAV_ITEMS: { key: ModuleKey; label: string; icon: typeof LayoutGrid; path: string }[] = [
  { key: "pipeline", label: "Pipeline", icon: LayoutGrid, path: "/admin/pipeline" },
  { key: "propostas", label: "Propostas", icon: FileText, path: "/admin/propostas" },
  { key: "dashboard", label: "Dashboard", icon: BarChart3, path: "/admin/dashboard" },
  { key: "performance", label: "Performance", icon: Gauge, path: "/admin/performance" },
  { key: "painel", label: "Painel", icon: Activity, path: "/painel" },
];

interface CrmNavbarProps {
  currentModule: ModuleKey;
  children?: React.ReactNode;
}

export default function CrmNavbar({ currentModule, children }: CrmNavbarProps) {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileName, setProfileName] = useState("");

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    if (data?.full_name) setProfileName(data.full_name);
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const userInitials = useMemo(() => {
    if (!profileName) return "?";
    return profileName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  }, [profileName]);

  return (
    <header
      className="bg-white border-b z-40 shrink-0"
      style={{ borderColor: 'hsl(var(--color-border))', height: 56 }}
    >
      <div className="w-full px-4 md:px-6 flex items-center justify-between h-14">
        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setMobileOpen(true)}
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" style={{ color: 'hsl(var(--color-text-secondary))' }} />
        </button>

        {/* Logo + nav icons */}
        <div className="flex items-center gap-3">
          <LogoImage
            src={logo}
            alt="Movimento Circular"
            className="h-8 cursor-pointer"
            onClick={() => navigate("/admin/pipeline")}
          />
          <span className="hidden md:inline text-sm font-medium" style={{ color: 'hsl(var(--color-text-muted))' }}>
            CRM
          </span>

          {/* Desktop nav icons */}
          <div className="hidden md:flex items-center gap-0.5 ml-2 rounded-lg p-0.5" style={{ background: 'hsl(var(--color-bg-subtle))' }}>
            {NAV_ITEMS.map(item => {
              const isActive = currentModule === item.key;
              const Icon = item.icon;
              return (
                <Tooltip key={item.key}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate(item.path)}
                      className="h-8 w-8 flex items-center justify-center rounded-md transition-all"
                      style={{
                        background: isActive ? 'hsl(var(--color-brand))' : 'transparent',
                        color: isActive ? 'white' : 'hsl(var(--color-text-muted))',
                      }}
                      aria-label={item.label}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Contextual actions (children) */}
        {children && <div className="hidden md:flex items-center">{children}</div>}

        {/* Right: notifications + avatar */}
        <div className="flex items-center gap-2">
          {user && <NotificationBell userId={user.id} />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none" aria-label="Menu da conta">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback
                    className="text-xs font-semibold"
                    style={{ background: 'hsl(var(--color-brand-light))', color: 'hsl(var(--color-brand))' }}
                  >
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl p-2 shadow-lg bg-white border" style={{ borderColor: 'hsl(var(--color-border))' }}>
              {user && (
                <div className="[&>button]:w-full [&>button]:justify-start [&>button]:gap-2 [&>button]:rounded-lg [&>button]:px-2 [&>button]:py-1.5 [&>button]:text-sm [&>button]:font-normal">
                  <ProfileEditor userId={user.id} onProfileUpdated={fetchProfile} />
                </div>
              )}
              {isAdmin && (
                <div className="[&>button]:w-full [&>button]:justify-start [&>button]:gap-2 [&>button]:rounded-lg [&>button]:px-2 [&>button]:py-1.5 [&>button]:text-sm [&>button]:font-normal">
                  <EmailTemplateEditor />
                </div>
              )}
              {isAdmin && (
                <div className="[&>button]:w-full [&>button]:justify-start [&>button]:gap-2 [&>button]:rounded-lg [&>button]:px-2 [&>button]:py-1.5 [&>button]:text-sm [&>button]:font-normal">
                  <DigestReportDialog />
                </div>
              )}
              <DropdownMenuItem onClick={() => navigate("/")} className="gap-2 cursor-pointer rounded-lg">
                <ExternalLink className="h-4 w-4" aria-hidden="true" /> Ir para o Site
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer rounded-lg text-destructive">
                <LogOut className="h-4 w-4" aria-hidden="true" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="p-4 border-b" style={{ borderColor: 'hsl(var(--color-border))' }}>
            <SheetTitle className="flex items-center gap-2">
              <LogoImage src={logo} alt="Movimento Circular" className="h-7" />
              <span className="text-sm font-medium" style={{ color: 'hsl(var(--color-text-muted))' }}>CRM</span>
            </SheetTitle>
          </SheetHeader>
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map(item => {
              const isActive = currentModule === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => { navigate(item.path); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: isActive ? 'hsl(var(--color-brand))' : 'transparent',
                    color: isActive ? 'white' : 'hsl(var(--color-text-secondary))',
                  }}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="border-t mt-auto p-3 space-y-1" style={{ borderColor: 'hsl(var(--color-border))' }}>
            <button
              onClick={() => { navigate("/"); setMobileOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-gray-100"
              style={{ color: 'hsl(var(--color-text-secondary))' }}
            >
              <ExternalLink className="h-5 w-5" /> Ir para o Site
            </button>
            <button
              onClick={() => { signOut(); setMobileOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-gray-100 text-destructive"
            >
              <LogOut className="h-5 w-5" /> Sair
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
