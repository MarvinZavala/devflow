"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Plus, FolderKanban, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/hooks/use-user"

interface Project {
  id: string
  name: string
  description: string
  created_at: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()

  useEffect(() => {
      if (!user) return

      const fetchProjects = async () => {
          try {
              const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
              
              if (error) throw error
              setProjects(data || [])
          } catch (error) {
              console.error("Error loading projects", error)
          } finally {
              setIsLoading(false)
          }
      }

      fetchProjects()
  }, [user])

  if (isLoading) {
      return (
          <div className="flex h-full w-full items-center justify-center pt-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your workspaces and projects.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 && (
             <div className="col-span-full text-center py-10 text-muted-foreground">
                 No projects found. Create your first one!
             </div>
        )}
        {projects.map((project) => (
          <Card key={project.id} className="flex flex-col hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FolderKanban className="h-5 w-5" />
              </div>
              <CardTitle className="line-clamp-1">{project.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {project.description || "No description"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {/* Progress bar could go here */}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              Created {new Date(project.created_at).toLocaleDateString()}
              <Button variant="ghost" className="ml-auto h-8 px-2" asChild>
                <Link href={`/dashboard/projects/${project.id}`}>Open Board</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
