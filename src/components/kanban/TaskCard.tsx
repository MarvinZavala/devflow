"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Task } from "@/types/kanban"
import { cn } from "@/lib/utils"
import { GripVertical } from "lucide-react"

interface TaskCardProps {
  task: Task
  onClick?: () => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 bg-background border-2 border-primary/20 rounded-lg h-[100px]"
      />
    )
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-grab hover:border-primary/50 transition-colors group"
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <CardHeader className="p-3 pb-1 flex flex-row items-start justify-between space-y-0">
        <CardTitle className="text-sm font-medium leading-none">
          {task.title}
        </CardTitle>
        <button className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
             <GripVertical className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {task.description}
        </p>
      </CardContent>
    </Card>
  )
}
