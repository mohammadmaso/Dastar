"use client";

import { Home, FileText, Map, Network, Settings, Code2, Info } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuDock } from "@/components/ui/shadcn-io/menu-dock";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    {
      icon: Home,
      label: "Chat",
      href: "/",
      isActive: pathname === "/",
    },
    {
      icon: FileText,
      label: "Files",
      href: "/files",
      isActive: pathname?.startsWith("/files"),
    },
    {
      icon: Map,
      label: "Map",
      href: "/map",
      isActive: pathname === "/map",
    },
    {
      icon: Network,
      label: "Graph",
      href: "/graph",
      isActive: pathname === "/graph",
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/settings",
      isActive: pathname === "/settings",
    },
    {
      icon: Code2,
      label: "Dev",
      href: "/dev",
      isActive: pathname === "/dev",
    },
    {
      icon: Info,
      label: "About",
      href: "/about",
      isActive: pathname === "/about",
    },
  ];

  return (
    <div className="flex h-screen flex-col">
      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="border-t border-gray-200 bg-white px-4 py-2 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-around">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-100 ${
                  item.isActive
                    ? "text-black font-medium"
                    : "text-gray-600"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
