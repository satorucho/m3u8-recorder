'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Radio, 
  Calendar, 
  FolderOpen, 
  Home,
  Settings
} from 'lucide-react'

const navigation = [
  { name: 'ダッシュボード', href: '/', icon: Home },
  { name: 'チャンネル', href: '/channels', icon: Radio },
  { name: '録画予約', href: '/recordings', icon: Calendar },
  { name: '録画ファイル', href: '/files', icon: FolderOpen },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
          M3U8 Recorder
        </h1>
        <p className="text-xs text-zinc-500 mt-1">IPTV Recording Server</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="text-xs text-zinc-600 text-center">
          v1.0.0
        </div>
      </div>
    </aside>
  )
}

