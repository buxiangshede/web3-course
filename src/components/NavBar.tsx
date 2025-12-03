import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { WalletButton } from './WalletButton'

const navItems = [
  { label: '课程购买', path: '/' },
  { label: '创建课程', path: '/create' },
  { label: '质押理财', path: '/staking' },
  { label: '个人中心', path: '/profile' },
]

export const NavBar = () => {
  const [displayName, setDisplayName] = useState('YD 创作者')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem('yd-display-name')
    if (stored) setDisplayName(stored)

    const handleUpdate = (event: Event) => {
      const custom = event as CustomEvent<string>
      if (typeof custom.detail === 'string') {
        setDisplayName(custom.detail)
      }
    }

    window.addEventListener('yd-display-name-update', handleUpdate as EventListener)
    return () => window.removeEventListener('yd-display-name-update', handleUpdate as EventListener)
  }, [])

  const location = useLocation()
  const [connected, setConnected] = useState(false)

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/60 bg-slate-900/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-semibold tracking-tight text-white">
          YD Web3 Course
        </Link>
        <nav className="hidden gap-8 text-sm font-medium lg:flex">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`border-b-2 pb-1 transition-colors ${
                  isActive
                    ? 'border-accent text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center gap-3">
          
          <div>
            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  )
}
