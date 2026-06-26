import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SitePage } from "@/components/site-shell";
import { toast } from "sonner";
import { Lightbulb, Send, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/suggestions")({
  head: () => ({
    meta: [
      { title: "Suggest a Feature — United Disabled Matrimony" },
      { name: "description", content: "Apne ideas aur feature suggestions bhejen. Aapki awaaz se app behtar banta hai." },
      { property: "og:title", content: "Suggest a Feature — United Disabled Matrimony" },
      { property: "og:description", content: "Share your ideas and feature requests with our team." },
    ],
  }),
  component: SuggestionsPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Naam zaroori hai").max(100),
  email: z.string().trim().email("Sahi email daalein").max(255).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Thoda detail mein likhein").max(2000),
});

function SuggestionsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, message });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Form check karein");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("feature_suggestions" as never)
      .insert({
        name: parsed.data.name,
        email: parsed.data.email ? parsed.data.email : null,
        message: parsed.data.message,
      } as never);
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
    setName(""); setEmail(""); setMessage("");
  }

  return (
    <SitePage>
      <section className="mx-auto max-w-2xl px-6 py-16">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-7 w-7 text-primary" />
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Suggestions & Ideas
          </p>
        </div>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">Apna idea share karein</h1>
        <p className="mt-3 text-muted-foreground">
          Aapka feedback hi humein behtar banata hai. Naya feature, badlav ya koi
          suggestion — yahaan likhein. Bilkul free, kabhi bhi.
        </p>

        {done && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Dhanyavaad! Aapka suggestion mil gaya.</p>
              <p className="text-sm text-muted-foreground">Hum jald hi review karenge.</p>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="mt-8 space-y-4 rounded-3xl border border-border bg-card p-6">
          <div>
            <label className="text-sm font-medium">Aapka naam *</label>
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Naam likhein" maxLength={100} required />
          </div>
          <div>
            <label className="text-sm font-medium">Email (optional)</label>
            <Input className="mt-1" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="aap@example.com" maxLength={255} />
            <p className="mt-1 text-xs text-muted-foreground">
              Agar reply chahiye to email daalein, varna khaali chhod sakte hain.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Aapka idea / suggestion *</label>
            <Textarea className="mt-1 min-h-[160px]" value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Yahaan apna naya idea, feature request ya feedback likhein…"
              maxLength={2000} required />
            <p className="mt-1 text-xs text-muted-foreground">{message.length}/2000</p>
          </div>
          <Button type="submit" disabled={submitting} className="rounded-full">
            <Send className="mr-2 h-4 w-4" />
            {submitting ? "Bhej rahe hain…" : "Suggestion bhejein"}
          </Button>
        </form>
      </section>
    </SitePage>
  );
}