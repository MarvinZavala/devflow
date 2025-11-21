"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { UserNav } from "@/components/dashboard/UserNav"
import { CommandMenu } from "@/components/dashboard/CommandMenu"
import { useUser } from "@/hooks/use-user"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
      return null // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen overflow-hidden">
      <CommandMenu />
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-background md:flex">
        <Sidebar className="w-full" />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <div className="flex items-center gap-4 md:hidden">
             {/* Mobile Menu Trigger could go here */}
             <span className="font-bold">DevFlow</span>
          </div>
          <div className="flex w-full items-center justify-end gap-4">
             {/* Search could go here */}
            <UserNav />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/10 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
