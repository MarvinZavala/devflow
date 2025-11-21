"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface CreateTaskDialogProps {
  projectId: string
  onTaskCreated?: () => void
  trigger?: React.ReactNode
}

export function CreateTaskDialog({ projectId, onTaskCreated, trigger }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    try {
      // 1. Get the first column (Todo) to add the task to
      const { data: columns, error: colsError } = await supabase
        .from("columns")
        .select("id")
        .eq("project_id", projectId)
        .order("order_index")
        .limit(1)
        .single()
      
      if (colsError) throw new Error("No columns found")

      // 2. Create the Task
      const { error: taskError } = await supabase
        .from("tasks")
        .insert({
          title,
          description,
          project_id: projectId,
          column_id: columns.id,
          priority: "medium",
          order_index: 999, // Add to end
        })

      if (taskError) throw taskError

      toast.success("Task created!")
      setOpen(false)
      setTitle("")
      setDescription("")
      
      // Trigger refresh in parent
      if (onTaskCreated) onTaskCreated()
      else {
         window.location.reload() // Fallback simple refresh
      }

    } catch (error: any) {
      toast.error("Failed to create task")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
            <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Issue
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Issue</DialogTitle>
          <DialogDescription>
            Add a new task to your backlog.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Fix login bug..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
             <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Issue
             </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
