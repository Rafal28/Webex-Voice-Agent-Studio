import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clipboard,
  Loader2,
  MessageSquare,
  Mic,
  PhoneCall,
  Radio,
  Settings,
} from "lucide-react";
import { agentsApi, twilioApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  RetailProgressTimeline,
  createRetailAssistState,
  updateRetailAssistState,
} from "@/components/retail-agent-assist";

type MonitorState = "connecting" | "waiting" | "in-call" | "ended" | "error";

interface TranscriptEntry {
  role: "user" | "assistant" | "system";
  text: string;
  correctedText?: string;
  timestamp: number;
}

interface TwilioMonitorMessage {
  type:
    | "connected"
    | "callStarted"
    | "callEnded"
    | "smsSent"
    | "userTranscript"
    | "assistantTranscript"
    | "toolCallStarted"
    | "toolCallCompleted"
    | "identityVerificationSent"
    | "identityVerified"
    | "customerContextLoaded"
    | "inventoryUpdated"
    | "recommendationCreated"
    | "reservationCreated"
    | "associateHandoffCreated";
  text?: string;
  rawText?: string;
  correctedText?: string;
  corrected?: boolean;
  to?: string;
  callerPhone?: string;
  toolName?: string;
  data?: unknown;
  success?: boolean;
  result?: string;
  error?: string;
  durationMs?: number;
  timestamp?: number;
}

