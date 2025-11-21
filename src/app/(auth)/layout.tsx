import Link from "next/link"
import { LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="container flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground/80 transition-colors hover:text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <span>DevFlow</span>
        </Link>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8">
        {children}
      </main>
    </div>
  )
}
