import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { mcpApi, MCPServer, UpdateServerRequest } from '@/lib/api'
import { toast } from 'sonner'
import { Upload, Trash2, FileCode, Settings } from 'lucide-react'

interface EditServerDialogProps {
  server: MCPServer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onServerUpdated: () => void
}

export function EditServerDialog({
  server,
  open,
  onOpenChange,
  onServerUpdated,
}: EditServerDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [codeFile, setCodeFile] = useState<File | null>(null)
  const [configFiles, setConfigFiles] = useState<File[]>([])

  const form = useForm<UpdateServerRequest & { port?: number }>({
    defaultValues: {
      description: '',
      entry_object: '',
      port: undefined,
      command: '',
      args: '',
    },
  })

  useEffect(() => {
    if (server) {
      form.reset({
        description: server.description || '',
        entry_object: server.entry_object || 'mcp',
        port: server.host_port, // Use host_port as the configured port for now
        command: server.command || '',
        args: server.args || '',
      })
    }
  }, [server, form])

  async function onSubmit(data: UpdateServerRequest & { port?: number }) {
    if (!server) return

    setIsLoading(true)
    try {
      // 更新基本信息
      const updateData: UpdateServerRequest = {
        description: data.description,
        entry_object: data.entry_object,
        command: data.command,
        args: data.args,
      }
      // @ts-ignore
      if (data.port) updateData.port = Number(data.port)

      await mcpApi.updateServer(server.id, updateData)
      toast.success('基本信息更新成功')
      onOpenChange(false)
      onServerUpdated()
    } catch (error) {
      console.error(error)
      toast.error('更新失败，请确保服务器已停止')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUploadCode() {
    if (!server || !codeFile) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', codeFile)

      const response = await fetch(`/api/servers/${server.id}/upload-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })

      if (!response.ok) throw new Error('上传失败')

      toast.success('代码上传成功，请重启服务器')
      setCodeFile(null)
      onServerUpdated()
    } catch (error) {
      console.error(error)
      toast.error('代码上传失败')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUploadConfig() {
    if (!server || configFiles.length === 0) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      configFiles.forEach(file => {
        formData.append('config_files', file)
      })

      const response = await fetch(`/api/servers/${server.id}/upload-config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })

      if (!response.ok) throw new Error('上传失败')

      toast.success('配置文件上传成功')
      setConfigFiles([])
      onServerUpdated()
    } catch (error) {
      console.error(error)
      toast.error('配置文件上传失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>编辑服务器</DialogTitle>
          <DialogDescription>
            更新服务器配置。修改代码或配置需要先停止服务器。
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue='basic' className='w-full'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='basic'>
              <Settings className='mr-2 h-4 w-4' />
              基本信息
            </TabsTrigger>
            <TabsTrigger value='code'>
              <FileCode className='mr-2 h-4 w-4' />
              代码
            </TabsTrigger>
            <TabsTrigger value='config'>
              <Upload className='mr-2 h-4 w-4' />
              配置文件
            </TabsTrigger>
          </TabsList>

          {/* 基本信息 Tab */}
          <TabsContent value='basic'>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder='Describe your tool...' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='entry_object'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Object</FormLabel>
                    <FormControl>
                      <Input placeholder='mcp' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='port'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Host Port (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='30000-40000'
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='command'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Command (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='uv, python, node...' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='args'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Arguments (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='run main.py' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? '更新中...' : '更新基本信息'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </TabsContent>

      {/* 代码 Tab */}
      <TabsContent value='code' className='space-y-4'>
        <div className='space-y-3'>
          <div>
            <h3 className='text-sm font-medium mb-2'>重新上传代码包</h3>
            <p className='text-xs text-muted-foreground mb-3'>
              上传新的代码包将替换现有代码。支持 .py, .zip, .tar.gz 格式。
            </p>
          </div>

          {codeFile ? (
            <div className='flex items-center justify-between py-3 px-4 bg-muted rounded-md'>
              <div className='flex items-center gap-2'>
                <FileCode className='h-4 w-4' />
                <span className='text-sm font-mono'>{codeFile.name}</span>
                <span className='text-xs text-muted-foreground'>
                  ({(codeFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setCodeFile(null)}
              >
                <Trash2 className='h-4 w-4 text-red-500' />
              </Button>
            </div>
          ) : (
            <label>
              <input
                type='file'
                accept='.py,.zip,.tar,.gz,.tgz,.tar.gz'
                onChange={(e) => e.target.files && setCodeFile(e.target.files[0])}
                className='hidden'
              />
              <div className='border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover:border-primary'>
                <Upload className='h-8 w-8 mx-auto mb-2 text-muted-foreground' />
                <p className='text-sm text-muted-foreground'>
                  点击选择文件或拖拽到此处
                </p>
              </div>
            </label>
          )}

          {codeFile && (
            <Button
              onClick={handleUploadCode}
              disabled={isLoading}
              className='w-full'
            >
              {isLoading ? '上传中...' : '上传代码'}
            </Button>
          )}

          <div className='bg-yellow-50 border border-yellow-200 rounded-md p-3'>
            <p className='text-xs text-yellow-800'>
              ⚠️ 上传新代码后需要重启服务器才能生效
            </p>
          </div>
        </div>
      </TabsContent>

      {/* 配置文件 Tab */}
      <TabsContent value='config' className='space-y-4'>
        <div className='space-y-3'>
          <div>
            <h3 className='text-sm font-medium mb-2'>上传配置文件</h3>
            <p className='text-xs text-muted-foreground mb-3'>
              上传新的配置文件，同名文件将被覆盖。
            </p>
          </div>

          <label>
            <input
              type='file'
              multiple
              onChange={(e) => e.target.files && setConfigFiles(Array.from(e.target.files))}
              className='hidden'
            />
            <Button type='button' variant='outline' className='w-full' asChild>
              <span>
                <Upload className='mr-2 h-4 w-4' />
                选择配置文件
              </span>
            </Button>
          </label>

          {configFiles.length > 0 && (
            <>
              <div className='space-y-2 border rounded-md p-3 max-h-[300px] overflow-y-auto'>
                {configFiles.map((file, index) => (
                  <div key={index} className='flex items-center justify-between py-2 px-3 bg-muted rounded-md'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-mono'>{file.name}</span>
                      <span className='text-xs text-muted-foreground'>
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setConfigFiles(configFiles.filter((_, i) => i !== index))}
                    >
                      <Trash2 className='h-4 w-4 text-red-500' />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleUploadConfig}
                disabled={isLoading}
                className='w-full'
              >
                {isLoading ? '上传中...' : `上传 ${configFiles.length} 个配置文件`}
              </Button>
            </>
          )}

          {server && server.config_files && server.config_files.length > 0 && (
            <div className='mt-4'>
              <h4 className='text-sm font-medium mb-2'>现有配置文件</h4>
              <div className='space-y-1 border rounded-md p-3 max-h-[200px] overflow-y-auto'>
                {server.config_files.map((cfg) => (
                  <div key={cfg.id} className='text-sm font-mono text-muted-foreground py-1'>
                    {cfg.filename}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
      </DialogContent>
    </Dialog>
  )
}
