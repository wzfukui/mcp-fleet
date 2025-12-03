import { useEffect, useState } from 'react'
import { MCPServer, mcpApi } from '@/lib/api'
import { ServerCard } from './server-card'
import { Skeleton } from '@/components/ui/skeleton'

interface ServerListProps {
  key?: number // Used to force refresh
  refreshTrigger: number
}

export function ServerList({ refreshTrigger }: ServerListProps) {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0) // Internal refresh

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await mcpApi.getServers()
      setServers(data)
    } catch (error) {
      console.error('Failed to fetch servers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [refreshTrigger, refreshKey])

  const handleUpdate = () => {
    setRefreshKey((prev) => prev + 1)
  }

  if (loading && servers.length === 0) {
    return (
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className='h-[200px] w-full rounded-xl' />
        ))}
      </div>
    )
  }

  if (servers.length === 0) {
    return (
      <div className='flex h-[200px] items-center justify-center rounded-xl border border-dashed text-muted-foreground'>
        No servers found. Create one to get started.
      </div>
    )
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {servers.map((server) => (
        <ServerCard key={server.id} server={server} onUpdate={handleUpdate} />
      ))}
    </div>
  )
}

