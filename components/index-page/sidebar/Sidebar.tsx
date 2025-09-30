"use client";

import { NavigationItem } from "./NavigationItem";

interface SidebarProps {
  activeItem?: string;
}

const navigationItems = [
  { id: "exercises", label: "Exercises", icon: "📚" },
  { id: "concepts", label: "Concepts", icon: "💡" },
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "achievements", label: "Achievements", icon: "🏆" },
  { id: "leaderboard", label: "Leaderboard", icon: "🎯" },
  { id: "settings", label: "Settings", icon: "⚙️" }
];

export default function Sidebar({ activeItem = "exercises" }: SidebarProps) {
  return (
    <aside className="w-1/4 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Jiki Learn</h1>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <NavigationItem
              key={item.id}
              id={item.id}
              label={item.label}
              icon={item.icon}
              isActive={activeItem === item.id}
            />
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          <div>Version 1.0.0</div>
        </div>
      </div>
    </aside>
  );
}
