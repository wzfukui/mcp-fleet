import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { CreateServerDialog } from './components/create-server-dialog'
import { ServerList } from './components/server-list'

export function Dashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleServerCreated = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>MCP Fleet</h1>
          <div className='flex items-center space-x-2'>
            <CreateServerDialog onServerCreated={handleServerCreated} />
          </div>
        </div>
        
        <div className='space-y-4'>
          <ServerList refreshTrigger={refreshTrigger} />
        </div>
      </Main>
    </>
  )
}

const topNav = [
  {
    title: 'Fleet',
    href: 'dashboard/overview',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Settings',
    href: 'dashboard/settings',
    isActive: false,
    disabled: true,
  },
]
