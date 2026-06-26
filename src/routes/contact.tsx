import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SitePage } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Globe2, ShieldCheck, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact us — United Disabled Matrimony" },
      { name: "description", content: "Reach out to the United Disabled Matrimony team for support, partnerships or media." },
      { property: "og:title", content: "Contact United Disabled Matrimony" },
      { property: "og:description", content: "Get in touch with the United Disabled Matrimony team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("appeals").insert({
      full_name: name.trim(),
      email: email.trim(),
      reason: "Contact form",
      details: message.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Message sent — we'll get back to you soon.");
    setName(""); setEmail(""); setMessage("");
  };

  return (
    <SitePage>
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Contact</p>
          <h1 className="mt-3 font-display text-4xl md:text-6xl">We&apos;d love to hear from you.</h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            Questions, feedback, partnership or media — drop us a message and
            we&apos;ll get back within 2 business days.
          </p>

          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex items-start gap-3"><MessageSquare className="mt-0.5 h-4 w-4 text-primary" />
              <span>Use the form to reach our support team directly.</span></li>
            <li className="flex items-start gap-3"><Globe2 className="mt-0.5 h-4 w-4 text-primary" />
              <span>Available worldwide — built from India with ❤</span></li>
            <li className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
              <span>Your message stays private.</span></li>
          </ul>
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" rows={5} value={message}
                onChange={(e) => setMessage(e.target.value)} required />
            </div>
            <Button type="submit" disabled={submitting} className="h-11 w-full rounded-xl">
              {submitting ? "Sending…" : "Send message"}
            </Button>
          </div>
        </form>
      </section>
    </SitePage>
  );
}