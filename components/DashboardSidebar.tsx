"use client";

import React, { useState, useEffect } from "react";
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
import supabase from "@/services/supabase";
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
  const [companyName, setCompanyName] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (userType === "company") {
          const { data, error } = await supabase
            .from('companies')
            .select('name')
            .eq('id', userId)
            .single();

          if (error) {
            console.error('Error fetching company name:', error);
            setCompanyName("Empresa");
          } else {
            setCompanyName(data?.name || "Empresa");
          }
        } else {
          // Para usuarios personales
          const { data, error } = await supabase
            .from('app_users')
            .select('name')
            .eq('id', parseInt(userId))
            .single();

          if (error) {
            console.error('Error fetching user name:', error);
            setUserName("Usuario");
          } else {
            setUserName(data?.name || "Usuario");
          }
        }
      } catch (error) {
        console.error('Error:', error);
        if (userType === "company") {
          setCompanyName("Empresa");
        } else {
          setUserName("Usuario");
        }
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, [userType, userId]);
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
      path: "/database",
    },
    {
      title: "Reporte",
      icon: FileText,
      path: "/reporte",
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
            <h1 className="text-lg font-semibold">Proa</h1>
            <p className="text-sm text-muted-foreground">By Banorte</p>
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
                  {isLoading 
                    ? "Cargando..." 
                    : userType === "personal" 
                      ? userName
                      : companyName
                  }
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {userType === "personal" ? "Usuario Personal" : "Empresa"} • ID: {userId}
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
