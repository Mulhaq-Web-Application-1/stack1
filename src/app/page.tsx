import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <span className="font-semibold">SaaS Starter</span>
          <nav className="flex items-center gap-4">
            <SignedOut>
              <Link href="/sign-in">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link href="/sign-up">
                <Button>Sign up</Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            </SignedIn>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="mx-auto max-w-2xl space-y-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Build your SaaS faster
          </h1>
          <p className="text-lg text-muted-foreground">
            Next.js, Clerk auth, Neon Postgres, and Cloudflare R2. Sign up and
            start uploading files from your dashboard.
          </p>
          <SignedOut>
            <div className="flex justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg">Get started</Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline">
                  Sign in
                </Button>
              </Link>
            </div>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button size="lg">Go to Dashboard</Button>
            </Link>
          </SignedIn>
        </div>
      </main>

      <footer className="border-t border-border/40 py-6">
        <div className="container text-center text-sm text-muted-foreground">
          SaaS Starter · Next.js · Clerk · Neon · R2
        </div>
      </footer>
    </div>
  );
}
