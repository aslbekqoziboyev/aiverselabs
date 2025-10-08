import { Home, Upload, Sparkles, LogIn, LogOut, User, Image, MessageCircle } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/integrations/supabase/hooks/useAuth";

const menuItems = [
  { title: "Rasmlarni kuzatish", url: "/", icon: Image },
  { title: "Rasm joylash", url: "/upload", icon: Upload },
  { title: "AI'dan foydalanish", url: "/ai-generate", icon: Sparkles },
  { title: "Chatlar", url: "/chats", icon: MessageCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;
  const isCollapsed = state === "collapsed";
  const userName = user?.user_metadata?.full_name || user?.email || "Foydalanuvchi";

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-sidebar">
        <div className="px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  AI Image Connect
                </h1>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Asosiy</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) =>
                        `transition-smooth ${
                          isActive 
                            ? "bg-sidebar-accent text-sidebar-primary font-medium" 
                            : "hover:bg-sidebar-accent/50"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4">
          {!user ? (
            <SidebarMenuButton asChild>
              <NavLink to="/auth" className="w-full transition-smooth hover:bg-sidebar-accent">
                <LogIn className="h-4 w-4" />
                {!isCollapsed && <span>Kirish</span>}
              </NavLink>
            </SidebarMenuButton>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-lg p-2 transition-smooth hover:bg-sidebar-accent">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="gradient-primary text-white">
                    {userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <span className="text-sm font-medium">{userName}</span>
                )}
              </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => window.location.href = '/profile'} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Chiqish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <SidebarTrigger className="m-2 self-end" />
      </SidebarContent>
    </Sidebar>
  );
}