export default function PstnCall() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const transcriptRef = useRef<HTMLDivElement>(null);
  const requestedAgentId = Number(new URLSearchParams(search).get("agentId"));
  const hasAgentId = Number.isFinite(requestedAgentId) && requestedAgentId > 0;
  const agentId = hasAgentId ? 1 : requestedAgentId;
  const [monitorState, setMonitorState] = useState<MonitorState>("connecting");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [callerPhone, setCallerPhone] = useState<string | null>(null);
  const [assistState, setAssistState] = useState(createRetailAssistState);

  const { data: agent, isLoading: agentLoading } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: () => agentsApi.getById(agentId),
    enabled: hasAgentId,
  });

  const { data: twilioStatus, isLoading: twilioLoading } = useQuery({
    queryKey: ["twilio-status"],
    queryFn: twilioApi.getStatus,
  });

  const agentWebhookUrl = useMemo(() => {
    if (!twilioStatus?.webhooks?.voice || !hasAgentId) return null;
    const url = new URL(twilioStatus.webhooks.voice);
    url.searchParams.set("agentId", String(agentId));
    return url.toString();
  }, [agentId, hasAgentId, twilioStatus?.webhooks?.voice]);

  const phoneHref = twilioStatus?.phoneNumber
    ? `tel:${twilioStatus.phoneNumber.replace(/[^\d+]/g, "")}`
    : undefined;

  useEffect(() => {
    if (hasAgentId && requestedAgentId !== 1) {
      setLocation("/pstn-call?agentId=1", { replace: true });
    }
  }, [hasAgentId, requestedAgentId, setLocation]);

  useEffect(() => {
    if (!hasAgentId) {
      setMonitorState("error");
      return;
    }

    setMonitorState("connecting");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/twilio-monitor?agentId=${agentId}`);

    ws.onopen = () => setMonitorState("waiting");
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as TwilioMonitorMessage;
      setAssistState((current) => updateRetailAssistState(current, msg));
      if (msg.type === "connected") {
        setMonitorState("waiting");
        return;
      }

      if (msg.type === "callStarted") {
        setMonitorState("in-call");
        setCallerPhone(msg.callerPhone || null);
        setAssistState((current) => ({
          ...createRetailAssistState(),
          toolEvents: current.toolEvents,
        }));
        appendTranscript("system", "PSTN call connected.");
        return;
      }

      if (msg.type === "callEnded") {
        setMonitorState("ended");
        appendTranscript("system", "PSTN call ended.");
        return;
      }

      if (msg.type === "smsSent") {
        appendTranscript("system", `Summary SMS sent to ${msg.to || "the caller"}.`);
        return;
      }

      if ((msg.type === "userTranscript" || msg.type === "assistantTranscript") && msg.text) {
        appendTranscript(
          msg.type === "userTranscript" ? "user" : "assistant",
          msg.text,
          msg.timestamp,
          msg.type === "userTranscript" && msg.corrected ? msg.rawText : undefined
        );
      }
    };
    ws.onerror = () => setMonitorState("error");
    ws.onclose = () => setMonitorState((current) => (current === "in-call" ? "ended" : current));

    return () => ws.close();
  }, [agentId, hasAgentId]);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  function appendTranscript(
    role: TranscriptEntry["role"],
    text: string,
    timestamp = Date.now(),
    correctedText?: string
  ): void {
    const cleaned = text.trim();
    if (!cleaned) return;
    const cleanedCorrection = (correctedText || "").trim();
    const correction = cleanedCorrection && normalizeTranscriptForDedupe(cleanedCorrection) !== normalizeTranscriptForDedupe(cleaned)
      ? cleanedCorrection
      : undefined;

    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      if (
        last?.role === role &&
        last.text === cleaned &&
        (last.correctedText || "") === (correction || "")
      ) return prev;
      return [...prev, { role, text: cleaned, correctedText: correction, timestamp }];
    });
  }

  async function copyValue(label: string, value: string | null | undefined): Promise<void> {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} copied` });
    } catch {
      toast({
        title: "Copy failed",
        description: value,
        variant: "destructive",
      });
    }
  }

  if (!hasAgentId) {
    return (
      <div className="pstn-page p-6">
        <Button variant="ghost" className="gap-2" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="mt-16 text-center">
          <h1 className="text-2xl font-semibold">No agent selected</h1>
        </div>
      </div>
    );
  }

  const isLoading = agentLoading || twilioLoading;
  const statusLabel = getMonitorStatusLabel(monitorState);

  return (
    <div className="pstn-page">
      <div className="pstn-header">
        <div className="pstn-header-inner mx-auto flex max-w-[1520px] items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")} aria-label="Back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="app-icon-tile flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
              <PhoneCall className="w-5 h-5 text-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold leading-8 tracking-normal">PSTN Agent Assist</h1>
              <p className="truncate text-[13px] leading-5 text-muted-foreground">
                {agent?.name || "Loading agent..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/demo-setup")}>
              <MessageSquare className="h-4 w-4" />
              Webex setup
            </Button>
            <Badge className={getMonitorBadgeClass(monitorState)}>{statusLabel}</Badge>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1520px] px-6 pb-6">
        <div className="pstn-primary flex flex-col gap-4">
          <Card className="pstn-setup-card">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="pstn-setup-title-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <PhoneCall className="w-5 h-5 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold leading-7 tracking-normal">Call From A Phone</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Dial the Twilio number. Transcript appears on the left and progress appears on the right.
                  </p>
                </div>
              </div>

              <div className="pstn-agent-card-grid grid gap-4 xl:gap-5 md:grid-cols-3">
                <InfoRow
                  tone="blue"
                  icon={<PhoneCall className="w-4 h-4" />}
                  label="Twilio number"
                  value={twilioStatus?.phoneNumber || "Set TWILIO_PHONE_NUMBER"}
                  valueDisplay="nowrap"
                  action={
                    twilioStatus?.phoneNumber ? (
                      <Button asChild size="sm">
                        <a href={phoneHref}>Call</a>
                      </Button>
                    ) : null
                  }
                />

                <InfoRow
                  tone="green"
                  icon={<Settings className="w-4 h-4" />}
                  label="Voice webhook"
                  value={agentWebhookUrl || "Set APP_BASE_URL"}
                  valueDisplay="wrap"
                  action={
                    agentWebhookUrl ? (
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Copy webhook URL"
                        onClick={() => copyValue("Webhook URL", agentWebhookUrl)}
                      >
                        <Clipboard className="w-4 h-4" />
                      </Button>
                    ) : null
                  }
                />

                <InfoRow
                  tone="blue"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  label="Summary SMS"
                  value={twilioStatus?.smsConfigured ? "Available with consent" : "Not configured"}
                />
              </div>
            </div>
          </Card>

        <section className="pstn-workspace grid flex-1 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex min-h-0 min-w-0 flex-col">
            <div className="pstn-section-header flex shrink-0 items-center justify-between gap-4 px-5">
              <div className="flex items-center gap-3">
                <div className="app-icon-tile relative flex h-10 w-10 items-center justify-center rounded-full">
                  {monitorState === "connecting" ? (
                    <Loader2 className="relative z-10 w-4 h-4 text-foreground" />
                  ) : (
                    <Radio className="relative z-10 w-4 h-4 text-foreground" />
                  )}
                </div>
                <div>
                  <h2 className="text-[15px] font-bold leading-5 tracking-normal">Live PSTN Transcript</h2>
                  <p className="text-xs text-muted-foreground">{statusLabel}</p>
                </div>
              </div>
              <Badge variant="outline" className="pstn-chip">
                Browser monitor
              </Badge>
            </div>

            <div ref={transcriptRef} className="pstn-transcript-pane min-h-0 flex-1 overflow-y-auto p-5 space-y-4">
              {isLoading && (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4" />
                  Loading PSTN monitor...
                </div>
              )}

              {!isLoading && transcript.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <div className="app-icon-tile flex h-16 w-16 items-center justify-center rounded-full">
                    <Mic className="h-8 w-8 text-foreground" />
                  </div>
                  <p className="max-w-sm text-sm">
                    Waiting for a PSTN call on {agent?.name || "this agent"}. The live transcript will appear here.
                  </p>
                </div>
              )}

              {transcript.map((entry, index) => (
                <TranscriptBubble
                  key={`${entry.timestamp}-${index}`}
                  entry={entry}
                  agentName={agent?.name || "Agent"}
                  callerPhone={callerPhone}
                />
              ))}
            </div>
          </div>
          <aside className="pstn-side-pane flex min-h-0 flex-col border-t lg:border-l lg:border-t-0 lg:overflow-hidden">
            <div className="pstn-rail-header flex shrink-0 items-center gap-3 px-5">
              <div className="app-icon-tile flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold leading-5 tracking-normal">Agent assist timeline</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Live tool progress and handoff context</p>
              </div>
            </div>
            <div className="pstn-timeline-shell min-h-0 flex-1 overflow-y-auto p-4">
              <div className="pstn-timeline-content">
                <RetailProgressTimeline className="pstn-progress-timeline" state={assistState} />
              </div>
              <div className="pstn-rail-empty flex h-full min-h-[320px] flex-col items-center justify-center rounded-lg p-6 text-center">
                <Radio className="mb-3 h-5 w-5 text-foreground" />
                <p className="text-sm font-medium text-foreground">Waiting for call activity</p>
                <p className="mt-1 max-w-[240px] text-xs leading-relaxed">
                  Verification, inventory lookup, reservation, and handoff events will appear here.
                </p>
              </div>
            </div>
          </aside>
        </section>
        </div>
      </main>
    </div>
  );
}

