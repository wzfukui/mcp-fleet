import {
  LayoutDashboard,
  Server,
  Terminal,
  Activity,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Administrator', // Will be overwritten by dynamic data
    email: 'admin@mcp',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'MCP Fleet',
      logo: Server,
      plan: 'Internal Platform',
    },
  ],
  navGroups: [
    {
      title: 'Management',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Servers',
          url: '/servers',
          icon: Server,
        },
        {
          title: 'System Status',
          url: '/system-status',
          icon: Activity,
        },
        {
          title: 'Logs',
          url: '/logs', // Placeholder, we might implement later
          icon: Terminal,
        },
      ],
    },
  ],
}
