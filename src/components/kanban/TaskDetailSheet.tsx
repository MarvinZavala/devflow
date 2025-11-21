"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Play, Trash2, Loader2, CheckCircle2 } from "lucide-react"
import { Task } from "@/types/kanban"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface TaskDetailSheetProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated: () => void
}

export function TaskDetailSheet({ task, open, onOpenChange, onTaskUpdated }: TaskDetailSheetProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<string>("medium")
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
      setPriority(task.priority)
    }
  }, [task])

  const handleSave = async () => {
    if (!task) return
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title,
          description,
          priority
        })
        .eq('id', task.id)

      if (error) throw error
      
      toast.success("Task updated")
      onTaskUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error("Failed to update task")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!task) return
    if (!confirm("Are you sure you want to delete this task?")) return
    
    setIsSaving(true)
    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', task.id)
        
        if (error) throw error

        toast.success("Task deleted")
        onTaskUpdated()
        onOpenChange(false)
    } catch (error) {
        console.error(error)
        toast.error("Failed to delete task")
    } finally {
        setIsSaving(false)
    }
  }

  const startFocusMode = () => {
      if (!task) return
      router.push(`/focus/${task.id}`)
  }

  if (!task) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
             <Badge variant="outline" className="uppercase text-xs tracking-wider">
                {task.columnId} {/* TODO: Map ID to Name if possible, or just show status */}
             </Badge>
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                </Button>
             </div>
          </div>
          <SheetTitle>
             <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="text-xl font-bold border-none shadow-none px-0 focus-visible:ring-0 h-auto mt-2"
             />
          </SheetTitle>
        </SheetHeader>

        <div className="grid gap-6 py-4">
          {/* Focus Mode CTA */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 flex items-center justify-between">
             <div>
                <h4 className="font-semibold flex items-center gap-2">
                    <Play className="h-4 w-4 fill-primary text-primary" />
                    Ready to work?
                </h4>
                <p className="text-sm text-muted-foreground">Enter distraction-free focus mode.</p>
             </div>
             <Button onClick={startFocusMode}>
                Start Focus Session
             </Button>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[150px]"
              placeholder="Add details about this task..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-10">
          <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
