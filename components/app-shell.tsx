"use client";

import { Home, FileText, Map, Network, Settings, Code2, Info } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MenuDock, type MenuDockItem } from "@/components/ui/shadcn-io/menu-dock";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems: MenuDockItem[] = [
    {
      icon: Home,
      label: "Chat",
      onClick: () => router.push("/"),
    },
    {
      icon: FileText,
      label: "Files",
      onClick: () => router.push("/files"),
    },
    {
      icon: Map,
      label: "Map",
      onClick: () => router.push("/map"),
    },
    {
      icon: Network,
      label: "Graph",
      onClick: () => router.push("/graph"),
    },
    {
      icon: Settings,
      label: "Settings",
      onClick: () => router.push("/settings"),
    },
    {
      icon: Code2,
      label: "Dev",
      onClick: () => router.push("/dev"),
    },
    {
      icon: Info,
      label: "About",
      onClick: () => router.push("/about"),
    },
  ];

  // Determine active index based on current pathname
  const getActiveIndex = () => {
    const routes = ["/", "/files", "/map", "/graph", "/settings", "/dev", "/about"];
    const index = routes.findIndex(route => 
      route === "/" ? pathname === route : pathname?.startsWith(route)
    );
    return index >= 0 ? index : 0;
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="border-t border-gray-200 bg-white px-1 py-1 sm:px-4 sm:py-2 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-center">
          <MenuDock
            items={menuItems}
            variant="default"
            orientation="horizontal"
            showLabels={true}
            animated={false}
            activeIndex={getActiveIndex()}
            className="bg-transparent border-none shadow-none"
          />
        </div>
      </nav>
    </div>
  );
}
