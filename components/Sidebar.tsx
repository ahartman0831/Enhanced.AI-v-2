'use client'

import { useState, useEffect } from 'react'
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
  Stethoscope,
  TrendingUp,
  User,
  Shield,
  Beaker,
  BarChart3,
  Calculator,
  CreditCard,
  Lock,
  Sparkles,
  ShoppingBag
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSupabase } from '@/hooks/useSupabase'
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier'
import { getRequiredTier } from '@/lib/feature-gates'
import { Logo } from '@/components/Logo'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Compounds', href: '/compounds', icon: Pill },
  { name: 'Stack Explorer', href: '/stack-explorer', icon: Search },
  /* STACK_EDUCATION_FEATURE START */ { name: 'Stack Education', href: '/stack-education', icon: Beaker }, /* STACK_EDUCATION_FEATURE END */
  { name: 'Side Effects', href: '/side-effects', icon: AlertTriangle },
  { name: 'Order Blood Test', href: '/blood-panel-order', icon: Beaker },
  { name: 'Bloodwork Parser', href: '/bloodwork-parser', icon: FileText },
  { name: 'Bloodwork History', href: '/bloodwork-history', icon: BarChart3 },
  { name: 'Progress Photos', href: '/progress-photos', icon: Camera },
  { name: 'FFMI Calculator', href: '/ffmi-calculator', icon: Calculator },
  { name: 'Results Forecaster', href: '/results-forecaster', icon: TrendingUp },
  { name: 'Recovery Timeline', href: '/recovery-timeline', icon: Clock },
  { name: 'Counterfeit Checker', href: '/counterfeit-checker', icon: Shield },
  { name: 'Supplement Analyzer', href: '/supplement-analyzer', icon: Sparkles },
  { name: 'Telehealth Referral', href: '/telehealth-referral', icon: Stethoscope },
  { name: 'Shop', href: '/shop', icon: ShoppingBag },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Subscription', href: '/subscription', icon: CreditCard },
]

export function Sidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { supabase } = useSupabase()
  const { isPaid, isElite } = useSubscriptionTier()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-28 w-full items-stretch justify-stretch p-3 border-b">
        <div className="flex-1 min-w-0 min-h-0 flex items-center justify-center">
          <Logo size="fill" showText={false} className="justify-center" />
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const required = getRequiredTier(item.href)
          const hasAccess =
            required === 'free' ||
            (required === 'pro' && (isPaid || isElite)) ||
            (required === 'elite' && isElite)
          const isGated = !hasAccess
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-secondary",
                  isGated && "opacity-80"
                )}
              >
                <item.icon className="mr-2 h-4 w-4 shrink-0" />
                <span className="flex-1 truncate text-left">{item.name}</span>
                {isGated && (
                  <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" title={`${required === 'elite' ? 'Elite' : 'Pro'} feature`} />
                )}
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
          {!mounted ? (
            <Moon className="mr-2 h-4 w-4" />
          ) : theme === 'dark' ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          {!mounted ? 'Theme' : theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
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