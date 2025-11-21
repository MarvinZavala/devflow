"use client"

import { useState, useEffect } from "react"
import { OnboardingWizard } from "@/components/dashboard/OnboardingWizard"
import { DevStreak } from "@/components/dashboard/DevStreak"
import { ProductivityAnalytics } from "@/components/dashboard/ProductivityAnalytics"
import { QuoteWidget } from "@/components/shared/QuoteWidget"
import { Greeting } from "@/components/dashboard/Greeting"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Loader2, ArrowRight, Play, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/hooks/use-user"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

interface InboxTask {
  id: string
  title: string
  priority: string
  project: {
      id: string
      name: string
  }
  column: {
      title: string
  }
}

export default function DashboardPage() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [inboxTasks, setInboxTasks] = useState<InboxTask[]>([])
  const [stats, setStats] = useState({ totalProjects: 0, activeTasks: 0 })
  
  const { user } = useUser()
  const router = useRouter()

  useEffect(() => {
    async function loadDashboard() {
        if (!user) return

        try {
            // 1. Check Projects count
            const { count: projectCount, error: projError } = await supabase
                .from('projects')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
            
            if (projError) throw projError
            
            if (projectCount === 0) {
                setShowOnboarding(true)
                setIsLoading(false)
                return
            }

            // 2. Fetch Inbox Tasks
            const { data: myTasks, error: myTasksError } = await supabase
                .from('tasks')
                .select(`
                    id, 
                    title, 
                    priority,
                    project_id,
                    projects!inner (id, name, user_id),
                    columns (title)
                `)
                .eq('projects.user_id', user.id)
                .neq('columns.title', 'Done') // Exclude done tasks
                .limit(20)

            if (myTasksError) throw myTasksError

            const formattedTasks = myTasks.map((t: any) => ({
                id: t.id,
                title: t.title,
                priority: t.priority,
                project: t.projects,
                column: t.columns
            }))

            setInboxTasks(formattedTasks)
            setStats({
                totalProjects: projectCount || 0,
                activeTasks: formattedTasks.length
            })

        } catch (error) {
            console.error("Error loading dashboard", error)
        } finally {
            setIsLoading(false)
        }
    }

    loadDashboard()
  }, [user])

  if (isLoading) {
      return (
          <div className="flex h-full w-full items-center justify-center pt-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pt-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
             <Greeting />
             <QuoteWidget />
             <p className="text-muted-foreground mt-1">
                You have <span className="font-semibold text-foreground">{stats.activeTasks} active tasks</span> across {stats.totalProjects} projects.
             </p>
        </div>
        <Button onClick={() => router.push('/dashboard/projects')}>
            <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>
      
      <ProductivityAnalytics />

      <div className="space-y-4">
          <DevStreak />
          <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">My Priority Inbox</h2>
              <Button variant="link" className="text-muted-foreground" onClick={() => router.push('/dashboard/projects')}>
                  View all projects <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
          </div>

          {inboxTasks.length === 0 ? (
              <Card className="bg-muted/50 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <CheckCircle2 className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">All caught up!</h3>
                      <p className="text-muted-foreground max-w-sm mt-2">
                          No active tasks found. Go to a project to add some work or take a break.
                      </p>
                  </CardContent>
              </Card>
          ) : (
              <div className="grid gap-3">
                  {inboxTasks.map((task) => (
                      <Card 
                        key={task.id} 
                        className="group hover:border-primary/40 transition-all cursor-pointer"
                        onClick={() => router.push(`/dashboard/projects/${task.project.id}`)}
                      >
                          <CardContent className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                  <div className="h-2 w-2 rounded-full bg-primary" />
                                  <div>
                                      <h4 className="font-medium group-hover:text-primary transition-colors">
                                          {task.title}
                                      </h4>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                          <span>{task.project.name}</span>
                                          <span>•</span>
                                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] uppercase">
                                              {task.column?.title}
                                          </Badge>
                                      </div>
                                  </div>
                              </div>
                              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/focus/${task.id}`)
                                    }}
                                  >
                                      <Play className="h-4 w-4 fill-current" />
                                  </Button>
                              </div>
                          </CardContent>
                      </Card>
                  ))}
              </div>
          )}
      </div>

      <OnboardingWizard open={showOnboarding} onOpenChange={setShowOnboarding} />
    </div>
  )
}
