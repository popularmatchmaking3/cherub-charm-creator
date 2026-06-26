import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is United Disabled Matrimony?",
    a: "United Disabled Matrimony is a matrimony platform built specifically for members with disabilities and their partners — in a safe, verified and respectful environment.",
  },
  {
    q: "What should I do after creating my account?",
    a: "Complete your profile — photo, basic info, partner preferences — and upload a Govt ID to earn the Verified badge. A more complete profile leads to better matches.",
  },
  {
    q: "How do I get the Disability-proof badge?",
    a: "Upload your disability proof in Settings > Verification. After admin review (typically 24–48 hours) you'll get the green Disability-proof badge. This is optional.",
  },
  {
    q: "Are my photos visible to everyone?",
    a: "They are visible by default. Turn on Private in Settings > Photo privacy and your photos will be blurred. Members must request access, which you approve before they can see them. Matched members can always see your photos.",
  },
  {
    q: "What happens when I send an interest?",
    a: "The other member receives a notification. If they accept, you become a match and can chat or call. If they decline, you simply see 'declined' — no message is sent.",
  },
  {
    q: "I got a suspicious login alert — what should I do?",
    a: "Open Settings > Login history. If it wasn't you, immediately tap 'Logout from all devices' and change your password. Marking a device as trusted reduces future alerts.",
  },
  {
    q: "How do I report or block someone?",
    a: "Open the three-dot menu (⋮) on their profile and tap Report or Block. Choose a category for the report (Fake Profile, Harassment, etc.). Block only hides them from you — they remain on the app.",
  },
  {
    q: "How do I delete my account?",
    a: "At the bottom of the Settings page there's a 'Danger zone' with a Delete account button. Confirming will permanently delete all your data — this cannot be undone.",
  },
  {
    q: "Where can I get help?",
    a: "Create a ticket from Settings > Help & Support. Our team replies within 24–48 hours.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — United Disabled Matrimony" },
      { name: "description", content: "Common questions about United Disabled Matrimony matrimony platform." },
      { property: "og:title", content: "FAQ — United Disabled Matrimony" },
      { property: "og:description", content: "Common questions about United Disabled Matrimony matrimony platform." },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Help</p>
      <h1 className="mt-2 font-display text-4xl">Frequently asked questions</h1>
      <p className="mt-3 text-muted-foreground">
        Common questions about using United Disabled Matrimony, with answers.
      </p>
      <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="block w-full p-5 text-left"
              aria-expanded={isOpen}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium">{f.q}</p>
                <ChevronDown
                  className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
              {isOpen && (
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        More questions? <Link to="/contact" className="text-foreground underline">Contact us</Link>,{" "}
        or signed-in members can raise a ticket from{" "}
        <Link to="/support" className="text-foreground underline">Help &amp; Support</Link>.
      </p>
    </main>
  );
}