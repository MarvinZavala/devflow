"use client"

import { useMemo, useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useSensor,
  useSensors,
  PointerSensor,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core"
import { SortableContext, arrayMove } from "@dnd-kit/sortable"
import { Column } from "./Column"
import { TaskCard } from "./TaskCard"
import { TaskDetailSheet } from "./TaskDetailSheet"
import { Column as ColumnType, Task } from "@/types/kanban"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface KanbanBoardProps {
  projectId: string
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const [columns, setColumns] = useState<ColumnType[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const columnsId = useMemo(() => columns.map((col) => col.id), [columns])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  )

  // Fetch Initial Data
  useEffect(() => {
    if (!projectId) return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch Columns
        const { data: colsData, error: colsError } = await supabase
          .from("columns")
          .select("*")
          .eq("project_id", projectId)
          .order("order_index")

        if (colsError) throw colsError

        // Fetch Tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .eq("project_id", projectId)
          .order("order_index")

        if (tasksError) throw tasksError

        // Transform data to match our Types
        const mappedCols: ColumnType[] = colsData.map(c => ({
             id: c.id,
             title: c.title,
             orderIndex: c.order_index,
             tasks: [] // Will be filled by filtering
        }))

        const mappedTasks: Task[] = tasksData.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            columnId: t.column_id,
            orderIndex: t.order_index
        }))

        setColumns(mappedCols)
        setTasks(mappedTasks)
      } catch (error: any) {
        console.error("Error fetching board:", error)
        toast.error("Failed to load board")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Realtime Subscription
    const channel = supabase
        .channel('board-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` }, () => {
             fetchData() // Refresh data on change
        })
        .subscribe()

    return () => {
        supabase.removeChannel(channel)
    }
  }, [projectId])


  function onTaskClick(task: Task) {
    if (activeTask) return // Don't open if dragging
    setSelectedTask(task)
    setIsSheetOpen(true)
  }

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column)
      return
    }

    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task)
      return
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null)
    setActiveTask(null)

    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveColumn = active.data.current?.type === "Column"
    // Column Reordering Logic (Implement persistence later if needed)
    if (isActiveColumn) {
       setColumns((columns) => {
        const activeColumnIndex = columns.findIndex((col) => col.id === activeId)
        const overColumnIndex = columns.findIndex((col) => col.id === overId)
        return arrayMove(columns, activeColumnIndex, overColumnIndex)
      })
      return
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveTask = active.data.current?.type === "Task"
    const isOverTask = over.data.current?.type === "Task"
    const isOverColumn = over.data.current?.type === "Column"

    if (!isActiveTask) return

    // Dropping a Task over another Task
    if (isActiveTask && isOverTask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId)
        const overIndex = tasks.findIndex((t) => t.id === overId)

        const activeTask = tasks[activeIndex]
        const overTask = tasks[overIndex]

        if (activeTask.columnId !== overTask.columnId) {
           // Task moved to different column
           activeTask.columnId = overTask.columnId
           
           // Persist Change to DB (Optimistic update already happened in state)
           updateTaskColumn(activeTask.id, overTask.columnId)

           return arrayMove(tasks, activeIndex, overIndex - 1)
        }

        // Task moved within same column
        return arrayMove(tasks, activeIndex, overIndex)
      })
    }

    // Dropping a Task over a Column (Empty column or direct drop)
    if (isActiveTask && isOverColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId)
        const activeTask = tasks[activeIndex]
        
        if (activeTask.columnId !== overId) {
            activeTask.columnId = overId as string
             // Persist Change to DB
            updateTaskColumn(activeTask.id, overId as string)
        }
        
        return arrayMove(tasks, activeIndex, activeIndex)
      })
    }
  }

  // Helper to update DB
  const updateTaskColumn = async (taskId: string, newColumnId: string) => {
      try {
          // Check if new column is "Done"
          const targetColumn = columns.find(c => c.id === newColumnId)
          const isDone = targetColumn?.title.toLowerCase().includes('done')

          await supabase
            .from('tasks')
            .update({ 
                column_id: newColumnId,
                completed_at: isDone ? new Date().toISOString() : null
            })
            .eq('id', taskId)
      } catch (error) {
          console.error("Failed to update task position", error)
          toast.error("Failed to save change")
      }
  }


  const dropAnimation: DropAnimation = {
      sideEffects: defaultDropAnimationSideEffects({
          styles: {
              active: {
                  opacity: '0.5',
              },
          },
      }),
  };

  if (isLoading) {
      return (
          <div className="flex h-[500px] w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      )
  }

  return (
    <div className="m-auto flex min-h-[500px] w-full items-center overflow-x-auto overflow-y-hidden px-10 py-5">
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        <div className="m-auto flex gap-4">
          <SortableContext items={columnsId}>
            {columns.map((col) => (
              <Column
                key={col.id}
                column={col}
                tasks={tasks.filter((task) => task.columnId === col.id)}
                onTaskClick={onTaskClick}
              />
            ))}
          </SortableContext>
        </div>

        {/* Overlay for smooth dragging visual */}
        {createPortal(
          <DragOverlay dropAnimation={dropAnimation}>
            {activeColumn && (
              <Column
                column={activeColumn}
                tasks={tasks.filter(
                  (task) => task.columnId === activeColumn.id
                )}
                onTaskClick={() => {}}
              />
            )}
            {activeTask && <TaskCard task={activeTask} />}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      <TaskDetailSheet 
        task={selectedTask} 
        open={isSheetOpen} 
        onOpenChange={setIsSheetOpen}
        onTaskUpdated={() => {
            // Refetch data handled by realtime subscription or manual trigger if needed
            // Currently realtime handles it
        }}
      />
    </div>
  )
}
