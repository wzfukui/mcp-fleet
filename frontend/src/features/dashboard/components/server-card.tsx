import { useState } from 'react'
import { MCPServer, mcpApi } from '@/lib/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Play, Square, Copy, Terminal, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { EditServerDialog } from './edit-server-dialog'
import { handleApiError } from '@/lib/error-handler'

interface ServerCardProps {
  server: MCPServer
  onUpdate: () => void
}

export function ServerCard({ server, onUpdate }: ServerCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    setIsLoading(true)
    try {
      await mcpApi.serverAction(server.id, action)
      toast.success(`Server ${action}ed successfully`)
      onUpdate()
    } catch (error) {
      handleApiError(error, `Failed to ${action} server`)
    } finally {
      setIsLoading(false)
    }
  }

  const copySSEUrl = () => {
    if (!server.sse_url) return
    navigator.clipboard.writeText(server.sse_url)
    toast.success('SSE URL copied to clipboard')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500 hover:bg-green-600'
      case 'error':
        return 'bg-red-500 hover:bg-red-600'
      case 'building':
        return 'bg-yellow-500 hover:bg-yellow-600'
      default:
        return 'bg-slate-500 hover:bg-slate-600'
    }
  }

  return (
    <>
      <Card>
        <CardHeader className='pb-4'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-lg'>{server.name}</CardTitle>
            <Badge className={cn(getStatusColor(server.status))}>
              {server.status.toUpperCase()}
            </Badge>
          </div>
          <CardDescription className='truncate'>
            {server.description || 'No description'}
          </CardDescription>
        </CardHeader>
        <CardContent className='pb-4 space-y-2'>
          <div className='text-sm text-muted-foreground'>
            <span className='font-medium'>Entry:</span> {server.entry_object}
          </div>
          {server.host_port && (
            <div className='text-sm text-muted-foreground'>
              <span className='font-medium'>Port:</span> {server.host_port}
            </div>
          )}
          {server.sse_url && (
            <div className='flex items-center space-x-2 rounded-md bg-muted p-2 text-xs'>
              <code className='flex-1 truncate'>{server.sse_url}</code>
              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6'
                onClick={copySSEUrl}
              >
                <Copy className='h-3 w-3' />
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className='flex justify-between'>
          <div className='flex space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                toast.info('Log viewer coming soon!')
              }}
            >
              <Terminal className='h-3 w-3' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowEdit(true)}
            >
              <Settings2 className='h-3 w-3' />
            </Button>
          </div>
          {server.status === 'running' ? (
            <div className='flex space-x-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={isLoading}
                onClick={() => handleAction('restart')}
              >
                Restart
              </Button>
              <Button
                variant='destructive'
                size='sm'
                disabled={isLoading}
                onClick={() => handleAction('stop')}
              >
                <Square className='mr-2 h-3 w-3 fill-current' />
                Stop
              </Button>
            </div>
          ) : (
            <Button
              size='sm'
              disabled={isLoading}
              onClick={() => handleAction('start')}
            >
              <Play className='mr-2 h-3 w-3 fill-current' />
              Start
            </Button>
          )}
        </CardFooter>
      </Card>

      <EditServerDialog
        server={server}
        open={showEdit}
        onOpenChange={setShowEdit}
        onServerUpdated={onUpdate}
      />
    </>
  )
}
