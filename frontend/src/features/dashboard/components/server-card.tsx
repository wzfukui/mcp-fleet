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
import { Play, Square, Copy, Terminal, Settings2, Trash2, RefreshCw, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
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

  const handleAction = async (action: 'start' | 'stop' | 'restart' | 'remove_container' | 'rebuild') => {
    setIsLoading(true)
    try {
      await mcpApi.serverAction(server.id, action)
      const actionText = action === 'remove_container' ? 'Container removed' : 
                        action === 'rebuild' ? 'Server rebuilt' :
                        `Server ${action}ed`
      toast.success(`${actionText} successfully`)
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
            <span className='font-medium'>入口对象:</span> {server.entry_object}
          </div>
          {/* 显示分配的端口（未启动时） */}
          {server.ports && !server.host_port && (
            <div className='text-sm text-muted-foreground'>
              <span className='font-medium'>分配端口:</span> {server.ports}
              <Badge variant='outline' className='ml-2 text-xs'>未启动</Badge>
            </div>
          )}
          {/* 显示运行时端口（已启动时） */}
          {server.host_port && (
            <div className='text-sm text-muted-foreground'>
              <span className='font-medium'>运行端口:</span> {server.host_port}
              {server.host_ports && (
                <span className='ml-2 text-xs text-muted-foreground'>
                  (多端口)
                </span>
              )}
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
            
            {/* 更多操作菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm'>
                  <MoreVertical className='h-3 w-3' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {server.status === 'error' && (
                  <>
                    <DropdownMenuItem onClick={() => handleAction('remove_container')}>
                      <Trash2 className='mr-2 h-4 w-4' />
                      删除容器
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('rebuild')}>
                      <RefreshCw className='mr-2 h-4 w-4' />
                      重新构建
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {server.status === 'stopped' && (
                  <>
                    <DropdownMenuItem onClick={() => handleAction('rebuild')}>
                      <RefreshCw className='mr-2 h-4 w-4' />
                      强制重建
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem 
                  onClick={() => handleAction('remove_container')}
                  className='text-orange-600'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  删除容器（保留数据）
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
