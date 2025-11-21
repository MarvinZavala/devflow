"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/hooks/use-user"
import { Loader2, Zap, TrendingUp } from "lucide-react"
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface HourlyMetric {
  hour: string
  minutes: number
  rawHour: number
}

export function ProductivityAnalytics() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [totalHours, setTotalHours] = useState(0)
  const [hourlyData, setHourlyData] = useState<HourlyMetric[]>([])
  
  useEffect(() => {
    if (!user) return
    
    const fetchData = async () => {
      // Get sessions from last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { data: sessions } = await supabase
        .from('focus_sessions')
        .select('started_at, duration_seconds')
        .eq('user_id', user.id)
        .gte('started_at', sevenDaysAgo.toISOString())
      
      if (sessions) {
        // Calculate total hours
        const totalSeconds = sessions.reduce((acc, session) => acc + session.duration_seconds, 0)
        setTotalHours(Math.round((totalSeconds / 3600) * 10) / 10)
        
        // Calculate Hourly Distribution (Cronotype)
        const distribution = new Array(24).fill(0)
        sessions.forEach(session => {
           const date = new Date(session.started_at)
           const hour = date.getHours()
           // Add minutes to that hour bucket
           distribution[hour] += (session.duration_seconds / 60)
        })
        
        const chartData = distribution.map((minutes, hour) => ({
          hour: `${hour}:00`,
          minutes: Math.round(minutes),
          rawHour: hour // for sorting/coloring
        }))
        
        setHourlyData(chartData)
      }
      setLoading(false)
    }
    
    fetchData()
  }, [user])

  if (loading) return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 animate-pulse">
        <div className="col-span-full lg:col-span-3 h-40 bg-muted rounded-xl" />
        <div className="col-span-full lg:col-span-4 h-40 bg-muted rounded-xl" />
    </div>
  )
  
  // Find peak hour
  const peakHour = hourlyData.reduce((max, curr) => curr.minutes > max.minutes ? curr : max, { minutes: 0, hour: 'N/A' })

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-full lg:col-span-3 border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-background to-background">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-500 uppercase tracking-wider">
            <Zap className="h-4 w-4 text-orange-500 fill-orange-500" />
            Deep Work (7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-5xl font-bold tracking-tighter text-foreground">{totalHours}</span>
              <span className="text-muted-foreground ml-2">hours</span>
            </div>
            <div className="text-sm text-muted-foreground">
               {peakHour.minutes > 0 ? (
                   <>Your peak productivity time is <span className="font-bold text-orange-400">{peakHour.hour}</span>.</>
               ) : (
                   "Complete a focus session to see insights."
               )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-full lg:col-span-4 border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background to-background">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-emerald-500 uppercase tracking-wider">
             <TrendingUp className="h-4 w-4 text-emerald-500" />
             Daily Cronotype
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[150px]">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={hourlyData}>
               <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 10, fill: '#71717a' }} 
                  interval={3}
                  axisLine={false}
                  tickLine={false}
               />
               <Tooltip 
                 contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                 itemStyle={{ color: '#e4e4e7' }}
                 cursor={{fill: '#27272a', opacity: 0.4}}
               />
               <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                 {hourlyData.map((entry, index) => (
                   <Cell 
                    key={`cell-${index}`} 
                    fill={entry.minutes > 0 ? (entry.hour === peakHour.hour ? '#f97316' : '#10b981') : '#27272a'} 
                    fillOpacity={entry.minutes > 0 ? 1 : 0.3}
                   />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
