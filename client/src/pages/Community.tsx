import { useState } from "react";
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
  Loader2, Pin, Trash2, Flame, Leaf, Brain, HelpCircle
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CommunityThread, CommunityReply } from "@shared/schema";

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Flame }> = {
  general: { label: "General", color: "text-slate-600", bg: "bg-slate-50", icon: MessageCircle },
  treatment: { label: "Treatment", color: "text-blue-600", bg: "bg-blue-50", icon: Sparkles },
  nutrition: { label: "Nutrition", color: "text-green-600", bg: "bg-green-50", icon: Leaf },
  "mind-body": { label: "Mind & Body", color: "text-purple-600", bg: "bg-purple-50", icon: Brain },
  support: { label: "Support", color: "text-pink-600", bg: "bg-pink-50", icon: Heart },
  questions: { label: "Questions", color: "text-amber-600", bg: "bg-amber-50", icon: HelpCircle },
  wins: { label: "Wins & Milestones", color: "text-emerald-600", bg: "bg-emerald-50", icon: Flame },
};

function getCat(category: string) {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general;
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

function ThreadCard({ thread, onClick }: { thread: CommunityThread; onClick: () => void }) {
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
              <span className="text-xs font-body text-muted-foreground">{thread.authorName}</span>
              <span className="text-[10px] font-body text-muted-foreground/60">•</span>
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

function ThreadDetailView({ thread: initialThread, onBack, userId, userName, onThreadUpdate }: {
  thread: CommunityThread;
  onBack: () => void;
  userId: number;
  userName: string;
  onThreadUpdate: (thread: CommunityThread) => void;
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
            <span className="text-sm font-body font-medium text-foreground">{thread.authorName}</span>
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
                      <span className="text-xs font-body font-medium text-foreground">{reply.authorName}</span>
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

export default function Community() {
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedThread, setSelectedThread] = useState<CommunityThread | null>(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");

  const { data: threads = [], isLoading } = useQuery<CommunityThread[]>({
    queryKey: ["/api/community/threads"],
    queryFn: async () => {
      const res = await fetch("/api/community/threads", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch threads");
      return res.json();
    },
  });

  const filteredThreads = filterCategory === "all"
    ? threads
    : threads.filter(t => t.category === filterCategory);

  const sortedThreads = [...filteredThreads].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (selectedThread) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto">
        <ThreadDetailView
          thread={selectedThread}
          onBack={() => setSelectedThread(null)}
          userId={user?.id || 1}
          userName={user?.displayName || "Anonymous"}
          onThreadUpdate={setSelectedThread}
        />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-accent tracking-wide">Community</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">Connect, share, and support each other on the journey</p>
        <div className="mt-3 h-px bg-gradient-to-r from-accent/40 via-primary/30 to-transparent" />
      </div>

      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/15 rounded-2xl mb-5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-heading text-foreground">Welcome to the Community</h3>
              <p className="text-xs font-body text-muted-foreground mt-0.5">
                A safe space for cancer patients and supporters to share experiences, ask questions, and celebrate wins together.
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
          }`}>
          All
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, val]) => {
          const Icon = val.icon;
          return (
            <button key={key} onClick={() => setFilterCategory(key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-body transition-all flex-shrink-0 ${
                filterCategory === key ? `${val.bg} ${val.color} font-medium` : "text-muted-foreground hover:bg-muted"
              }`}>
              <Icon className="h-3 w-3" />
              {val.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
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
            <ThreadCard key={thread.id} thread={thread} onClick={() => setSelectedThread(thread)} />
          ))}
        </div>
      )}

      <NewThreadDialog
        open={showNewThread}
        onClose={() => setShowNewThread(false)}
        userId={user?.id || 1}
        userName={user?.displayName || "Anonymous"}
      />
    </div>
  );
}
