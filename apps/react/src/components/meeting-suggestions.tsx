import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Calendar, Clock, BookOpen } from "lucide-react";
const API_URL = import.meta.env.VITE_API_URL;
export function MeetingSuggestions() {
  const [duration, setDuration] = useState("30");
  const [suggestions, setSuggestions] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingTitle, setBookingTitle] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string[] | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  const findMeetings = async () => {
    setIsLoading(true);
    try {
      let url = `${API_URL}/suggest?duration=${duration}`;
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get suggestions");
      }
      const data = await response.json();
      setSuggestions(data);
      if (data.length === 0) {
        toast.info("No meeting slots found", {
          description: "Try a shorter duration or update user schedules",
        });
      } else {
        toast.success(
          `Found ${data.length} available meeting slot${
            data.length !== 1 ? "s" : ""
          }`,
          {
            description: "Select a slot to book your meeting",
          }
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get suggestions";
      toast.error("Failed to find meetings", {
        description: message,
      });
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const bookMeeting = async () => {
    if (!selectedSlot) return;
    setIsBooking(true);
    try {
      const response = await fetch(`${API_URL}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime: selectedSlot[0],
          endTime: selectedSlot[1],
          title: bookingTitle || "Meeting",
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to book meeting");
      }
      const result = await response.json();
      toast.success("Meeting booked successfully!", {
        description: `${result.meeting.title} scheduled for ${selectedSlot[0]} - ${selectedSlot[1]}`,
      });
      setSelectedSlot(null);
      setBookingTitle("");
      findMeetings();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to book meeting";
      toast.error("Booking failed", {
        description: message,
      });
    } finally {
      setIsBooking(false);
    }
  };

  const formatTimeDisplay = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Meeting Slots
          </CardTitle>
          <CardDescription>
            Search for available time slots that work for a selected user
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="space-y-2 flex-1 max-w-xs">
              <Label htmlFor="duration">Meeting Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="15"
                max="480"
                step="15"
              />
            </div>
            <Button onClick={findMeetings} disabled={isLoading}>
              {isLoading ? "Searching..." : "Find Available Slots"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Available Meeting Slots
            </CardTitle>
            <CardDescription>
              Found {suggestions.length} slot
              {suggestions.length !== 1 ? "s" : ""} where all users are free for{" "}
              {duration} minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slot</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((slot, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge variant="secondary">Option {index + 1}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatTimeDisplay(slot[0])}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatTimeDisplay(slot[1])}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {duration} mins
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setSelectedSlot(slot)}
                          >
                            <BookOpen className="h-4 w-4 mr-1" />
                            Book
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Book Meeting</DialogTitle>
                            <DialogDescription>
                              Schedule your meeting for{" "}
                              {formatTimeDisplay(slot[0])} -{" "}
                              {formatTimeDisplay(slot[1])}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="title">Meeting Title</Label>
                              <Input
                                id="title"
                                value={bookingTitle}
                                onChange={(e) =>
                                  setBookingTitle(e.target.value)
                                }
                                placeholder="Enter meeting title..."
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={bookMeeting} disabled={isBooking}>
                              {isBooking ? "Booking..." : "Confirm Booking"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
