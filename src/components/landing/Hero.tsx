import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, Clock, Layers } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pt-16 md:pt-24 lg:pt-32">
      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
      </div>

      <div className="container relative mx-auto flex max-w-5xl flex-col items-center px-4 text-center md:px-8">
        <div className="mb-6 inline-flex items-center rounded-full border border-border bg-background/50 px-3 py-1 text-sm font-medium text-muted-foreground backdrop-blur">
          <span className="mr-2 flex h-2 w-2 rounded-full bg-green-500"></span>
          v1.0 Public Beta is now live
        </div>

        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          Build better software, <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
            without the chaos.
          </span>
        </h1>

        <p className="mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          DevFlow combines powerful Kanban boards with seamless time tracking.
          Designed for developers who want to focus on coding, not managing.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" className="h-12 px-8 text-base" asChild>
            <Link href="/register">
              Start for free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-12 px-8 text-base" asChild>
            <Link href="#features">
              See how it works
            </Link>
          </Button>
        </div>

        {/* Social Proof / Trust (Optional) */}
        <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground/60">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> No credit card required
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Open Source friendly
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Encrypted data
          </div>
        </div>
      </div>

      {/* Hero Image / UI Mockup */}
      <div className="relative mx-auto mt-16 max-w-5xl px-4 lg:mt-24">
        <div className="relative rounded-xl border border-border bg-card p-2 shadow-2xl shadow-primary/10 lg:rounded-2xl lg:p-4">
          <div className="absolute -top-12 left-1/2 -z-10 h-[300px] w-full max-w-[600px] -translate-x-1/2 bg-primary/20 blur-[100px]" />
          
          <div className="overflow-hidden rounded-lg border border-border bg-background">
             {/* Mockup Interface Placeholder */}
            <div className="flex h-[300px] w-full flex-col items-center justify-center bg-muted/20 md:h-[500px]">
               <div className="grid grid-cols-1 gap-8 md:grid-cols-3 p-8 w-full max-w-4xl opacity-60">
                 {/* Abstract Column Representation */}
                 <div className="flex flex-col gap-4">
                    <div className="h-6 w-24 rounded-md bg-muted-foreground/20"></div>
                    <div className="h-32 w-full rounded-lg border border-border bg-card p-4 shadow-sm"></div>
                    <div className="h-32 w-full rounded-lg border border-border bg-card p-4 shadow-sm"></div>
                 </div>
                 <div className="flex flex-col gap-4">
                    <div className="h-6 w-24 rounded-md bg-muted-foreground/20"></div>
                    <div className="h-40 w-full rounded-lg border-l-4 border-l-primary bg-card p-4 shadow-sm"></div>
                 </div>
                 <div className="hidden md:flex flex-col gap-4">
                    <div className="h-6 w-24 rounded-md bg-muted-foreground/20"></div>
                    <div className="h-24 w-full rounded-lg border border-border bg-card p-4 shadow-sm"></div>
                 </div>
               </div>
               <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background via-transparent to-transparent">
                   <p className="font-mono text-sm text-muted-foreground">Interactive Demo Coming Soon</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
