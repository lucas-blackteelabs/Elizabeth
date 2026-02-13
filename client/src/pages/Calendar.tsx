import { useState } from "react";
import { Heading } from "@/components/ui/heading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Stethoscope,
  Pill,
  CalendarPlus,
  MapPin,
  Clock,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Appointment, TreatmentSession, TreatmentProgram } from "@shared/schema";

interface TimelineEvent {
  id: string;
  type: "appointment" | "treatment";
  title: string;
  description?: string | null;
  date: string;
  time?: string | null;
  location?: string | null;
  status?: string | null;
  appointmentId?: number;
  sessionNumber?: number;
  programName?: string;
}

interface AppointmentFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
}

const emptyForm: AppointmentFormData = {
  title: "",
  description: "",
  date: "",
  time: "",
  location: "",
};

export default function Calendar() {
  const { user, dataUserId } = useUser();
  const { toast } = useToast();
  const userId = dataUserId;

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formData, setFormData] = useState<AppointmentFormData>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [weeksToShow, setWeeksToShow] = useState(1);
  const [createdApptId, setCreatedApptId] = useState<number | null>(null);
  const [createdApptTitle, setCreatedApptTitle] = useState("");

  const { data: appointments = [], isLoading: loadingAppts } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", userId],
    queryFn: () => apiRequest(`/api/appointments?userId=${userId}`),
  });

  const { data: sessions = [], isLoading: loadingSessions } = useQuery<TreatmentSession[]>({
    queryKey: ["/api/treatment-sessions", userId],
    queryFn: () => apiRequest(`/api/treatment-sessions?userId=${userId}`),
  });

  const { data: programs = [] } = useQuery<TreatmentProgram[]>({
    queryKey: ["/api/treatment-programs", userId],
    queryFn: () => apiRequest(`/api/treatment-programs?userId=${userId}`),
  });

  const createMutation = useMutation({
    mutationFn: (data: AppointmentFormData) =>
      apiRequest<Appointment>("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId }),
      }),
    onSuccess: (newAppt: Appointment) => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments", userId] });
      setCreateOpen(false);
      setCreatedApptId(newAppt.id);
      setCreatedApptTitle(formData.title);
      setFormData(emptyForm);
    },
    onError: () => toast({ title: "Failed to create appointment", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AppointmentFormData }) =>
      apiRequest(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments", userId] });
      setEditOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
      toast({ title: "Appointment updated" });
    },
    onError: () => toast({ title: "Failed to update appointment", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/appointments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments", userId] });
      setDeleteOpen(false);
      setDeletingId(null);
      toast({ title: "Appointment deleted" });
    },
    onError: () => toast({ title: "Failed to delete appointment", variant: "destructive" }),
  });

  const programMap = new Map(programs.map((p) => [p.id, p.name]));

  const timelineEvents: TimelineEvent[] = [
    ...appointments.map((a) => ({
      id: `appt-${a.id}`,
      type: "appointment" as const,
      title: a.title,
      description: a.description,
      date: a.date,
      time: a.time,
      location: a.location,
      appointmentId: a.id,
    })),
    ...sessions
      .filter((s) => s.date)
      .map((s) => ({
        id: `session-${s.id}`,
        type: "treatment" as const,
        title: programMap.get(s.programId) || `Treatment Session`,
        description: s.notes,
        date: s.date!,
        time: s.time,
        location: null,
        status: s.status,
        sessionNumber: s.sessionNumber,
        programName: programMap.get(s.programId) || undefined,
      })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const today = new Date().toISOString().split("T")[0];

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + weeksToShow * 7);
  const endDateStr = endDate.toISOString().split("T")[0];

  const visibleEvents = timelineEvents.filter(ev => ev.date >= today && ev.date <= endDateStr);
  const hasMoreEvents = timelineEvents.some(ev => ev.date > endDateStr);

  const grouped = visibleEvents.reduce<Record<string, TimelineEvent[]>>((acc, ev) => {
    const d = new Date(ev.date + "T00:00:00");
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  const sortedMonths = Object.keys(grouped).sort();

  const isLoading = loadingAppts || loadingSessions;

  const getEventColor = (type: string) => {
    if (type === "appointment") return { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary", badge: "bg-primary/15 text-primary" };
    return { bg: "bg-amber-50", border: "border-amber-300/30", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" };
  };

  const getDateStatus = (dateStr: string) => {
    if (dateStr < today) return "past";
    if (dateStr === today) return "today";
    return "future";
  };

  const formatMonthYear = (key: string) => {
    const [year, month] = key.split("-");
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-AU", {
      month: "long",
      year: "numeric",
    });
  };

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return { day: d.getDate(), month: d.toLocaleDateString("en-AU", { month: "short" }).toUpperCase() };
  };

  const handleEdit = (appt: Appointment) => {
    setFormData({
      title: appt.title,
      description: appt.description || "",
      date: appt.date,
      time: appt.time,
      location: appt.location || "",
    });
    setEditingId(appt.id);
    setEditOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    setDeleteOpen(true);
  };

  const renderForm = (onSubmit: () => void, isPending: boolean) => (
    <div className="space-y-4">
      <div>
        <Label className="font-body text-sm">Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Oncology Review"
          className="mt-1"
        />
      </div>
      <div>
        <Label className="font-body text-sm">Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
          placeholder="Optional notes..."
          className="mt-1"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="font-body text-sm">Date</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="font-body text-sm">Time</Label>
          <Input
            value={formData.time}
            onChange={(e) => setFormData((f) => ({ ...f, time: e.target.value }))}
            placeholder="e.g. 10:30 AM"
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label className="font-body text-sm">Location</Label>
        <Input
          value={formData.location}
          onChange={(e) => setFormData((f) => ({ ...f, location: e.target.value }))}
          placeholder="e.g. Radiology Department"
          className="mt-1"
        />
      </div>
      <Button
        onClick={onSubmit}
        disabled={isPending || !formData.title || !formData.date || !formData.time}
        className="w-full"
      >
        {isPending ? "Saving..." : editingId ? "Update Appointment" : "Create Appointment"}
      </Button>
    </div>
  );

  return (
    <div className="p-6 lg:p-8">
      <Heading
        title="Timeline"
        description="Your appointments, treatments, and upcoming events"
      >
        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) setFormData(emptyForm); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Appointment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">New Appointment</DialogTitle>
            </DialogHeader>
            {renderForm(() => createMutation.mutate(formData), createMutation.isPending)}
          </DialogContent>
        </Dialog>
      </Heading>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-16 w-14 rounded-lg" />
              <Skeleton className="h-24 flex-1 rounded-lg" />
            </div>
          ))}
        </div>
      ) : visibleEvents.length === 0 ? (
        <Card className="bg-white border-border p-12 text-center">
          <CalendarPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading text-lg text-foreground mb-2">Nothing this week</h3>
          <p className="text-muted-foreground font-body text-sm mb-6">
            {hasMoreEvents ? "You have events coming up later." : "Add your first appointment to start building your timeline."}
          </p>
          <div className="flex gap-3 justify-center">
            {hasMoreEvents && (
              <Button variant="outline" onClick={() => setWeeksToShow(w => w + 1)} className="gap-2">
                See next week
              </Button>
            )}
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Appointment
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-10">
          {sortedMonths.map((monthKey) => (
            <div key={monthKey}>
              <h2 className="font-heading text-lg text-accent mb-5 tracking-wide">
                {formatMonthYear(monthKey)}
              </h2>

              <div className="relative">
                <div className="absolute left-[2.125rem] top-2 bottom-2 w-px bg-border md:left-[2.625rem]" />

                <div className="space-y-4">
                  {grouped[monthKey].map((event, idx) => {
                    const { day, month } = formatDay(event.date);
                    const status = getDateStatus(event.date);
                    const colors = getEventColor(event.type);
                    const appt = event.appointmentId
                      ? appointments.find((a) => a.id === event.appointmentId)
                      : null;

                    const prevEvent = idx > 0 ? grouped[monthKey][idx - 1] : null;
                    const dayGap = prevEvent
                      ? Math.min(
                          Math.max(
                            (new Date(event.date).getTime() - new Date(prevEvent.date).getTime()) /
                              (1000 * 60 * 60 * 24),
                            0
                          ),
                          14
                        )
                      : 0;
                    const spacingStyle = dayGap > 2 ? { marginTop: `${Math.min(dayGap * 4, 56)}px` } : {};

                    return (
                      <div
                        key={event.id}
                        className={`relative flex gap-3 md:gap-4 ${status === "past" ? "opacity-60" : ""}`}
                        style={spacingStyle}
                      >
                        <div
                          className={`relative z-10 flex flex-col items-center justify-center w-[4.25rem] h-[4.25rem] md:w-[5.25rem] md:h-[5.25rem] rounded-xl border-2 shrink-0 ${
                            status === "today"
                              ? "bg-primary text-white border-primary shadow-md"
                              : `bg-white ${colors.border} border`
                          }`}
                        >
                          <span
                            className={`text-[0.65rem] font-body font-semibold uppercase leading-none ${
                              status === "today" ? "text-white/80" : "text-muted-foreground"
                            }`}
                          >
                            {month}
                          </span>
                          <span
                            className={`text-xl md:text-2xl font-heading font-bold leading-tight ${
                              status === "today" ? "text-white" : "text-foreground"
                            }`}
                          >
                            {day}
                          </span>
                        </div>

                        <Card
                          className={`flex-1 bg-white border-border p-4 ${
                            status === "today" ? "ring-2 ring-primary/20 shadow-sm" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-heading text-foreground text-base truncate">
                                  {event.title}
                                </h3>
                                <Badge variant="outline" className={`text-[0.65rem] px-2 py-0 ${colors.badge} border-0`}>
                                  {event.type === "appointment" ? (
                                    <><Stethoscope className="h-3 w-3 mr-1" />Appointment</>
                                  ) : (
                                    <><Pill className="h-3 w-3 mr-1" />Treatment</>
                                  )}
                                </Badge>
                                {event.sessionNumber && (
                                  <span className="text-xs text-muted-foreground font-body">
                                    Session {event.sessionNumber}
                                  </span>
                                )}
                                {status === "today" && (
                                  <Badge className="bg-primary text-white text-[0.6rem] px-1.5 py-0">Today</Badge>
                                )}
                              </div>

                              {event.time && (
                                <p className="text-sm text-muted-foreground font-body flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {event.time}
                                </p>
                              )}
                              {event.location && (
                                <p className="text-sm text-muted-foreground font-body flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {event.location}
                                </p>
                              )}
                              {event.description && (
                                <p className="text-sm text-muted-foreground font-body mt-1 line-clamp-2">
                                  {event.description}
                                </p>
                              )}
                              {event.status && event.type === "treatment" && (
                                <Badge variant="outline" className="mt-1.5 text-xs capitalize">
                                  {event.status}
                                </Badge>
                              )}
                            </div>

                            {event.type === "appointment" && appt && (
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <a
                                  href={`/api/appointments/${appt.id}/ics`}
                                  download
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-body font-medium transition-colors"
                                >
                                  <CalendarPlus className="h-3.5 w-3.5" />
                                  Add to Calendar
                                </a>
                                <div className="flex items-center gap-0.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleEdit(appt)}
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleDelete(appt.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {hasMoreEvents && (
            <div className="text-center pt-4">
              <Button variant="outline" onClick={() => setWeeksToShow(w => w + 1)} className="gap-2 rounded-xl font-body">
                See more
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { setEditingId(null); setFormData(emptyForm); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Appointment</DialogTitle>
          </DialogHeader>
          {renderForm(
            () => editingId && updateMutation.mutate({ id: editingId, data: formData }),
            updateMutation.isPending
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this appointment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!createdApptId} onOpenChange={(open) => { if (!open) { setCreatedApptId(null); setCreatedApptTitle(""); } }}>
        <DialogContent className="sm:max-w-sm text-center">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CalendarPlus className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="font-heading text-lg text-foreground mb-1">Appointment Created</h3>
              <p className="text-sm text-muted-foreground font-body">{createdApptTitle}</p>
            </div>
            <a
              href={`/api/appointments/${createdApptId}/ics`}
              download
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-body font-medium text-sm hover:bg-primary/90 transition-colors shadow-md w-full justify-center"
            >
              <CalendarPlus className="h-4 w-4" />
              Add to Your Calendar
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setCreatedApptId(null); setCreatedApptTitle(""); }}
              className="text-muted-foreground font-body text-xs"
            >
              Skip for now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
