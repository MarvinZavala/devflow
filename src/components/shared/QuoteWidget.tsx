"use client"

import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"

const QUOTES = [
  // Classic Tech & Coding
  "Talk is cheap. Show me the code.",
  "It works on my machine... but we ship to production.",
  "Premature optimization is the root of all evil.",
  "First, solve the problem. Then, write the code.",
  "Code is like humor. When you have to explain it, it’s bad.",
  
  // Anti-Procrastination / Discipline
  "One day or Day One. You decide.",
  "Amateurs sit and wait for inspiration. The rest of us just get up and go to work.",
  "Action is the foundational key to all success.",
  "Don't watch the clock; do what it does. Keep going.",
  "You don't have to be great to start, but you have to start to be great.",
  
  // AI & Vibecoding Era
  "Let the AI write the boilerplate. You build the vision.",
  "Vibecoding is the new pair programming.",
  "Work smarter, not harder. Let the AI do the heavy lifting.",
  "Build 10x faster. Ship 10x more. The AI is your multiplier.",
  "Don't code alone. Vibecode with intelligence.",
  "The future belongs to those who know how to prompt.",
  "Turn your ideas into reality at the speed of thought.",
  
  // Hard Truths
  "Nobody cares about your idea until you ship it.",
  "Comfort is the enemy of progress.",
  "Your competition isn't sleeping.",
  "Focus is the new IQ.",
  
  // Social Media Detox / Deep Work
  "Scroll less, ship more.",
  "TikTok won't pay your bills. Code will.",
  "Your dreams are on the other side of your distraction.",
  "Disconnect to reconnect with your purpose.",
  "Dopamine from shipping > Dopamine from likes.",
  "Stop watching others build. Go build yours.",
  "The algorithm is designed to keep you poor. Close it.",
  "Deep work is the superpower of the 21st century."
]

export function QuoteWidget() {
  const [quote, setQuote] = useState("")

  useEffect(() => {
    // Select a random quote on mount
    // Using date as seed to keep it same for the day? Or purely random? 
    // Let's go purely random for "vibes" every refresh.
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)]
    setQuote(randomQuote)
  }, [])

  if (!quote) return null

  return (
    <div className="flex items-center gap-2 text-base md:text-lg font-medium text-muted-foreground/90 italic animate-in fade-in slide-in-from-bottom-2 duration-700 my-1">
      <Sparkles className="h-4 w-4 text-primary/80" />
      <span>"{quote}"</span>
    </div>
  )
}
