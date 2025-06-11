import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar, Search, CalendarDays, Home } from "lucide-react";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const sidebarItems = [
  {
    id: "input",
    label: "Home",
    icon: Home,
    description: "Manage users, schedules",
  },
  {
    id: "suggest",
    label: "Find Meetings",
    icon: Search,
    description: "Find & book free slots",
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: Calendar,
    description: "Visual calendar",
  },
  {
    id: "meetings",
    label: "Booked Meetings",
    icon: CalendarDays,
    description: "View all meetings",
  },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <div className="w-64 border-r bg-background text-foreground p-4">
      <nav className="space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeView === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-auto p-3 bg-secondary",
                activeView === item.id && "bg-primary text-primary-foreground"
              )}
              onClick={() => onViewChange(item.id)}
            >
              <Icon className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs opacity-70">{item.description}</div>
              </div>
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
