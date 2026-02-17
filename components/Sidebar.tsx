'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Search,
  AlertTriangle,
  Pill,
  FileText,
  Settings,
  LogOut,
  Moon,
  Sun,
  Camera,
  Clock,
  Stethoscope
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSupabase } from '@/hooks/useSupabase'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Compounds', href: '/compounds', icon: Pill },
  { name: 'Stack Explorer', href: '/stack-explorer', icon: Search },
  { name: 'Side Effects', href: '/side-effects', icon: AlertTriangle },
  { name: 'Progress Photos', href: '/progress-photos', icon: Camera },
  { name: 'Recovery Timeline', href: '/recovery-timeline', icon: Clock },
  { name: 'Telehealth Referral', href: '/telehealth-referral', icon: Stethoscope },
]

export function Sidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { supabase } = useSupabase()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <h1 className="text-xl font-bold">Enhanced AI</h1>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-secondary"
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full justify-start"
        >
          {theme === 'dark' ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start text-destructive hover:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}