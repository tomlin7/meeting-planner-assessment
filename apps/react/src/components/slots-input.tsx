import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  User,
  Clock,
  Plus,
  Settings2,
  Trash2,
  Check,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface SlotsInputProps {
  onUsersUpdate: (users: any[]) => void;
}

const exampleJSON = {
  users: [
    {
      id: 1,
      busy: [
        ["09:00", "10:30"],
        ["13:00", "14:00"],
      ],
    },
    {
      id: 2,
      busy: [
        ["11:00", "12:00"],
        ["15:00", "16:00"],
      ],
    },
    {
      id: 3,
      busy: [
        ["09:30", "11:00"],
        ["14:30", "15:30"],
      ],
    },
  ],
};

const API_URL = import.meta.env.VITE_API_URL;

export function SlotsInput({ onUsersUpdate }: SlotsInputProps) {
  const [jsonInput, setJsonInput] = useState(
    JSON.stringify(exampleJSON, null, 2)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [currentUsers, setCurrentUsers] = useState<any[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [widgetUsers, setWidgetUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchCurrentUsers = async () => {
      try {
        const response = await fetch(API_URL + "/users");
        if (response.ok) {
          const data = await response.json();
          setCurrentUsers(data);
          onUsersUpdate(data);
        }
      } catch (e) {}
    };
    fetchCurrentUsers();
  }, []);

  useEffect(() => {
    try {
      const data = JSON.parse(jsonInput);
      if (data.users) setWidgetUsers(data.users);
    } catch {}
  }, [jsonInput]);

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const data = JSON.parse(jsonInput);

      if (!data.users || !Array.isArray(data.users)) {
        throw new Error("Invalid format: users array is required");
      }

      const response = await fetch(`${API_URL}/slots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update schedules");
      }

      const result = await response.json();
      setCurrentUsers(data.users);
      onUsersUpdate(data.users);

      toast.success(
        `Successfully updated schedules for ${result.userCount} users`,
        {
          description: "You can now find meeting suggestions",
        }
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid JSON format";
      toast.error("Failed to update schedules", {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadExample = () => {
    setJsonInput(JSON.stringify(exampleJSON, null, 2));
  };

  const handleWidgetSave = () => {
    setJsonInput(JSON.stringify({ users: widgetUsers }, null, 2));
    setPopoverOpen(false);
  };

  const addUser = () => {
    setWidgetUsers((prev) => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map((u) => u.id)) + 1 : 1,
        busy: [],
      },
    ]);
  };
  const removeUser = (id: number) => {
    setWidgetUsers((prev) => prev.filter((u) => u.id !== id));
  };
  const addBusySlot = (userId: number) => {
    setWidgetUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, busy: [...u.busy, ["09:00", "10:00"]] } : u
      )
    );
  };
  const removeBusySlot = (userId: number, idx: number) => {
    setWidgetUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, busy: u.busy.filter((_: any, i: number) => i !== idx) }
          : u
      )
    );
  };
  const updateBusySlot = (
    userId: number,
    idx: number,
    val: [string, string]
  ) => {
    setWidgetUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              busy: u.busy.map((slot: any, i: number) =>
                i === idx ? val : slot
              ),
            }
          : u
      )
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              User Schedules
            </CardTitle>
            <CardDescription>
              Enter the busy time slots for each user in JSON format. Working
              hours: 09:00 - 18:00 IST
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="json-input">Schedule Data (JSON)</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={loadExample}>
                    Load Example
                  </Button>
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0 text-muted-foreground"
                        title="Configure visually"
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-100">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-semibold text-sm">
                          Configure Users & Times
                        </span>
                        <Button size="sm" variant="outline" onClick={addUser}>
                          <Plus className="h-4 w-4 mr-1" /> Add User
                        </Button>
                      </div>
                      <div className="space-y-4 max-h-64 overflow-y-auto">
                        {widgetUsers.map((user, uidx) => (
                          <div
                            key={user.id}
                            className="border rounded p-2 mb-2"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">
                                User {user.id}
                              </span>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeUser(user.id)}
                                title="Remove user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-1">
                              {user.busy.map(
                                (slot: [string, string], sidx: number) => (
                                  <div
                                    key={sidx}
                                    className="flex gap-2 items-center justify-around"
                                  >
                                    <div className="flex gap-2 items-center justify-center">
                                      <Input
                                        type="time"
                                        value={slot[0]}
                                        onChange={(e) =>
                                          updateBusySlot(user.id, sidx, [
                                            e.target.value,
                                            slot[1],
                                          ])
                                        }
                                        className="w-full"
                                      />
                                      <span>-</span>
                                      <Input
                                        type="time"
                                        value={slot[1]}
                                        onChange={(e) =>
                                          updateBusySlot(user.id, sidx, [
                                            slot[0],
                                            e.target.value,
                                          ])
                                        }
                                        className="w-full"
                                      />
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        removeBusySlot(user.id, sidx)
                                      }
                                      title="Remove slot"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )
                              )}
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => addBusySlot(user.id)}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Add Busy Slot
                              </Button>
                            </div>
                          </div>
                        ))}
                        {widgetUsers.length === 0 && (
                          <div className="text-muted-foreground text-sm">
                            No users yet.
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button
                          size="sm"
                          onClick={handleWidgetSave}
                          title="Save"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <Textarea
                id="json-input"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={12}
                className="font-mono text-sm"
                placeholder="Enter JSON data..."
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Updating..." : "Update Schedules"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Current Users
            </CardTitle>
            <CardDescription>
              Overview of loaded user schedules and their busy periods
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No users loaded. Please enter schedule data above.
              </p>
            ) : (
              <div className="space-y-4">
                {currentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">User {user.id}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {user.busy.length} busy period
                        {user.busy.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.busy.map((slot: string[], index: number) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {slot[0]} - {slot[1]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
