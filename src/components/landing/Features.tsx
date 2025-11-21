import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Kanban, Timer, Zap, BarChart, Lock, Github } from "lucide-react"

export function Features() {
  const features = [
    {
      title: "Kanban Workflows",
      description: "Drag-and-drop tasks across columns. Customizable states to match your team's process.",
      icon: Kanban,
    },
    {
      title: "Integrated Time Tracking",
      description: "Start and stop timers directly from your task cards. No more switching context or apps.",
      icon: Timer,
    },
    {
      title: "Developer First",
      description: "Built with keyboard shortcuts, Markdown support, and a command palette for power users.",
      icon: Zap,
    },
    {
      title: "Productivity Metrics",
      description: "Visualize your coding hours and velocity. Understand where your time actually goes.",
      icon: BarChart,
    },
    {
      title: "Secure by Design",
      description: "Your data is encrypted. We prioritize privacy and security above all else.",
      icon: Lock,
    },
    {
      title: "Open Source Core",
      description: "Built on modern standards. Extendable and community-driven development.",
      icon: Github,
    },
  ]

  return (
    <section id="features" className="bg-muted/50 py-20 md:py-32">
      <div className="container mx-auto max-w-6xl px-4 md:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Everything you need to ship faster
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Stop juggling multiple tools. DevFlow brings project management and time tracking together.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/60 bg-background transition-all hover:border-primary/20 hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/5 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
