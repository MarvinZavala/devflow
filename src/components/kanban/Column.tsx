"use client"

import { SortableContext, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Column as ColumnType, Task } from "@/types/kanban"
import { TaskCard } from "./TaskCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ColumnProps {
  column: ColumnType
  tasks: Task[]
  onTaskClick?: (task: Task) => void
}

export function Column({ column, tasks, onTaskClick }: ColumnProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  if (isDragging) {
    return (
        <div
            ref={setNodeRef}
            style={style}
            className="opacity-40 w-[300px] h-[500px] bg-muted/50 rounded-xl border-2 border-primary/20"
        />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-[300px] flex flex-col gap-2"
    >
      <div 
        className="flex items-center justify-between p-2 font-semibold text-sm text-muted-foreground uppercase tracking-wider cursor-grab active:cursor-grabbing"
        {...attributes} 
        {...listeners}
       >
        {column.title}
        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
            {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 p-2 min-h-[500px] rounded-xl bg-muted/30 border border-border/40">
        <SortableContext items={tasks.map((t) => t.id)}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick && onTaskClick(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
