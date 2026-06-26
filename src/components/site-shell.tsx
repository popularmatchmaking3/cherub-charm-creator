import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Link to="/" className="flex items-baseline gap-2">
        <span className="font-display text-2xl">United Disabled Matrimony</span>
        <span className="hidden text-xs uppercase tracking-[0.2em] text-muted-foreground sm:inline">
          United Disabled Matrimony
        </span>
      </Link>
      <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
        <Link to="/about" className="hover:text-foreground">About</Link>
        <Link to="/vision" className="hover:text-foreground">Vision</Link>
        <Link to="/testimonials" className="hover:text-foreground">Stories</Link>
        <Link to="/contact" className="hover:text-foreground">Contact</Link>
      </nav>
      <div className="flex items-center gap-2">
        <Link to="/login">
          <Button variant="outline" className="rounded-full">Sign in</Button>
        </Link>
        <Link to="/signup" className="hidden sm:inline-flex">
          <Button className="rounded-full">Get started</Button>
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 text-sm text-muted-foreground md:grid-cols-3">
        <div>
          <p className="font-display text-lg text-foreground">United Disabled Matrimony</p>
          <p className="mt-2">Respectful matrimonial space for the differently-abled, worldwide.</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/vision" className="hover:text-foreground">Vision</Link>
          <Link to="/testimonials" className="hover:text-foreground">Stories</Link>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
          <Link to="/suggestions" className="hover:text-foreground">Suggest a feature</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/data-protection" className="hover:text-foreground">Data Protection</Link>
        </div>
        <p className="md:text-right">© {new Date().getFullYear()} United Disabled Matrimony. Made with care.</p>
      </div>
    </footer>
  );
}

export function SitePage({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <SiteHeader />
      {children}
      <SiteFooter />
    </main>
  );
}