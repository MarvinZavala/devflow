"use client"

import { useState, useEffect, use } from "react"
import { KanbanBoard } from "@/components/kanban/KanbanBoard"
import { CreateTaskDialog } from "@/components/kanban/CreateTaskDialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Settings, Filter, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/hooks/use-user"

interface ProjectDetails {
    id: string
    name: string
    description: string
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const resolvedParams = use(params)
  const [project, setProject] = useState<ProjectDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()

  useEffect(() => {
      if (!user) return

      const fetchProjectDetails = async () => {
          try {
              const { data, error } = await supabase
                .from('projects')
                .select('id, name, description')
                .eq('id', resolvedParams.id)
                .single()
              
              if (error) throw error
              setProject(data)
          } catch (error) {
              console.error("Error loading project", error)
          } finally {
              setIsLoading(false)
          }
      }
      fetchProjectDetails()
  }, [resolvedParams.id, user])

  if (isLoading) {
       return (
          <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      )
  }

  if (!project) {
      return (
           <div className="flex h-full w-full items-center justify-center text-muted-foreground">
               Project not found.
           </div>
      )
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Project Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                <p className="text-sm text-muted-foreground hidden md:block line-clamp-1 max-w-[300px]">{project.description}</p>
            </div>
            <Badge variant="outline" className="ml-2 hidden md:inline-flex">
                Active
            </Badge>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex -space-x-2 mr-4">
                <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarImage src="/avatars/01.png" />
                    <AvatarFallback>{user?.email?.substring(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
            </div>
            <Button variant="outline" size="sm" className="hidden md:flex">
                <Filter className="mr-2 h-4 w-4" />
                Filter
            </Button>
            <Button variant="outline" size="sm" className="hidden md:flex">
                <Settings className="mr-2 h-4 w-4" />
                Settings
            </Button>
            <CreateTaskDialog projectId={resolvedParams.id} />
        </div>
      </div>

      {/* Kanban Board Area */}
      <div className="flex-1 overflow-hidden rounded-lg border border-border/50 bg-background/50 shadow-inner">
        <KanbanBoard projectId={resolvedParams.id} />
      </div>
    </div>
  )
}
