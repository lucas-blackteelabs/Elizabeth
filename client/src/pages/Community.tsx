import { useState, type MouseEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, MessageCircle, Heart, ArrowLeft, Send, Users, Sparkles,
  Loader2, Pin, Trash2, Flame, Leaf, Brain, HelpCircle, ShieldCheck,
  Calendar, Clock, Video, Star, ChevronRight, CalendarCheck, X, Mic,
  Shield, Apple, Sun, Dumbbell, LogOut, UserPlus, Download
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CommunityThread, CommunityReply, Survivor, SurvivorAvailability, SurvivorTalk, SurvivorTalkRsvp, CommunityGroup, CommunityGroupMember, CommunityGroupPost, CommunityGroupPostReply } from "@shared/schema";

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Flame }> = {
  general: { label: "General", color: "text-slate-600", bg: "bg-slate-50", icon: MessageCircle },
  treatment: { label: "Treatment", color: "text-blue-600", bg: "bg-blue-50", icon: Sparkles },
  nutrition: { label: "Nutrition", color: "text-green-600", bg: "bg-green-50", icon: Leaf },
  "mind-body": { label: "Mind & Body", color: "text-purple-600", bg: "bg-purple-50", icon: Brain },
  support: { label: "Support", color: "text-pink-600", bg: "bg-pink-50", icon: Heart },
  questions: { label: "Questions", color: "text-amber-600", bg: "bg-amber-50", icon: HelpCircle },
  wins: { label: "Wins & Milestones", color: "text-emerald-600", bg: "bg-emerald-50", icon: Flame },
};

const TALK_CATEGORIES: Record<string, { label: string; color: string; bg: string; icon: typeof Flame }> = {
  wellness: { label: "Wellness", color: "text-teal-600", bg: "bg-teal-50", icon: Heart },
  education: { label: "Education", color: "text-blue-600", bg: "bg-blue-50", icon: Brain },
  nutrition: { label: "Nutrition", color: "text-green-600", bg: "bg-green-50", icon: Leaf },
  support: { label: "Support", color: "text-pink-600", bg: "bg-pink-50", icon: Heart },
  general: { label: "General", color: "text-slate-600", bg: "bg-slate-50", icon: MessageCircle },
};

function getCat(category: string) {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general;
}

function getTalkCat(category: string) {
  return TALK_CATEGORIES[category] || TALK_CATEGORIES.general;
}

function timeAgo(date: string | Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatDateTime(dateStr: string | Date) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) +
    " at " + d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Australia/Sydney' });
}

function SurvivorBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-50 border border-amber-200/60 text-amber-700 text-[10px] font-body font-semibold">
      <ShieldCheck className="h-3 w-3" />
      Verified Survivor
    </span>
  );
}

function AdminBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-50 border border-amber-200/60 text-amber-700 text-[10px] font-body font-semibold">
      <Shield className="h-3 w-3" />
      Admin
    </span>
  );
}

