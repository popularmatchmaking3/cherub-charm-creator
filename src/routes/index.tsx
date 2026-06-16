import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-background text-foreground">
      <div className="max-w-xl text-center space-y-4">
        <h1 className="text-4xl font-bold">✅ Supabase Connected</h1>
        <p className="text-muted-foreground">
          Test table deleted. App ready for your next feature.
        </p>
      </div>
    </main>
  );
}
