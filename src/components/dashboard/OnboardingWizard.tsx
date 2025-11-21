"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Rocket, Briefcase, Layers, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/hooks/use-user"
import { toast } from "sonner"

interface OnboardingWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OnboardingWizard({ open, onOpenChange }: OnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const totalSteps = 3
  const progress = (step / totalSteps) * 100

  const [workspaceName, setWorkspaceName] = useState("")
  const [projectName, setProjectName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { user } = useUser()
  const router = useRouter()

  const handleNext = async () => {
    if (step < totalSteps) {
      if (step === 2 && !workspaceName.trim()) {
        toast.error("Please enter a workspace name")
        return
      }
      setStep(step + 1)
    } else {
      await handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (!user) return
    if (!projectName.trim()) {
        toast.error("Please enter a project name")
        return
    }

    setIsSubmitting(true)
    try {
        // 1. Create Workspace
        const { data: workspace, error: wsError } = await supabase
            .from('workspaces')
            .insert({
                name: workspaceName,
                owner_id: user.id
            })
            .select()
            .single()

        if (wsError) throw wsError

        // 2. Create Project
        const { data: project, error: projError } = await supabase
            .from('projects')
            .insert({
                name: projectName,
                workspace_id: workspace.id,
                user_id: user.id,
                description: 'My first project'
            })
            .select()
            .single()

        if (projError) throw projError

        // 3. Create Default Columns
        const { error: colsError } = await supabase
            .from('columns')
            .insert([
                { title: 'To Do', project_id: project.id, order_index: 0 },
                { title: 'In Progress', project_id: project.id, order_index: 1 },
                { title: 'Done', project_id: project.id, order_index: 2 },
            ])
        
        if (colsError) throw colsError

        toast.success("Workspace created successfully!")
        onOpenChange(false)
        router.push(`/dashboard/projects/${project.id}`)
        router.refresh()

    } catch (error: any) {
        console.error(error)
        toast.error("Failed to create workspace", {
            description: error.message
        })
    } finally {
        setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
        if (!isSubmitting) onOpenChange(val)
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             {step === 1 && <Rocket className="h-5 w-5 text-primary" />}
             {step === 2 && <Briefcase className="h-5 w-5 text-primary" />}
             {step === 3 && <Layers className="h-5 w-5 text-primary" />}
             
             {step === 1 && "Welcome to DevFlow!"}
             {step === 2 && "Create your Workspace"}
             {step === 3 && "Your First Project"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Let's get you set up in less than a minute."}
            {step === 2 && "Workspaces help you organize your different clients or teams."}
            {step === 3 && "Projects hold your tasks and time tracking."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
           <Progress value={progress} className="mb-6 h-2" />
           
           {step === 1 && (
             <div className="space-y-4 py-4 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <Rocket className="h-10 w-10 text-primary" />
                </div>
                <p className="text-muted-foreground">
                    We're glad you're here. Click next to start building your productivity system.
                </p>
             </div>
           )}

           {step === 2 && (
             <div className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="workspace">Workspace Name</Label>
                 <Input 
                    id="workspace" 
                    placeholder="e.g. My Freelance Biz" 
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                 />
               </div>
             </div>
           )}

           {step === 3 && (
             <div className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="project">Project Name</Label>
                 <Input 
                    id="project" 
                    placeholder="e.g. Portfolio Redesign" 
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                 />
               </div>
             </div>
           )}
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {step === totalSteps ? "Get Started" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