function InfoRow({
  action,
  className,
  icon,
  label,
  tone = "blue",
  value,
  valueDisplay = "truncate",
}: {
  action?: ReactNode;
  className?: string;
  icon: ReactNode;
  label: string;
  tone?: "blue" | "green";
  value: string;
  valueDisplay?: "truncate" | "wrap" | "nowrap";
}) {
  const valueClassName = {
    truncate: "pstn-info-value truncate text-[13px] font-semibold",
    wrap: "pstn-info-value truncate font-mono text-[12px] font-medium",
    nowrap: "pstn-info-value truncate whitespace-nowrap text-[13px] font-semibold tabular-nums",
  }[valueDisplay];

  return (
    <div className={`pstn-info-row pstn-info-row-${tone} flex min-w-0 flex-col gap-3.5 p-4 ${className || ""}`}>
      <div className="flex min-w-0 items-start gap-3">
        <div className="pstn-info-avatar flex h-11 w-11 shrink-0 items-center justify-center rounded-full">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="pstn-info-label truncate text-base font-bold text-foreground">{label}</div>
        </div>
      </div>
      <div className="pstn-info-footer mt-auto flex min-w-0 items-end justify-between gap-3">
        <div className={valueClassName}>
          {value}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

function Step({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-xs font-semibold text-foreground">
        {number}
      </span>
      <p>{text}</p>
    </div>
  );
}

function TranscriptBubble({ entry, agentName, callerPhone }: { entry: TranscriptEntry; agentName: string; callerPhone?: string | null }) {
  if (entry.role === "system") {
    return (
      <div className="flex justify-center">
        <div className="pstn-message-system rounded-full px-3 py-1 text-xs text-muted-foreground">
          {entry.text}
        </div>
      </div>
    );
  }

  const isUser = entry.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`pstn-message-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        isUser ? "pstn-message-avatar-user" : "pstn-message-avatar-assistant"
      }`}>
        {isUser ? "U" : <Bot className="h-4 w-4" />}
      </div>
      <div className={`min-w-0 flex-1 ${isUser ? "text-right" : ""}`}>
        <div className="mb-1 text-xs text-muted-foreground">
          {isUser ? formatCallerPhone(callerPhone) : agentName}
        </div>
        <div className={`inline-block max-w-[85%] rounded-xl border p-3 text-left text-sm ${
          isUser
            ? "pstn-message-user rounded-tr-none"
            : "pstn-message-assistant rounded-tl-none"
        }`}>
          {entry.text}
        </div>
      </div>
    </div>
  );
}

function normalizeTranscriptForDedupe(text: string): string {
  return text.toLowerCase().replace(/[.!?,\s]+$/g, "");
}

function formatCallerPhone(value?: string | null): string {
  const raw = value?.trim();
  if (!raw) return "Caller";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return raw;
}

function getMonitorStatusLabel(state: MonitorState): string {
  switch (state) {
    case "connecting":
      return "Connecting monitor";
    case "waiting":
      return "Waiting for PSTN call";
    case "in-call":
      return "PSTN call live";
    case "ended":
      return "Call ended";
    case "error":
      return "Monitor unavailable";
  }
}

function getMonitorBadgeClass(state: MonitorState): string {
  switch (state) {
    case "connecting":
      return "status-warning";
    case "waiting":
      return "status-info";
    case "in-call":
      return "status-success";
    case "ended":
      return "status-muted";
    case "error":
      return "status-danger";
  }
}
