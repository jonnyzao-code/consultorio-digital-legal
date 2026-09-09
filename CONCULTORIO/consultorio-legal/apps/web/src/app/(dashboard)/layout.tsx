'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Scale, LayoutDashboard, PlusCircle, MessageSquare, FileText,
  Briefcase, CreditCard, LogOut, Menu, X, Bell, ChevronDown, User,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/consulta', label: 'Nueva Consulta', icon: PlusCircle },
  { href: '/dashboard/consultas', label: 'Mis Consultas', icon: MessageSquare },
  { href: '/dashboard/documentos', label: 'Mis Documentos', icon: FileText },
  { href: '/dashboard/procesos', label: 'Mis Procesos', icon: Briefcase },
  { href: '/dashboard/pagos', label: 'Pagos', icon: CreditCard },
]

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const { logout, user } = useAuth()

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-primary z-40 flex flex-col',
          'transform transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <Scale className="w-7 h-7 text-secondary" />
            <span className="text-white font-bold text-lg">ConsultorioLegal</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User summary */}
        {user && (
          <div className="px-4 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center text-primary-900 font-bold text-sm">
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.nombre}</p>
                <p className="text-blue-300 text-xs capitalize">{user.tipo}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive ? 'text-secondary' : 'text-blue-300')} />
                {label}
                {href === '/consulta' && (
                  <span className="ml-auto bg-secondary text-primary-900 text-xs font-bold px-1.5 py-0.5 rounded">
                    IA
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium
                       text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}

function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()

  const currentPage = navItems.find((item) => {
    if (item.href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(item.href)
  })

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-border shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold text-primary text-sm md:text-base">
              {currentPage?.label || 'Dashboard'}
            </h1>
            <p className="text-xs text-muted-foreground hidden md:block">
              Consultorio Digital Legal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/consulta"
            className="hidden sm:inline-flex items-center gap-1.5 bg-primary text-white text-sm font-semibold
                       px-4 py-2 rounded-lg hover:bg-primary-800 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Nueva consulta
          </Link>

          <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user?.nombre?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-border rounded-xl
                              shadow-card-hover z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-primary truncate">{user?.nombre}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/dashboard/perfil"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="w-4 h-4" /> Mi perfil
                  </Link>
                  <Link
                    href="/dashboard/pagos"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <CreditCard className="w-4 h-4" /> Mis pagos
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-2xl mb-4">
            <Scale className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen bg-background-secondary overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
