"use client"

import { useState, useEffect } from "react"

export function Greeting() {
  const [greeting, setGreeting] = useState("Good morning")

  useEffect(() => {
    const hour = new Date().getHours()
    
    if (hour >= 5 && hour < 12) {
      setGreeting("Good morning")
    } else if (hour >= 12 && hour < 18) {
      setGreeting("Good afternoon")
    } else {
      setGreeting("Good evening")
    }
  }, [])

  return (
    <h1 className="text-3xl font-bold tracking-tight">{greeting}, Dev.</h1>
  )
}
