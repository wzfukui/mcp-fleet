import { useEffect, useState } from 'react'
import { mcpApi, type SystemStatus, type PortPoolStatus } from '@/lib/api'
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
import { RefreshCw, CheckCircle2, XCircle, Container, Image, Network } from 'lucide-react'
import { handleApiError } from '@/lib/error-handler'
import { Progress } from '@/components/ui/progress'

export function SystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [portStatus, setPortStatus] = useState<PortPoolStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStatus = async () => {
    setIsLoading(true)
    try {
      const [systemData, portData] = await Promise.all([
        mcpApi.getSystemStatus(),
        mcpApi.getPortPoolStatus()
      ])
      setStatus(systemData)
      setPortStatus(portData)
    } catch (error) {
      handleApiError(error, '获取系统状态失败')
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

  const portUsagePercent = portStatus 
    ? (portStatus.allocated_ports_count / portStatus.total_ports) * 100 
    : 0

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>系统状态</h1>
          <p className='text-muted-foreground'>
            Docker 服务状态、容器信息和端口池管理
          </p>
        </div>
        <Button onClick={fetchStatus} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
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
            Docker 服务
          </CardTitle>
          <CardDescription>
            {status?.docker_available
              ? 'Docker 正在运行'
              : 'Docker 不可用'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status?.docker_available ? (
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>版本</p>
                <p className='text-lg font-semibold'>{status.docker_version || 'N/A'}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>API 版本</p>
                <p className='text-lg font-semibold'>{status.api_version || 'N/A'}</p>
              </div>
            </div>
          ) : (
            <div className='rounded-md bg-destructive/10 p-4 text-sm text-destructive'>
              {status?.error || 'Docker 服务未运行，请启动 Docker'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Port Pool Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Network className='h-5 w-5' />
            端口池状态
          </CardTitle>
          <CardDescription>
            可用端口范围和使用情况
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* 端口池概览 */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>端口范围</p>
              <p className='text-lg font-semibold'>
                {portStatus?.port_pool_start} - {portStatus?.port_pool_end}
              </p>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>总端口数</p>
              <p className='text-lg font-semibold'>{portStatus?.total_ports || 0}</p>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>已分配</p>
              <p className='text-lg font-semibold text-orange-600'>
                {portStatus?.allocated_ports_count || 0}
              </p>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>可用</p>
              <p className='text-lg font-semibold text-green-600'>
                {portStatus?.available_ports_count || 0}
              </p>
            </div>
          </div>

          {/* 使用率进度条 */}
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>端口使用率</span>
              <span className='font-medium'>{portUsagePercent.toFixed(2)}%</span>
            </div>
            <Progress value={portUsagePercent} className='h-2' />
          </div>

          {/* 端口分配表 */}
          {portStatus?.port_assignments && portStatus.port_assignments.length > 0 && (
            <div>
              <h4 className='text-sm font-semibold mb-3'>端口分配详情</h4>
              <div className='max-h-[300px] overflow-y-auto border rounded-md'>
                <Table>
                  <TableHeader>
                    <TableRow>
                  <TableHead>宿主机端口</TableHead>
                  <TableHead>服务器名称</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>容器端口</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portStatus.port_assignments.map((assignment, idx) => (
                      <TableRow key={idx}>
                        <TableCell className='font-mono font-semibold'>
                          {assignment.port}
                        </TableCell>
                        <TableCell>{assignment.server_name}</TableCell>
                        <TableCell>
                          <Badge variant={
                            assignment.status === 'running' ? 'default' :
                            assignment.status === 'stopped' ? 'secondary' :
                            'destructive'
                          }>
                            {assignment.status === 'running' ? '运行中' :
                             assignment.status === 'stopped' ? '已停止' :
                             assignment.status === 'error' ? '错误' : '构建中'}
                          </Badge>
                        </TableCell>
                        <TableCell className='font-mono text-sm text-muted-foreground'>
                          {assignment.container_port || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* 可用端口示例 */}
          {portStatus?.sample_available_ports && portStatus.sample_available_ports.length > 0 && (
            <div>
              <h4 className='text-sm font-semibold mb-2'>可用端口示例（前20个）</h4>
              <div className='flex flex-wrap gap-2'>
                {portStatus.sample_available_ports.map((port) => (
                  <Badge key={port} variant='outline' className='font-mono'>
                    {port}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Containers Card */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Container className='h-5 w-5' />
            容器 ({status?.containers.length || 0})
          </CardTitle>
          <CardDescription>系统上的所有 Docker 容器</CardDescription>
        </CardHeader>
        <CardContent>
          {status?.containers && status.containers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>镜像</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
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
            <p className='text-center text-muted-foreground py-8'>未找到容器</p>
          )}
        </CardContent>
      </Card>

      {/* Images Card */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Image className='h-5 w-5' />
            镜像 ({status?.images.length || 0})
          </CardTitle>
          <CardDescription>系统上可用的 Docker 镜像</CardDescription>
        </CardHeader>
        <CardContent>
          {status?.images && status.images.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>标签</TableHead>
                  <TableHead>大小</TableHead>
                  <TableHead>创建时间</TableHead>
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
            <p className='text-center text-muted-foreground py-8'>未找到镜像</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

