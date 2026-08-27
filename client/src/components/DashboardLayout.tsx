import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useIsMobile } from "@/hooks/useMobile";
import { Download, LayoutDashboard, LogOut, MessageCircle, PanelLeft, Sparkles, Users, type LucideIcon } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { toast } from "sonner";

const defaultMenuItems: DashboardNavItem[] = [
  { icon: LayoutDashboard, label: "Page 1", path: "/" },
  { icon: Users, label: "Page 2", path: "/some-path" },
];

export type DashboardNavItem = { icon: LucideIcon; label: string; path: string };

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
  menuItems = defaultMenuItems,
  title = "Learn Educação",
  preview = false,
}: {
  children: React.ReactNode;
  menuItems?: DashboardNavItem[];
  title?: string;
  preview?: boolean;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading && !preview) {
    return <DashboardLayoutSkeleton />
  }

  if (!user && !preview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => startLogin()}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth} menuItems={menuItems} title={title} preview={preview}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
  menuItems: DashboardNavItem[];
  title: string;
  preview: boolean;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
  menuItems,
  title,
  preview,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const exportDataQuery = trpc.platform.exportMyData.useQuery(undefined, { enabled: Boolean(user && !preview), retry: false });
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      {!(isMobile && preview) && <div className="relative" ref={sidebarRef}>
          <Sidebar
          collapsible="icon"
          className="learn-dashboard-sidebar border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="learn-sidebar-header">
            <div className="learn-sidebar-brand">
              <img src="/manus-storage/axia-neon-mark_befbeb3c.png" alt="Símbolo Learn Educação" />
              {!isCollapsed && <span><b>LEARN</b><small>EDUCAÇÃO</small></span>}
              <button onClick={toggleSidebar} aria-label="Alternar navegação"><PanelLeft className="h-4 w-4" /></button>
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="learn-sidebar-footer">
            {!isCollapsed && <section className="learn-sidebar-axia"><img src="/manus-storage/axia-hero-luminous-object_3b3784ba.png" alt="AXIA"/><div><b>AXIA <Sparkles size={12}/></b><span>Assistente pedagógica</span><p>Pergunte ou peça sugestões para suas turmas.</p><button onClick={() => setLocation("/portal/axia")}><MessageCircle size={13}/> Conversar com AXIA</button></div></section>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {(preview ? "D" : user?.name?.charAt(0).toUpperCase())}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {preview ? "Ambiente demonstrativo" : user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {preview ? "Dados reais entram após a integração" : user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {preview ? (
                  <DropdownMenuItem onClick={() => startLogin()} className="cursor-pointer">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Entrar com conta</span>
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem
                      disabled={exportDataQuery.isFetching}
                      onClick={async () => {
                        try {
                          const result = await exportDataQuery.refetch();
                          if (!result.data) throw new Error("Não foi possível preparar seus dados agora.");
                          const date = new Date().toISOString().slice(0, 10);
                          const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const anchor = document.createElement("a");
                          anchor.href = url;
                          anchor.download = `learn-educacao-meus-dados-${date}.json`;
                          document.body.appendChild(anchor);
                          anchor.click();
                          anchor.remove();
                          window.setTimeout(() => URL.revokeObjectURL(url), 0);
                          toast.success("Seus dados foram exportados em JSON.");
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Não foi possível preparar seus dados agora.");
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      <span>{exportDataQuery.isFetching ? "Preparando..." : "Exportar meus dados"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={logout}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                    <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>
      }

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              {!preview && <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />}
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="learn-dashboard-main flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