function UserProfilePopup({ userId, open, onClose }: {
  userId: number;
  open: boolean;
  onClose: () => void;
}) {
  const { data: profile, isLoading } = useQuery<{
    id: number; displayName: string; cancerType: string | null; cancerStage: string | null;
    treatmentStatus: string | null; bio: string | null; diagnosis_date: string | null; role: string;
  }>({
    queryKey: ["/api/users", userId, "public-profile"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/public-profile`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: open,
  });

  const daysSinceDiagnosis = profile?.diagnosis_date
    ? Math.floor((Date.now() - new Date(profile.diagnosis_date + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white border-border max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">Member Profile</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
            <Skeleton className="h-5 w-32 mx-auto rounded-xl" />
            <Skeleton className="h-4 w-48 mx-auto rounded-xl" />
          </div>
        ) : profile ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading font-bold text-2xl">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-base font-heading font-semibold text-foreground">{profile.displayName}</span>
                  {profile.role === "admin" && <AdminBadge />}
                </div>
              </div>
            </div>
            <div className="space-y-2.5 bg-muted/30 rounded-xl p-3.5">
              {profile.cancerType && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-body text-muted-foreground">Cancer Type</span>
                  <span className="text-xs font-body font-medium text-foreground">{profile.cancerType}</span>
                </div>
              )}
              {profile.cancerStage && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-body text-muted-foreground">Stage</span>
                  <span className="text-xs font-body font-medium text-foreground">{profile.cancerStage}</span>
                </div>
              )}
              {profile.treatmentStatus && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-body text-muted-foreground">Treatment</span>
                  <span className="text-xs font-body font-medium text-foreground">{profile.treatmentStatus}</span>
                </div>
              )}
              {daysSinceDiagnosis !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-body text-muted-foreground">Days Since Diagnosis</span>
                  <span className="text-xs font-body font-medium text-primary">{daysSinceDiagnosis} days</span>
                </div>
              )}
            </div>
            {profile.bio && (
              <div>
                <p className="text-xs font-body text-muted-foreground mb-1">About</p>
                <p className="text-sm font-body text-foreground/80 leading-relaxed">{profile.bio}</p>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ClickableAuthor({ name, userId, onClick, isAdmin }: {
  name: string; userId: number; onClick: (userId: number) => void; isAdmin?: boolean;
}) {
  return (
    <button
      onClick={(e: MouseEvent) => { e.stopPropagation(); onClick(userId); }}
      className="text-xs font-body font-medium text-foreground hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1.5"
    >
      {name}
      {isAdmin && <AdminBadge />}
    </button>
  );
}

function SurvivorAvatar({ name, featured }: { name: string; featured?: boolean | null }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className={`relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-heading font-bold text-lg ${
      featured
        ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-md shadow-amber-200/50"
        : "bg-gradient-to-br from-primary/80 to-primary text-white shadow-sm"
    }`}>
      {initial}
      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white">
        <ShieldCheck className="h-2.5 w-2.5 text-white" />
      </div>
    </div>
  );
}

function SurvivorCard({ survivor, onClick }: { survivor: Survivor; onClick: () => void }) {
  return (
    <Card className="bg-white border-border rounded-2xl hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden"
      onClick={onClick}>
      {survivor.featured && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50/50 px-4 py-1.5 border-b border-amber-100/50">
          <div className="flex items-center gap-1.5">
            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
            <span className="text-[10px] font-body font-semibold text-amber-600 uppercase tracking-wider">Featured Survivor</span>
          </div>
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <SurvivorAvatar name={survivor.name} featured={survivor.featured} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-body font-semibold text-foreground">{survivor.name}</span>
              <SurvivorBadge />
            </div>
            <p className="text-xs font-body text-muted-foreground mb-0.5">{survivor.cancerType} &middot; {survivor.yearsSurvivor}+ years</p>
            <p className="text-xs font-body text-foreground/70 line-clamp-2 mt-1">{survivor.bio}</p>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {(survivor.expertise || []).slice(0, 3).map(tag => (
                <span key={tag} className="text-[9px] font-body px-2 py-0.5 rounded-full bg-primary/8 text-primary/70 border border-primary/10">
                  {tag}
                </span>
              ))}
              {(survivor.expertise || []).length > 3 && (
                <span className="text-[9px] font-body text-muted-foreground/60">+{(survivor.expertise || []).length - 3} more</span>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/60 transition-colors flex-shrink-0 mt-2" />
        </div>
      </CardContent>
    </Card>
  );
}

function SurvivorProfile({ survivor, onBack, userId }: { survivor: Survivor; onBack: () => void; userId: number }) {
  const { toast } = useToast();
  const [bookingSlot, setBookingSlot] = useState<SurvivorAvailability | null>(null);
  const [bookingNotes, setBookingNotes] = useState("");

  const { data: slots = [], isLoading: slotsLoading } = useQuery<SurvivorAvailability[]>({
    queryKey: ["/api/survivors", survivor.id, "availability"],
    queryFn: async () => {
      const res = await fetch(`/api/survivors/${survivor.id}/availability`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const availableSlots = slots.filter(s => !s.booked);

  const slotsByDate = availableSlots.reduce((acc: Record<string, SurvivorAvailability[]>, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!bookingSlot) throw new Error("No slot selected");
      return apiRequest("/api/survivor-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: bookingSlot.id,
          survivorId: survivor.id,
          userId,
          notes: bookingNotes || null,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/survivors", survivor.id, "availability"] });
      queryClient.invalidateQueries({ queryKey: ["/api/survivor-bookings"] });
      toast({ title: "Session booked!", description: `You're booked in with ${survivor.name}. Check your calendar for details.` });
      setBookingSlot(null);
      setBookingNotes("");
    },
    onError: () => {
      toast({ title: "Couldn't book", description: "Something went wrong. Please try again.", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground font-body text-xs -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Survivors
      </Button>

      <Card className="bg-white border-border rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary/5 via-amber-50/40 to-primary/5 p-5 border-b border-border/50">
          <div className="flex items-start gap-4">
            <SurvivorAvatar name={survivor.name} featured={survivor.featured} />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-heading text-foreground">{survivor.name}</h2>
                <SurvivorBadge />
              </div>
              <p className="text-xs font-body text-muted-foreground mt-0.5">
                {survivor.cancerType} &middot; {survivor.yearsSurvivor}+ years survivor &middot; <Video className="h-3 w-3 inline" /> Video sessions
              </p>
            </div>
          </div>
        </div>
        <CardContent className="p-5">
          <p className="text-sm font-body text-foreground/80 leading-relaxed">{survivor.bio}</p>
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {(survivor.expertise || []).map(tag => (
              <span key={tag} className="text-[10px] font-body px-2.5 py-1 rounded-full bg-primary/8 text-primary/80 border border-primary/10">
                {tag}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-sm font-heading text-foreground mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" /> Available Times
        </h3>
        {slotsLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : Object.keys(slotsByDate).length === 0 ? (
          <Card className="bg-muted/30 border-border/50 rounded-2xl">
            <CardContent className="py-8 text-center">
              <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs font-body text-muted-foreground">No available times right now. Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {Object.entries(slotsByDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, dateSlots]) => (
              <Card key={date} className="bg-white border-border rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-xs font-body font-medium text-foreground mb-2.5 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    {formatDate(date)}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {dateSlots.map(slot => (
                      <button key={slot.id} onClick={() => setBookingSlot(slot)}
                        className="px-3 py-1.5 rounded-xl text-xs font-body bg-primary/8 text-primary hover:bg-primary/15 border border-primary/15 hover:border-primary/30 transition-all flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {slot.startTime} - {slot.endTime}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!bookingSlot} onOpenChange={() => setBookingSlot(null)}>
        <DialogContent className="bg-white border-border max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">Book a Session</DialogTitle>
          </DialogHeader>
          {bookingSlot && (
            <div className="space-y-4">
              <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                <div className="flex items-center gap-2">
                  <SurvivorAvatar name={survivor.name} featured={false} />
                  <div>
                    <p className="text-sm font-body font-medium">{survivor.name}</p>
                    <p className="text-xs font-body text-muted-foreground">
                      {formatDate(bookingSlot.date)} &middot; {bookingSlot.startTime} - {bookingSlot.endTime}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-body text-muted-foreground">Anything you'd like to discuss? (optional)</label>
                <Textarea value={bookingNotes} onChange={e => setBookingNotes(e.target.value)}
                  placeholder="E.g. managing scanxiety, nutrition tips, just want to chat..."
                  className="font-body rounded-xl resize-none mt-1" rows={3} />
              </div>
              <Button onClick={() => bookMutation.mutate()} disabled={bookMutation.isPending}
                className="w-full bg-primary text-white hover:bg-primary/90 font-body rounded-xl">
                {bookMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarCheck className="h-4 w-4 mr-2" />}
                Confirm Booking
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TalkCard({ talk, survivor, isRsvpd, onRsvp, onCancelRsvp, isPending }: {
  talk: SurvivorTalk;
  survivor?: Survivor;
  isRsvpd: boolean;
  onRsvp: () => void;
  onCancelRsvp: () => void;
  isPending: boolean;
}) {
  const cat = getTalkCat(talk.category || "general");
  const CatIcon = cat.icon;
  const isFuture = new Date(talk.scheduledAt) > new Date();
  const spotsLeft = talk.capacity ? talk.capacity - (talk.rsvpCount || 0) : null;

  return (
    <Card className={`bg-white border-border rounded-2xl overflow-hidden transition-all ${!isFuture ? "opacity-60" : ""}`}>
      <div className="bg-gradient-to-r from-primary/5 via-transparent to-amber-50/30 px-4 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Badge className={`text-[9px] font-body ${cat.bg} ${cat.color} border-0`}>
            <CatIcon className="h-2.5 w-2.5 mr-1" /> {cat.label}
          </Badge>
          {!isFuture && <Badge className="text-[9px] font-body bg-muted text-muted-foreground border-0">Past</Badge>}
          {spotsLeft !== null && spotsLeft <= 5 && isFuture && (
            <Badge className="text-[9px] font-body bg-red-50 text-red-600 border-0">
              {spotsLeft <= 0 ? "Full" : `${spotsLeft} spots left`}
            </Badge>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-1">{talk.title}</h3>
        <p className="text-xs font-body text-foreground/70 line-clamp-2 mb-3">{talk.description}</p>
        <div className="flex items-center gap-3 text-[10px] font-body text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {formatDateTime(talk.scheduledAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {talk.durationMinutes}min
          </span>
          {talk.rsvpCount !== null && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {talk.rsvpCount} attending
            </span>
          )}
        </div>
        {survivor && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-muted/30 rounded-xl">
            <SurvivorAvatar name={survivor.name} featured={survivor.featured} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-body font-medium">{survivor.name}</span>
                <SurvivorBadge />
              </div>
              <p className="text-[10px] font-body text-muted-foreground">{survivor.cancerType}</p>
            </div>
          </div>
        )}
        {isFuture && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {isRsvpd ? (
                <>
                  <div className="flex-1 flex items-center gap-1.5 px-3 py-1.5 bg-primary/8 text-primary rounded-xl text-xs font-body">
                    <CalendarCheck className="h-3.5 w-3.5" /> You're attending
                  </div>
                  <Button variant="ghost" size="sm" onClick={onCancelRsvp} disabled={isPending}
                    className="text-muted-foreground hover:text-red-500 text-xs h-8 px-2">
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                  </Button>
                </>
              ) : (
                <Button onClick={onRsvp} disabled={isPending || (spotsLeft !== null && spotsLeft <= 0)}
                  className="bg-primary text-white hover:bg-primary/90 font-body rounded-xl text-xs h-9 flex-1">
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CalendarCheck className="h-3.5 w-3.5 mr-1.5" />}
                  {spotsLeft !== null && spotsLeft <= 0 ? "Full" : "RSVP to Attend"}
                </Button>
              )}
            </div>
            {isRsvpd && (
              <a
                href={`/api/survivor-talks/${talk.id}/calendar`}
                download
                className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl text-xs font-body transition-colors"
              >
                <Download className="h-3.5 w-3.5" /> Download Calendar Invite
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ThreadCard({ thread, onClick, onAuthorClick }: { thread: CommunityThread; onClick: () => void; onAuthorClick: (userId: number) => void }) {
  const cat = getCat(thread.category);
  const CatIcon = cat.icon;

  return (
    <Card className="bg-white border-border rounded-2xl hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading font-bold text-sm">
            {thread.authorName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <ClickableAuthor name={thread.authorName} userId={thread.userId} onClick={onAuthorClick} isAdmin={(thread as any).authorRole === "admin"} />
              <span className="text-[10px] font-body text-muted-foreground/60">&middot;</span>
              <span className="text-[10px] font-body text-muted-foreground/60">{timeAgo(thread.createdAt)}</span>
              {thread.pinned && <Pin className="h-3 w-3 text-accent" />}
            </div>
            <h3 className="text-sm font-body font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {thread.title}
            </h3>
            <p className="text-xs font-body text-muted-foreground mt-1 line-clamp-2">{thread.content}</p>
            <div className="flex items-center gap-3 mt-2">
              <Badge className={`text-[9px] font-body ${cat.bg} ${cat.color} border-0`}>
                <CatIcon className="h-2.5 w-2.5 mr-1" />
                {cat.label}
              </Badge>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MessageCircle className="h-3 w-3" />
                <span className="text-[10px] font-body">{thread.repliesCount || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Heart className="h-3 w-3" />
                <span className="text-[10px] font-body">{thread.likesCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ThreadDetailView({ thread: initialThread, onBack, userId, userName, onAuthorClick }: {
  thread: CommunityThread;
  onBack: () => void;
  userId: number;
  userName: string;
  onAuthorClick: (userId: number) => void;
}) {
  const { toast } = useToast();
  const [replyText, setReplyText] = useState("");

  const { data: liveThread } = useQuery<CommunityThread>({
    queryKey: ["/api/community/threads", initialThread.id],
    queryFn: async () => {
      const res = await fetch(`/api/community/threads/${initialThread.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    initialData: initialThread,
  });

  const thread = liveThread || initialThread;
  const cat = getCat(thread.category);
  const CatIcon = cat.icon;

  const { data: replies = [], isLoading } = useQuery<CommunityReply[]>({
    queryKey: ["/api/community/threads", thread.id, "replies"],
    queryFn: async () => {
      const res = await fetch(`/api/community/threads/${thread.id}/replies`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/community/threads/${thread.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, authorName: userName, content: replyText }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads", thread.id, "replies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads", thread.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads"] });
      setReplyText("");
      toast({ title: "Reply posted!" });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/community/threads/${thread.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ likesCount: (thread.likesCount || 0) + 1 }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads", thread.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads"] });
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/community/replies/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads", thread.id, "replies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads"] });
    },
  });

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground font-body text-xs -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to threads
      </Button>

      <Card className="bg-white border-border rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading font-bold text-xs">
              {thread.authorName.charAt(0).toUpperCase()}
            </div>
            <ClickableAuthor name={thread.authorName} userId={thread.userId} onClick={onAuthorClick} isAdmin={(thread as any).authorRole === "admin"} />
            <span className="text-[10px] font-body text-muted-foreground">{timeAgo(thread.createdAt)}</span>
            <Badge className={`text-[9px] font-body ${cat.bg} ${cat.color} border-0`}>
              <CatIcon className="h-2.5 w-2.5 mr-1" /> {cat.label}
            </Badge>
          </div>
          <h2 className="text-lg font-heading text-foreground mb-2">{thread.title}</h2>
          <p className="text-sm font-body text-foreground/80 leading-relaxed whitespace-pre-line">{thread.content}</p>

          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => likeMutation.mutate()}
              className="text-xs font-body text-muted-foreground hover:text-pink-500 h-8">
              <Heart className="h-3.5 w-3.5 mr-1" /> {thread.likesCount || 0}
            </Button>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="text-xs font-body">{replies.length} replies</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)
        ) : replies.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs font-body text-muted-foreground">No replies yet — be the first to respond!</p>
          </div>
        ) : (
          replies.map(reply => (
            <Card key={reply.id} className="bg-muted/30 border-border/50 rounded-xl">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent font-heading font-bold text-[10px] flex-shrink-0">
                    {reply.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <ClickableAuthor name={reply.authorName} userId={reply.userId} onClick={onAuthorClick} isAdmin={(reply as any).authorRole === "admin"} />
                      <span className="text-[10px] font-body text-muted-foreground">{timeAgo(reply.createdAt)}</span>
                    </div>
                    <p className="text-xs font-body text-foreground/80 mt-1 leading-relaxed">{reply.content}</p>
                  </div>
                  {reply.userId === userId && (
                    <Button variant="ghost" size="sm" onClick={() => deleteReplyMutation.mutate(reply.id)}
                      className="h-6 w-6 p-0 text-muted-foreground/50 hover:text-red-500 flex-shrink-0">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="bg-white border-border rounded-2xl sticky bottom-4">
        <CardContent className="p-3">
          <div className="flex items-end gap-2">
            <Textarea value={replyText} onChange={e => setReplyText(e.target.value)}
              placeholder="Write a supportive reply..."
              className="font-body text-sm rounded-xl resize-none flex-1 min-h-[40px] max-h-[120px]"
              rows={1} />
            <Button onClick={() => replyMutation.mutate()} disabled={!replyText.trim() || replyMutation.isPending}
              className="bg-primary text-white hover:bg-primary/90 rounded-xl h-10 px-4 flex-shrink-0">
              {replyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NewThreadDialog({ open, onClose, userId, userName }: {
  open: boolean; onClose: () => void; userId: number; userName: string;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/community/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, authorName: userName, title, content, category }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads"] });
      toast({ title: "Thread created!" });
      setTitle(""); setContent(""); setCategory("general");
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white border-border max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">Start a New Thread</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-body text-muted-foreground">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="font-body rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-body text-muted-foreground">Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              className="font-body rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-body text-muted-foreground">Your message</label>
            <Textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="Share your thoughts, ask a question, or celebrate a win..."
              className="font-body rounded-xl resize-none" rows={4} />
          </div>
          <Button onClick={() => createMutation.mutate()}
            disabled={!title.trim() || !content.trim() || createMutation.isPending}
            className="w-full bg-primary text-white hover:bg-primary/90 font-body rounded-xl">
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Post Thread
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const GROUP_ICON_MAP: Record<string, typeof Shield> = {
  shield: Shield,
  apple: Apple,
  sun: Sun,
  brain: Brain,
  heart: Heart,
  dumbbell: Dumbbell,
};

function GroupCard({ group, isMember, onJoin, onLeave, onOpen, isPending }: {
  group: CommunityGroup;
  isMember: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onOpen: () => void;
  isPending: boolean;
}) {
  const Icon = GROUP_ICON_MAP[group.icon || "heart"] || Heart;
  return (
    <Card className="bg-white border-border rounded-2xl hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="h-2" style={{ backgroundColor: group.coverColor || '#7A9B76' }} />
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl flex-shrink-0" style={{ backgroundColor: (group.coverColor || '#7A9B76') + '15' }}>
            <Icon className="h-5 w-5" style={{ color: group.coverColor || '#7A9B76' }} />
          </div>
          <div className="flex-1 min-w-0">
            <button onClick={onOpen} className="text-left w-full group">
              <h3 className="text-sm font-heading font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {group.name}
              </h3>
            </button>
            <p className="text-xs font-body text-muted-foreground mt-1 line-clamp-2">{group.description}</p>
            <div className="flex items-center gap-3 mt-2.5">
              <span className="text-[10px] font-body text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {group.memberCount || 0} members
              </span>
              <span className="text-[10px] font-body text-muted-foreground flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {group.postCount || 0} posts
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {isMember ? (
              <>
                <Button onClick={onOpen} size="sm"
                  className="bg-primary text-white hover:bg-primary/90 font-body rounded-xl text-[10px] h-7 px-3">
                  Open
                </Button>
                <Button onClick={onLeave} size="sm" variant="ghost" disabled={isPending}
                  className="text-muted-foreground hover:text-destructive font-body rounded-xl text-[10px] h-7 px-3">
                  <LogOut className="h-3 w-3 mr-1" /> Leave
                </Button>
              </>
            ) : (
              <Button onClick={onJoin} size="sm" disabled={isPending}
                className="bg-primary/10 text-primary hover:bg-primary/20 font-body rounded-xl text-[10px] h-7 px-3">
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><UserPlus className="h-3 w-3 mr-1" /> Join</>}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GroupFeedView({ group, userId, userName, onBack, onAuthorClick, userRole }: {
  group: CommunityGroup;
  userId: number;
  userName: string;
  onBack: () => void;
  onAuthorClick: (userId: number) => void;
  userRole?: string;
}) {
  const { toast } = useToast();
  const [newPostContent, setNewPostContent] = useState("");
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});

  const Icon = GROUP_ICON_MAP[group.icon || "heart"] || Heart;

  const { data: posts = [], isLoading: postsLoading } = useQuery<CommunityGroupPost[]>({
    queryKey: ["/api/community/groups", group.id, "posts"],
    queryFn: async () => {
      const res = await fetch(`/api/community/groups/${group.id}/posts`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createPostMut = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/community/groups/${group.id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, authorName: userName, content: newPostContent }),
      });
    },
    onSuccess: () => {
      setNewPostContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/community/groups", group.id, "posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/groups"] });
      toast({ title: "Posted!" });
    },
  });

  const deletePostMut = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest(`/api/community/group-posts/${postId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/groups", group.id, "posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/groups"] });
      toast({ title: "Post deleted" });
    },
  });

  return (
    <div>
      <button onClick={onBack}
        className="flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Groups
      </button>

      <Card className="bg-white border-border rounded-2xl mb-5 overflow-hidden">
        <div className="h-3" style={{ backgroundColor: group.coverColor || '#7A9B76' }} />
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: (group.coverColor || '#7A9B76') + '15' }}>
              <Icon className="h-5 w-5" style={{ color: group.coverColor || '#7A9B76' }} />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-foreground">{group.name}</h2>
              <p className="text-xs font-body text-muted-foreground mt-0.5">{group.description}</p>
              <span className="text-[10px] font-body text-muted-foreground mt-1 flex items-center gap-1">
                <Users className="h-3 w-3" /> {group.memberCount || 0} members
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-border rounded-2xl mb-4">
        <CardContent className="p-4">
          <Textarea
            placeholder="Share something with the group..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            className="border-border/50 rounded-xl font-body text-sm resize-none min-h-[80px] mb-3"
          />
          <div className="flex justify-end">
            <Button onClick={() => createPostMut.mutate()} disabled={!newPostContent.trim() || createPostMut.isPending}
              className="bg-primary text-white hover:bg-primary/90 font-body rounded-xl text-xs h-8">
              {createPostMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
              Post
            </Button>
          </div>
        </CardContent>
      </Card>

      {postsLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : posts.length === 0 ? (
        <Card className="bg-white border-border rounded-2xl">
          <CardContent className="py-12 text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm font-body text-muted-foreground">No posts yet. Be the first to share!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...posts].reverse().map(post => (
            <GroupPostCard
              key={post.id}
              post={post}
              userId={userId}
              userName={userName}
              isExpanded={expandedPost === post.id}
              onToggleExpand={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
              onDelete={() => deletePostMut.mutate(post.id)}
              replyText={replyTexts[post.id] || ""}
              onReplyTextChange={(text) => setReplyTexts(prev => ({ ...prev, [post.id]: text }))}
              onReplySent={() => setReplyTexts(prev => ({ ...prev, [post.id]: "" }))}
              groupId={group.id}
              onAuthorClick={onAuthorClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupPostCard({ post, userId, userName, isExpanded, onToggleExpand, onDelete, replyText, onReplyTextChange, onReplySent, groupId, onAuthorClick }: {
  post: CommunityGroupPost & { authorRole?: string };
  userId: number;
  userName: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  onReplySent: () => void;
  groupId: number;
  onAuthorClick: (userId: number) => void;
}) {
  const { toast } = useToast();

  const { data: replies = [], isLoading: repliesLoading } = useQuery<CommunityGroupPostReply[]>({
    queryKey: ["/api/community/group-posts", post.id, "replies"],
    queryFn: async () => {
      const res = await fetch(`/api/community/group-posts/${post.id}/replies`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: isExpanded,
  });

  const createReplyMut = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/community/group-posts/${post.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, authorName: userName, content: replyText }),
      });
    },
    onSuccess: () => {
      onReplySent();
      queryClient.invalidateQueries({ queryKey: ["/api/community/group-posts", post.id, "replies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/groups", groupId, "posts"] });
      toast({ title: "Reply posted!" });
    },
  });

  const deleteReplyMut = useMutation({
    mutationFn: async (replyId: number) => {
      return apiRequest(`/api/community/group-post-replies/${replyId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/group-posts", post.id, "replies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/groups", groupId, "posts"] });
    },
  });

  const initial = (post.authorName || "A").charAt(0).toUpperCase();

  return (
    <Card className="bg-white border-border rounded-2xl">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading font-bold text-sm flex-shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <ClickableAuthor name={post.authorName} userId={post.userId} onClick={onAuthorClick} isAdmin={post.authorRole === "admin"} />
              <span className="text-[10px] font-body text-muted-foreground">{timeAgo(post.createdAt)}</span>
            </div>
            <p className="text-sm font-body text-foreground/90 mt-1.5 whitespace-pre-wrap">{post.content}</p>
            <div className="flex items-center gap-3 mt-2.5">
              <button onClick={onToggleExpand}
                className="text-[10px] font-body text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                <MessageCircle className="h-3 w-3" /> {post.repliesCount || 0} replies
              </button>
              {post.userId === userId && (
                <button onClick={onDelete}
                  className="text-[10px] font-body text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-border/50 ml-12">
            {repliesLoading ? (
              <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
            ) : replies.length > 0 ? (
              <div className="space-y-2.5 mb-3">
                {replies.map(reply => {
                  const ri = (reply.authorName || "A").charAt(0).toUpperCase();
                  return (
                    <div key={reply.id} className="flex items-start gap-2.5 bg-muted/30 rounded-xl p-2.5">
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent font-heading font-bold text-[10px] flex-shrink-0">
                        {ri}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <ClickableAuthor name={reply.authorName} userId={reply.userId} onClick={onAuthorClick} isAdmin={(reply as any).authorRole === "admin"} />
                          <span className="text-[9px] font-body text-muted-foreground">{timeAgo(reply.createdAt)}</span>
                          {reply.userId === userId && (
                            <button onClick={() => deleteReplyMut.mutate(reply.id)}
                              className="ml-auto text-muted-foreground/50 hover:text-destructive transition-colors">
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs font-body text-foreground/80 mt-0.5">{reply.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs font-body text-muted-foreground mb-3">No replies yet</p>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => onReplyTextChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && replyText.trim()) createReplyMut.mutate(); }}
                className="flex-1 text-xs font-body h-8 rounded-xl border-border/50"
              />
              <Button onClick={() => createReplyMut.mutate()} disabled={!replyText.trim() || createReplyMut.isPending}
                size="sm" className="bg-primary text-white hover:bg-primary/90 rounded-xl h-8 px-3">
                {createReplyMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type Tab = "threads" | "survivors" | "talks" | "groups";

export default function Community() {
  const { user } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("threads");
  const [selectedThread, setSelectedThread] = useState<CommunityThread | null>(null);
  const [selectedSurvivor, setSelectedSurvivor] = useState<Survivor | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<CommunityGroup | null>(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  const userId = user?.id || 1;

  const { data: threads = [], isLoading: threadsLoading } = useQuery<CommunityThread[]>({
    queryKey: ["/api/community/threads"],
    queryFn: async () => {
      const res = await fetch("/api/community/threads", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: survivorsList = [], isLoading: survivorsLoading } = useQuery<Survivor[]>({
    queryKey: ["/api/survivors"],
    queryFn: async () => {
      const res = await fetch("/api/survivors", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: talks = [], isLoading: talksLoading } = useQuery<SurvivorTalk[]>({
    queryKey: ["/api/survivor-talks"],
    queryFn: async () => {
      const res = await fetch("/api/survivor-talks", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: userRsvps = [] } = useQuery<SurvivorTalkRsvp[]>({
    queryKey: ["/api/survivor-talk-rsvps", userId],
    queryFn: async () => {
      const res = await fetch(`/api/survivor-talk-rsvps?userId=${userId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: groups = [], isLoading: groupsLoading } = useQuery<CommunityGroup[]>({
    queryKey: ["/api/community/groups"],
    queryFn: async () => {
      const res = await fetch("/api/community/groups", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: userMemberships = [] } = useQuery<CommunityGroupMember[]>({
    queryKey: ["/api/community/group-memberships", userId],
    queryFn: async () => {
      const res = await fetch(`/api/community/group-memberships?userId=${userId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const joinGroupMut = useMutation({
    mutationFn: async (groupId: number) => {
      return apiRequest(`/api/community/groups/${groupId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/group-memberships", userId] });
      toast({ title: "Joined group!" });
    },
  });

  const leaveGroupMut = useMutation({
    mutationFn: async (groupId: number) => {
      return apiRequest(`/api/community/groups/${groupId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/group-memberships", userId] });
      toast({ title: "Left group" });
    },
  });

  const memberGroupIds = new Set(userMemberships.map(m => m.groupId));

  const rsvpMutation = useMutation({
    mutationFn: async (talkId: number) => {
      return apiRequest("/api/survivor-talk-rsvps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ talkId, userId }),
      });
    },
    onSuccess: (_data, talkId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/survivor-talk-rsvps", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/survivor-talks"] });
      toast({ title: "You're in!", description: "Calendar invite downloading now." });
      const link = document.createElement('a');
      link.href = `/api/survivor-talks/${talkId}/calendar`;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  });

  const cancelRsvpMutation = useMutation({
    mutationFn: async (talkId: number) => {
      return apiRequest(`/api/survivor-talk-rsvps/${talkId}?userId=${userId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/survivor-talk-rsvps", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/survivor-talks"] });
      toast({ title: "RSVP cancelled" });
    },
  });

  const rsvpTalkIds = new Set(userRsvps.map(r => r.talkId));

  const survivorMap = survivorsList.reduce((acc: Record<number, Survivor>, s) => {
    acc[s.id] = s;
    return acc;
  }, {});

  if (selectedGroup) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto">
        <GroupFeedView
          group={selectedGroup}
          userId={userId}
          userName={user?.displayName || "Anonymous"}
          onBack={() => setSelectedGroup(null)}
          onAuthorClick={setProfileUserId}
          userRole={user?.role}
        />
        <UserProfilePopup userId={profileUserId || 0} open={profileUserId !== null} onClose={() => setProfileUserId(null)} />
      </div>
    );
  }

  if (selectedThread) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto">
        <ThreadDetailView
          thread={selectedThread}
          onBack={() => setSelectedThread(null)}
          userId={userId}
          userName={user?.displayName || "Anonymous"}
          onAuthorClick={setProfileUserId}
        />
        <UserProfilePopup userId={profileUserId || 0} open={profileUserId !== null} onClose={() => setProfileUserId(null)} />
      </div>
    );
  }

  if (selectedSurvivor) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto">
        <SurvivorProfile
          survivor={selectedSurvivor}
          onBack={() => setSelectedSurvivor(null)}
          userId={userId}
        />
      </div>
    );
  }

  const filteredThreads = filterCategory === "all" ? threads : threads.filter(t => t.category === filterCategory);
  const sortedThreads = [...filteredThreads].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const upcomingTalks = talks.filter(t => new Date(t.scheduledAt) > new Date());
  const pastTalks = talks.filter(t => new Date(t.scheduledAt) <= new Date());

  const tabs: { key: Tab; label: string; icon: typeof MessageCircle; count?: number }[] = [
    { key: "threads", label: "Threads", icon: MessageCircle, count: threads.length },
    { key: "groups", label: "Groups", icon: Users, count: groups.length },
    { key: "survivors", label: "Survivors", icon: ShieldCheck, count: survivorsList.filter(s => s.verified).length },
    { key: "talks", label: "Talks", icon: Mic, count: upcomingTalks.length },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-heading font-bold text-accent tracking-wide">Community</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">Connect, share, and learn from those who've walked this road</p>
        <div className="mt-3 h-px bg-gradient-to-r from-accent/40 via-primary/30 to-transparent" />
      </div>

      <div className="flex gap-1 mb-5 bg-muted/30 rounded-2xl p-1 border border-border/50">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-body font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}>
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === "threads" && (
        <>
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/15 rounded-2xl mb-5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-heading text-foreground">Discussion Forum</h3>
                  <p className="text-xs font-body text-muted-foreground mt-0.5">
                    Share experiences, ask questions, and celebrate wins together.
                  </p>
                </div>
                <Button onClick={() => setShowNewThread(true)}
                  className="bg-primary text-white hover:bg-primary/90 font-body rounded-xl text-xs h-9 flex-shrink-0">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> New Thread
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
            <button onClick={() => setFilterCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-body transition-all flex-shrink-0 ${
                filterCategory === "all" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
              }`}>All</button>
            {Object.entries(CATEGORY_CONFIG).map(([key, val]) => {
              const Icon = val.icon;
              return (
                <button key={key} onClick={() => setFilterCategory(key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-body transition-all flex-shrink-0 ${
                    filterCategory === key ? `${val.bg} ${val.color} font-medium` : "text-muted-foreground hover:bg-muted"
                  }`}>
                  <Icon className="h-3 w-3" /> {val.label}
                </button>
              );
            })}
          </div>

          {threadsLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
          ) : sortedThreads.length === 0 ? (
            <Card className="bg-white border-border rounded-2xl">
              <CardContent className="py-16 text-center">
                <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-body text-muted-foreground">
                  {filterCategory === "all" ? "No threads yet — be the first to start a conversation!" : `No ${getCat(filterCategory).label} threads yet`}
                </p>
                <Button onClick={() => setShowNewThread(true)} className="mt-4 bg-primary text-white hover:bg-primary/90 font-body rounded-xl text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Start a Thread
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedThreads.map(thread => (
                <ThreadCard key={thread.id} thread={thread} onClick={() => setSelectedThread(thread)} onAuthorClick={setProfileUserId} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "groups" && (
        <>
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/15 rounded-2xl mb-5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-heading text-foreground">Community Groups</h3>
                  <p className="text-xs font-body text-muted-foreground mt-0.5">
                    Join groups that match your journey. Share, learn, and connect with others who understand.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {memberGroupIds.size > 0 && (
            <>
              <h3 className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your Groups</h3>
              <div className="space-y-3 mb-6">
                {groups.filter(g => memberGroupIds.has(g.id)).map(group => (
                  <GroupCard key={group.id} group={group} isMember={true}
                    onJoin={() => joinGroupMut.mutate(group.id)}
                    onLeave={() => leaveGroupMut.mutate(group.id)}
                    onOpen={() => setSelectedGroup(group)}
                    isPending={joinGroupMut.isPending || leaveGroupMut.isPending} />
                ))}
              </div>
            </>
          )}

          {groupsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
          ) : (
            <>
              <h3 className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {memberGroupIds.size > 0 ? "Discover Groups" : "All Groups"}
              </h3>
              <div className="space-y-3">
                {groups.filter(g => !memberGroupIds.has(g.id)).map(group => (
                  <GroupCard key={group.id} group={group} isMember={false}
                    onJoin={() => joinGroupMut.mutate(group.id)}
                    onLeave={() => leaveGroupMut.mutate(group.id)}
                    onOpen={() => joinGroupMut.mutate(group.id)}
                    isPending={joinGroupMut.isPending || leaveGroupMut.isPending} />
                ))}
                {groups.filter(g => !memberGroupIds.has(g.id)).length === 0 && memberGroupIds.size > 0 && (
                  <Card className="bg-white border-border rounded-2xl">
                    <CardContent className="py-8 text-center">
                      <p className="text-sm font-body text-muted-foreground">You've joined all available groups!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </>
      )}

      {activeTab === "survivors" && (
        <>
          <Card className="bg-gradient-to-r from-amber-50/80 to-yellow-50/40 border-amber-200/30 rounded-2xl mb-5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-heading text-foreground">Verified Survivors</h3>
                  <p className="text-xs font-body text-muted-foreground mt-0.5">
                    Connect 1-on-1 with verified cancer survivors who volunteer their time to support others on their journey.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {survivorsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
          ) : survivorsList.length === 0 ? (
            <Card className="bg-white border-border rounded-2xl">
              <CardContent className="py-16 text-center">
                <ShieldCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-body text-muted-foreground">No verified survivors yet. Check back soon!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {[...survivorsList].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).map(survivor => (
                <SurvivorCard key={survivor.id} survivor={survivor} onClick={() => setSelectedSurvivor(survivor)} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "talks" && (
        <>
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/15 rounded-2xl mb-5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Mic className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-heading text-foreground">Survivor Talks & Events</h3>
                  <p className="text-xs font-body text-muted-foreground mt-0.5">
                    Live sessions hosted by verified survivors. RSVP to attend and learn from their experiences.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {talksLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
          ) : talks.length === 0 ? (
            <Card className="bg-white border-border rounded-2xl">
              <CardContent className="py-16 text-center">
                <Mic className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-body text-muted-foreground">No talks scheduled yet. Check back soon!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingTalks.length > 0 && (
                <>
                  <h3 className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</h3>
                  {upcomingTalks.map(talk => (
                    <TalkCard key={talk.id} talk={talk} survivor={survivorMap[talk.survivorId]}
                      isRsvpd={rsvpTalkIds.has(talk.id)}
                      onRsvp={() => rsvpMutation.mutate(talk.id)}
                      onCancelRsvp={() => cancelRsvpMutation.mutate(talk.id)}
                      isPending={rsvpMutation.isPending || cancelRsvpMutation.isPending} />
                  ))}
                </>
              )}
              {pastTalks.length > 0 && (
                <>
                  <h3 className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mt-6">Past Talks</h3>
                  {pastTalks.map(talk => (
                    <TalkCard key={talk.id} talk={talk} survivor={survivorMap[talk.survivorId]}
                      isRsvpd={false} onRsvp={() => {}} onCancelRsvp={() => {}} isPending={false} />
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}

      <NewThreadDialog
        open={showNewThread}
        onClose={() => setShowNewThread(false)}
        userId={userId}
        userName={user?.displayName || "Anonymous"}
      />

      <UserProfilePopup userId={profileUserId || 0} open={profileUserId !== null} onClose={() => setProfileUserId(null)} />
    </div>
  );
}
