import { useEffect, useState } from 'react'
import { mcpApi, SystemStatus } from '@/lib/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RefreshCw, CheckCircle2, XCircle, Container, Image } from 'lucide-react'
import { handleApiError } from '@/lib/error-handler'
import { toast } from 'sonner'

export function SystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStatus = async () => {
    setIsLoading(true)
    try {
      const data = await mcpApi.getSystemStatus()
      setStatus(data)
    } catch (error) {
      handleApiError(error, 'Failed to fetch system status')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    try {
      return new Date(dateStr).toLocaleString()
    } catch {
      return dateStr
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>System Status</h1>
          <p className='text-muted-foreground'>
            Docker service status and container information
          </p>
        </div>
        <Button onClick={fetchStatus} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Docker Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            {status?.docker_available ? (
              <CheckCircle2 className='h-5 w-5 text-green-500' />
            ) : (
              <XCircle className='h-5 w-5 text-red-500' />
            )}
            Docker Service
          </CardTitle>
          <CardDescription>
            {status?.docker_available
              ? 'Docker is running and available'
              : 'Docker is not available'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status?.docker_available ? (
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Version</p>
                <p className='text-lg font-semibold'>{status.docker_version || 'N/A'}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>API Version</p>
                <p className='text-lg font-semibold'>{status.api_version || 'N/A'}</p>
              </div>
            </div>
          ) : (
            <div className='rounded-md bg-destructive/10 p-4 text-sm text-destructive'>
              {status?.error || 'Docker service is not running. Please start Docker.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Containers Card */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Container className='h-5 w-5' />
            Containers ({status?.containers.length || 0})
          </CardTitle>
          <CardDescription>All Docker containers on this system</CardDescription>
        </CardHeader>
        <CardContent>
          {status?.containers && status.containers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {status.containers.map((container) => (
                  <TableRow key={container.id}>
                    <TableCell className='font-mono text-xs'>{container.id}</TableCell>
                    <TableCell>{container.name}</TableCell>
                    <TableCell className='text-sm'>{container.image}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          container.status === 'running'
                            ? 'default'
                            : container.status === 'exited'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {container.status}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-xs text-muted-foreground'>
                      {formatDate(container.created)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className='text-center text-muted-foreground py-8'>No containers found</p>
          )}
        </CardContent>
      </Card>

      {/* Images Card */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Image className='h-5 w-5' />
            Images ({status?.images.length || 0})
          </CardTitle>
          <CardDescription>Docker images available on this system</CardDescription>
        </CardHeader>
        <CardContent>
          {status?.images && status.images.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {status.images.map((image) => (
                  <TableRow key={image.id}>
                    <TableCell className='font-mono text-xs'>{image.id}</TableCell>
                    <TableCell>
                      {image.tags.length > 0 ? (
                        <div className='flex flex-wrap gap-1'>
                          {image.tags.map((tag) => (
                            <Badge key={tag} variant='outline' className='text-xs'>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className='text-muted-foreground text-sm'>{'<none>'}</span>
                      )}
                    </TableCell>
                    <TableCell>{formatBytes(image.size)}</TableCell>
                    <TableCell className='text-xs text-muted-foreground'>
                      {formatDate(image.created)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className='text-center text-muted-foreground py-8'>No images found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

