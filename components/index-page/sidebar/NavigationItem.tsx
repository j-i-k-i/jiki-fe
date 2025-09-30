interface NavigationItemProps {
  id: string;
  label: string;
  icon: string;
  isActive: boolean;
}

export function NavigationItem({ label, icon, isActive }: NavigationItemProps) {
  return (
    <li>
      <button
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
          ${isActive ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"}
        `}
      >
        <span className="text-xl">{icon}</span>
        <span>{label}</span>
      </button>
    </li>
  );
}
