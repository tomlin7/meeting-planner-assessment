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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Calendar, Clock, RefreshCw, Users } from "lucide-react";

interface Meeting {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  bookedAt: string;
}
const API_URL = import.meta.env.VITE_API_URL;
export function BookedMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load meetings on component mount
  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/meetings`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to load meetings");
      }

      const data = await response.json();
      setMeetings(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load meetings";
      toast.error("Failed to load meetings", {
        description: message,
      });
      setMeetings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeDisplay = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const formatDateTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString();
  };

  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    return endTotalMinutes - startTotalMinutes;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Booked Meetings
          </CardTitle>
          <CardDescription>
            View all confirmed meetings and their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {meetings.length} meeting{meetings.length !== 1 ? "s" : ""}{" "}
                scheduled
              </span>
            </div>
            <Button
              onClick={loadMeetings}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          {meetings.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No meetings booked yet</p>
              <p className="text-sm text-muted-foreground">
                Use the "Find Meetings" section to schedule new meetings
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meeting Title</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Booked At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell className="font-medium">
                      {meeting.title}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatTimeDisplay(meeting.startTime)} -{" "}
                        {formatTimeDisplay(meeting.endTime)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {calculateDuration(meeting.startTime, meeting.endTime)}{" "}
                        mins
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">Confirmed</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(meeting.bookedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
