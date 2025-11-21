"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/hooks/use-user"

interface DevStreakProps {
  className?: string
}

export function DevStreak({ className }: DevStreakProps) {
  const { user } = useUser()
  const [streak, setStreak] = useState(0)
  const [activityData, setActivityData] = useState<number[]>(Array(7).fill(0))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function fetchStreakData() {
      try {
        // 1. Get completed tasks
        const { data, error } = await supabase
          .from('tasks')
          .select('completed_at')
          .eq('assignee_id', user?.id || '') // Or creator, depending on logic
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })

        // Fallback if assignee_id not set (e.g. old tasks) - search by project owner
        // For now, let's assume we filtered by assignee or user owns projects
        // Simplified: Get tasks from user's projects
        const { data: projectTasks, error: projError } = await supabase
            .from('tasks')
            .select('completed_at, projects!inner(user_id)')
            .eq('projects.user_id', user?.id || '')
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false })

        if (projError) throw projError
        
        const tasks = projectTasks || []
        
        // 2. Calculate Streak
        let currentStreak = 0
        const today = new Date()
        today.setHours(0,0,0,0) // Normalize to start of day
        
        const uniqueDays = new Set<string>()
        tasks.forEach((t: any) => {
            const d = new Date(t.completed_at)
            d.setHours(0,0,0,0)
            uniqueDays.add(d.toISOString())
        })

        // Check streaks back from today
        let checkDate = new Date(today)
        
        // If no activity today, check yesterday to start streak? 
        // Usually streak includes today if active, or yesterday if not yet active today.
        // Let's say: If activity today -> 1 + backwards. If no activity today -> check yesterday.
        
        if (!uniqueDays.has(checkDate.toISOString())) {
             // Check yesterday
             checkDate.setDate(checkDate.getDate() - 1)
             if (!uniqueDays.has(checkDate.toISOString())) {
                 currentStreak = 0 // No activity today or yesterday
             } else {
                 // Streak continues from yesterday
                 while (uniqueDays.has(checkDate.toISOString())) {
                     currentStreak++
                     checkDate.setDate(checkDate.getDate() - 1)
                 }
             }
        } else {
            // Has activity today
            while (uniqueDays.has(checkDate.toISOString())) {
                currentStreak++
                checkDate.setDate(checkDate.getDate() - 1)
            }
        }

        setStreak(currentStreak)

        // 3. Calculate Activity (Last 7 Days)
        const activity = Array(7).fill(0)
        const last7Days: string[] = []
        for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            d.setHours(0,0,0,0)
            last7Days.push(d.toISOString())
        }

        tasks.forEach((t: any) => {
            const d = new Date(t.completed_at)
            d.setHours(0,0,0,0)
            const iso = d.toISOString()
            const idx = last7Days.indexOf(iso)
            if (idx !== -1) {
                activity[idx]++
            }
        })
        
        setActivityData(activity)

      } catch (error) {
        console.error("Error loading streak", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStreakData()
  }, [user])

  if (isLoading) return null

  // Find max value for chart scaling
  const maxActivity = Math.max(...activityData, 1)

  return (
    <Card className={`border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-background to-background ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-orange-500 flex items-center gap-2 uppercase tracking-wider">
          <Flame className="h-4 w-4 fill-orange-500 animate-pulse" />
          Dev Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-4xl font-bold tabular-nums text-foreground">
              {streak}
              <span className="text-lg font-normal text-muted-foreground ml-1">days</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {streak > 0 
                ? "You're on fire! Keep shipping." 
                : "Start a streak by completing a task today."}
            </p>
          </div>
          
          {/* Mini Chart */}
          <div className="flex items-end gap-1 h-12 w-32 pb-1">
            {activityData.map((count, i) => (
              <div 
                key={i} 
                className="w-full bg-orange-500/20 rounded-sm hover:bg-orange-500/40 transition-colors relative group"
                style={{ height: `${(count / maxActivity) * 100}%`, minHeight: '4px' }}
              >
                 {/* Tooltip on hover (simple) */}
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-popover text-popover-foreground text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-border">
                    {count} tasks
                 </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
