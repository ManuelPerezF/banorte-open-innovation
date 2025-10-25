import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import BanorteLogo from "./BanorteLogo";
import {
  LayoutDashboard,
  TrendingUp,
  Database,
  FileText,
  MessageSquare,
  LogOut,
  User,
  Building2,
} from "lucide-react";

interface DashboardSidebarProps {
  userType: "personal" | "company";
  userId: string;
}

const DashboardSidebar = ({ userType, userId }: DashboardSidebarProps) => {
  const handleNavigation = (path: string) => {
    if (path === "/logout") {
      sessionStorage.clear();
      window.location.href = "/login";
    } else {
      window.location.href = path;
    }
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
  
    {
      title: "Datos",
      icon: Database,
      path:
        userType === "personal" ? "/dashboard/personal" : "/dashboard/company",
    },
    {
      title: "Reporte",
      icon: FileText,
      path: "/reports",
    },
    {
      title: "ChatBot",
      icon: MessageSquare,
      path: "/chatbot",
    },
  ];

  return (
    <Sidebar>
      {/* Header with Logo */}
      <SidebarHeader>
        <div className="flex items-center gap-3 p-4">
          <BanorteLogo size="md" />
          <div>
            <h1 className="text-lg font-semibold">Banorte</h1>
            <p className="text-sm text-muted-foreground">PyME</p>
          </div>
        </div>
      </SidebarHeader>

      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.path)}
                    className="cursor-pointer"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

    
      <SidebarFooter>
        <SidebarMenu>
          {/* User Info */}
          <SidebarMenuItem>
            <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
              {userType === "personal" ? (
                <User className="h-4 w-4" />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {userType === "personal" ? "Personal" : "Empresarial"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  ID: {userId}
                </p>
              </div>
            </div>
          </SidebarMenuItem>

          {/* Logout Button */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigation("/logout")}
              className="cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
