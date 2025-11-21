"use client"

import { useState, useEffect, use, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Play, Pause, CheckCircle2, ArrowLeft, Maximize2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"

import { QuoteWidget } from "@/components/shared/QuoteWidget"
import { FocusPlayer } from "@/components/focus/FocusPlayer"
import { useUser } from "@/hooks/use-user"

interface Task {
  id: string
  title: string
  project_id: string
  projects: {
    name: string
  }
}

export default function FocusModePage({ params }: { params: Promise<{ taskId: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useUser()
  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActive, setIsActive] = useState(false)
  const [seconds, setSeconds] = useState(0)
  
  // Session tracking
  const sessionStartTimeRef = useRef<Date | null>(null)

  // Save session to DB
  const saveSession = useCallback(async () => {
    if (!sessionStartTimeRef.current || !user) return
    
    const endTime = new Date()
    const startTime = sessionStartTimeRef.current
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000)
    
    if (duration < 5) return // Ignore tiny accidental clicks (< 5s)

    try {
      await supabase.from('focus_sessions').insert({
        user_id: user.id,
        task_id: task?.id, // Optional linkage
        started_at: startTime.toISOString(),
        ended_at: endTime.toISOString(),
        duration_seconds: duration,
        status: 'completed'
      })
    } catch (err) {
      console.error("Failed to save session", err)
    }
  }, [user, task])

  // Toggle Timer
  const toggleTimer = () => {
    if (isActive) {
      // Pausing: Save session
      saveSession()
      sessionStartTimeRef.current = null
      setIsActive(false)
    } else {
      // Starting
      sessionStartTimeRef.current = new Date()
      setIsActive(true)
    }
  }

  useEffect(() => {
    const fetchTask = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, projects(name)')
        .eq('id', resolvedParams.taskId)
        .single()
      
      if (error) {
        toast.error("Task not found")
        router.push('/dashboard')
        return
      }
      setTask(data)
      setIsLoading(false)
    }
    fetchTask()
  }, [resolvedParams.taskId, router])

  // Timer Interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((seconds) => seconds + 1)
      }, 1000)
    }
    return () => {
        if (interval) clearInterval(interval)
    }
  }, [isActive])

  // Cleanup on unmount (if user leaves page while timer running)
  useEffect(() => {
    return () => {
      if (isActive && sessionStartTimeRef.current) {
        saveSession()
      }
    }
  }, [isActive, saveSession])

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleComplete = async () => {
      if (!task) return
      
      // Save any final session time
      if (isActive) {
        await saveSession()
        setIsActive(false)
      }
      
      try {
          // Find 'Done' column for this project
          const { data: doneCol } = await supabase
            .from('columns')
            .select('id')
            .eq('project_id', task.project_id)
            .ilike('title', '%done%') // Fuzzy match 'Done'
            .single()
          
          if (doneCol) {
              await supabase
                .from('tasks')
                .update({ 
                    column_id: doneCol.id,
                    completed_at: new Date().toISOString()
                })
                .eq('id', task.id)
              
              toast.success("Task completed! Great job.")
              router.push(`/dashboard/projects/${task.project_id}`)
          } else {
              toast.success("Session ended.")
              router.back()
          }
      } catch (e) {
          console.error(e)
          router.back()
      }
  }

  if (isLoading) {
      return <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
          <Loader2 className="h-10 w-10 animate-spin" />
      </div>
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white flex flex-col items-center justify-center relative overflow-hidden">
       {/* Background glow */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

       {/* Header */}
       <div className="absolute top-8 left-8">
          <Button variant="ghost" className="text-white/50 hover:text-white" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
       </div>

       <div className="z-10 flex flex-col items-center text-center max-w-2xl px-4 animate-in fade-in zoom-in duration-500">
          <div className="mb-6 flex flex-col items-center gap-4">
             <div className="flex items-center gap-2 text-primary/80 uppercase tracking-widest text-sm font-medium">
                <Maximize2 className="h-4 w-4" /> Focus Mode
             </div>
             {!isActive && <div className="scale-125 origin-center"><QuoteWidget /></div>}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {task?.title}
          </h1>
          
          <div className="text-8xl md:text-9xl font-mono font-light tracking-tighter mb-12 tabular-nums">
            {formatTime(seconds)}
          </div>

          <div className="flex items-center gap-6">
             <Button 
                size="lg" 
                className={cn(
                    "h-16 px-8 text-xl rounded-full transition-all",
                    isActive ? "bg-orange-500 hover:bg-orange-600" : "bg-emerald-500 hover:bg-emerald-600"
                )}
                onClick={toggleTimer}
             >
                {isActive ? (
                    <><Pause className="mr-2 h-6 w-6" /> Pause</>
                ) : (
                    <><Play className="mr-2 h-6 w-6" /> {seconds > 0 ? "Resume" : "Start Session"}</>
                )}
             </Button>

             <Button 
                size="lg" 
                variant="secondary"
                className="h-16 px-8 text-xl rounded-full bg-white/10 hover:bg-white/20 text-white border-0"
                onClick={handleComplete}
             >
                <CheckCircle2 className="mr-2 h-6 w-6" /> Complete
             </Button>
          </div>
       </div>

       <div className="absolute bottom-8 text-white/30 text-sm">
          Project: {task?.projects?.name}
       </div>
       
       <FocusPlayer />
    </div>
  )
}
