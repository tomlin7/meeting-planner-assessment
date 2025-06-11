import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Users } from "lucide-react";

interface UserCalendarProps {
  users: any[];
}

interface TimeSlot {
  time: string;
  status: "available" | "busy" | "meeting";
  title?: string;
}
const API_URL = import.meta.env.VITE_API_URL;

export function UserCalendar({ users }: UserCalendarProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [calendarData, setCalendarData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");
  const [mergedSlots, setMergedSlots] = useState<any[]>([]);

  useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id.toString());
    }
  }, [users]);

  const loadCalendar = async (userId: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/calendar/${userId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to load calendar");
      }

      const data = await response.json();
      setCalendarData(data);
      generateTimeSlots(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load calendar";
      toast.error("Failed to load calendar", {
        description: message,
      });
      setCalendarData(null);
      setTimeSlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTimeSlots = (data: any) => {
    const slots: TimeSlot[] = [];
    const workStart = 9 * 60;
    const workEnd = 18 * 60;
    const interval = 15;

    for (let minutes = workStart; minutes < workEnd; minutes += interval) {
      const timeStr = minutesToTime(minutes);
      let status: "available" | "busy" | "meeting" = "available";
      let title = "";

      for (const busySlot of data.busy) {
        const busyStart = timeToMinutes(busySlot[0]);
        const busyEnd = timeToMinutes(busySlot[1]);
        if (minutes >= busyStart && minutes < busyEnd) {
          status = "busy";
          break;
        }
      }

      for (const meeting of data.meetings) {
        const meetingStart = timeToMinutes(meeting.startTime);
        const meetingEnd = timeToMinutes(meeting.endTime);
        if (minutes >= meetingStart && minutes < meetingEnd) {
          status = "meeting";
          title = meeting.title;
          break;
        }
      }

      slots.push({ time: timeStr, status, title });
    }

    setTimeSlots(slots);

    const merged: any[] = [];
    let prev = null;
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (
        prev &&
        slot.status === prev.status &&
        (slot.status !== "meeting" || slot.title === prev.title)
      ) {
        prev.end = slot.time;
      } else {
        if (prev) merged.push(prev);
        prev = {
          start: slot.time,
          end: slot.time,
          status: slot.status,
          title: slot.title,
        };
      }
    }
    if (prev) merged.push(prev);
    setMergedSlots(merged);
  };

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  const formatTimeDisplay = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    if (timeFormat === "24h") {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    }
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes
      .toString()
      .padStart(2, "0")} ${period.toLowerCase()}`;
  };

  useEffect(() => {
    if (selectedUserId) {
      loadCalendar(selectedUserId);
    }
  }, [selectedUserId]);

  if (users.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-2">
              <Users className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">
                No users available. Please add user schedules first.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendar View
          </CardTitle>
          <CardDescription>
            Visual calendar showing availability, busy periods, and booked
            meetings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select User</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select user..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      User {user.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {calendarData && (
        <div className="flex gap-6">
          <Card className="p-5">
            <CardContent className="p-1">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md"
              />
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Busy</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Meeting</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Thu 12
                  </CardTitle>
                  <CardDescription>
                    User {calendarData.id} Schedule
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={timeFormat === "12h" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeFormat("12h")}
                  >
                    12h
                  </Button>
                  <Button
                    variant={timeFormat === "24h" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeFormat("24h")}
                  >
                    24h
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {mergedSlots.map((slot, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-2 rounded-lg border ${
                      slot.status === "available"
                        ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                        : slot.status === "busy"
                        ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                        : "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        slot.status === "available"
                          ? "bg-green-500"
                          : slot.status === "busy"
                          ? "bg-red-500"
                          : "bg-blue-500"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {formatTimeDisplay(slot.start)} -{" "}
                        {formatTimeDisplay(
                          minutesToTime(timeToMinutes(slot.end) + 15)
                        )}
                      </div>
                      {slot.title && (
                        <div className="text-xs text-muted-foreground">
                          {slot.title}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={
                        slot.status === "available"
                          ? "secondary"
                          : slot.status === "busy"
                          ? "destructive"
                          : "default"
                      }
                      className="text-xs"
                    >
                      {slot.status === "available"
                        ? "Free"
                        : slot.status === "busy"
                        ? "Busy"
                        : "Meeting"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
