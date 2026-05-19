import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  MessageCircle,
  TriangleAlert,
} from "lucide-react";
import { demoCustomerApi } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function WhatsAppOptIn() {
  const optInQuery = useQuery({
    queryKey: ["demo", "whatsapp-opt-in"],
    queryFn: demoCustomerApi.getWhatsAppOptIn,
  });

  const config = optInQuery.data;

  async function copyJoinMessage(): Promise<void> {
    if (!config?.joinMessage) return;
    await navigator.clipboard.writeText(config.joinMessage);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-white/10 bg-background/95">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" aria-label="Back">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
              <MessageCircle className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">WhatsApp Demo Opt-In</h1>
              <p className="text-sm text-muted-foreground">Cisco Live customer confirmation channel</p>
            </div>
          </div>
          <Badge variant="outline">Twilio Sandbox</Badge>
        </div>
      </div>

      <main className="mx-auto flex max-w-4xl flex-col gap-5 px-6 py-6">
        {optInQuery.isLoading && (
          <Card className="flex items-center gap-3 border-white/10 bg-card/50 p-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading WhatsApp opt-in details.</span>
          </Card>
        )}

        {optInQuery.isError && (
          <Alert variant="destructive">
            <AlertTitle>Opt-in details unavailable</AlertTitle>
            <AlertDescription>{optInQuery.error.message}</AlertDescription>
          </Alert>
        )}

        {config && !config.configured && (
          <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>WhatsApp opt-in is not configured</AlertTitle>
            <AlertDescription>
              Set `TWILIO_WHATSAPP_FROM` and `TWILIO_WHATSAPP_SANDBOX_JOIN_CODE` on the server.
            </AlertDescription>
          </Alert>
        )}

        {config?.configured && (
          <Card className="border-white/10 bg-card/50 p-6">
            <div className="flex flex-col gap-5">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Join the Sandbox</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Use the same phone number that will receive the demo reservation confirmation.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 text-sm md:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-background/40 p-4">
                  <div className="text-muted-foreground">Send to</div>
                  <div className="mt-1 break-words text-base font-semibold">{config.sandboxNumber}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-background/40 p-4">
                  <div className="text-muted-foreground">Message</div>
                  <div className="mt-1 break-words text-base font-semibold">{config.joinMessage}</div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="w-full sm:w-fit">
                  <a href={config.whatsAppUrl} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    Open WhatsApp
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button type="button" variant="outline" className="w-full sm:w-fit" onClick={copyJoinMessage}>
                  <Copy className="h-4 w-4" />
                  Copy Join Message
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                After Twilio replies that the sandbox is connected, reservation confirmations can be sent to this WhatsApp number.
              </p>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
