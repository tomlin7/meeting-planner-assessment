import "./App.css";

import { useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sidebar } from "@/components/sidebar";
import { SlotsInput } from "@/components/slots-input";
import { MeetingSuggestions } from "@/components/meeting-suggestions";
import { UserCalendar } from "@/components/user-calendar";
import { BookedMeetings } from "@/components/booked-meetings";
import { Toaster } from "@/components/ui/sonner";
import { CalendarDays } from "lucide-react";

function App() {
  const [activeView, setActiveView] = useState("input");
  const [users, setUsers] = useState<any[]>([]);

  const renderContent = () => {
    switch (activeView) {
      case "input":
        return <SlotsInput onUsersUpdate={setUsers} />;
      case "suggest":
        return <MeetingSuggestions />;
      case "calendar":
        return <UserCalendar users={users} />;
      case "meetings":
        return <BookedMeetings />;
      default:
        return <SlotsInput onUsersUpdate={setUsers} />;
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="meeting-planner-theme">
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b">
          <div className="w-full px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Smart Meeting Planner</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-1">
          <Sidebar activeView={activeView} onViewChange={setActiveView} />
          <main className="flex-1 overflow-auto">
            <div className="w-full p-6">{renderContent()}</div>
          </main>
        </div>

        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;
