import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Server, Activity, AlertCircle, CheckCircle } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'

interface DashboardStats {
  total_servers: number
  running_servers: number
  stopped_servers: number
  error_servers: number
}

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    total_servers: 0,
    running_servers: 0,
    stopped_servers: 0,
    error_servers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/servers')
      const servers = response.data
      
      const stats = {
        total_servers: servers.length,
        running_servers: servers.filter((s: any) => s.status === 'running').length,
        stopped_servers: servers.filter((s: any) => s.status === 'stopped').length,
        error_servers: servers.filter((s: any) => s.status === 'error').length,
      }
      
      setStats(stats)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <div className='flex items-center space-x-4'>
          <h2 className='text-lg font-semibold'>仪表板</h2>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold tracking-tight'>欢迎使用 MCP Fleet</h1>
          <p className='text-muted-foreground mt-2'>
            管理和监控您的 MCP 服务器集群
          </p>
        </div>

        {/* Stats Cards */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                总服务器数
              </CardTitle>
              <Server className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{loading ? '-' : stats.total_servers}</div>
              <p className='text-xs text-muted-foreground mt-1'>
                所有 MCP 服务器实例
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                运行中
              </CardTitle>
              <CheckCircle className='h-4 w-4 text-green-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-green-600'>
                {loading ? '-' : stats.running_servers}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>
                正常运行的服务器
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                已停止
              </CardTitle>
              <Activity className='h-4 w-4 text-gray-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-gray-600'>
                {loading ? '-' : stats.stopped_servers}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>
                已停止的服务器
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                异常
              </CardTitle>
              <AlertCircle className='h-4 w-4 text-red-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-red-600'>
                {loading ? '-' : stats.error_servers}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>
                出现错误的服务器
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
            <CardDescription>
              常用的管理功能入口
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            <Link to='/servers'>
              <Button variant='outline' className='w-full justify-start'>
                <Server className='mr-2 h-4 w-4' />
                管理服务器
              </Button>
            </Link>
            <Link to='/system-status'>
              <Button variant='outline' className='w-full justify-start'>
                <Activity className='mr-2 h-4 w-4' />
                系统状态
              </Button>
            </Link>
            <Button variant='outline' className='w-full justify-start' disabled>
              <AlertCircle className='mr-2 h-4 w-4' />
              查看日志
            </Button>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>系统信息</CardTitle>
            <CardDescription>
              MCP Fleet 平台状态
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>平台版本</span>
                <span className='text-sm font-medium'>v1.0.0</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>运行时间</span>
                <span className='text-sm font-medium'>正常运行</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>最后更新</span>
                <span className='text-sm font-medium'>{new Date().toLocaleDateString('zh-CN')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}

