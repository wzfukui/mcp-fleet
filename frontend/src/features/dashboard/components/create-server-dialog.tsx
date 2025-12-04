import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { mcpApi } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

interface CreateServerDialogProps {
  onServerCreated: () => void
}

interface EnvVar {
  key: string
  value: string
  is_secret: boolean
}

interface ConfigFile {
  filename: string
  content: string
}

interface FormData {
  name: string
  description: string
  entry_object: string
  ports?: string
  command?: string
  args?: string
  file: FileList
}

export function CreateServerDialog({ onServerCreated }: CreateServerDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [envVars, setEnvVars] = useState<EnvVar[]>([])
  const [configFiles, setConfigFiles] = useState<ConfigFile[]>([])
  const [showSecrets, setShowSecrets] = useState<Record<number, boolean>>({})

  const form = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      entry_object: 'mcp',
      ports: '',
      command: '',
      args: '',
    },
  })

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '', is_secret: false }])
  }

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index))
  }

  const updateEnvVar = (index: number, field: keyof EnvVar, value: string | boolean) => {
    const updated = [...envVars]
    updated[index] = { ...updated[index], [field]: value }
    setEnvVars(updated)
  }

  const toggleSecretVisibility = (index: number) => {
    setShowSecrets({ ...showSecrets, [index]: !showSecrets[index] })
  }

  const addConfigFile = () => {
    setConfigFiles([...configFiles, { filename: '', content: '' }])
  }

  const removeConfigFile = (index: number) => {
    setConfigFiles(configFiles.filter((_, i) => i !== index))
  }

  const updateConfigFile = (index: number, field: keyof ConfigFile, value: string) => {
    const updated = [...configFiles]
    updated[index] = { ...updated[index], [field]: value }
    setConfigFiles(updated)
  }

  async function onSubmit(data: FormData) {
    if (!data.file || data.file.length === 0) {
      toast.error('请选择文件')
      return
    }

    // 验证环境变量
    for (const env of envVars) {
      if (!env.key.trim()) {
        toast.error('环境变量名称不能为空')
        return
      }
    }

    // 验证配置文件
    for (const cfg of configFiles) {
      if (!cfg.filename.trim()) {
        toast.error('配置文件名不能为空')
        return
      }
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', data.name)
      if (data.description) formData.append('description', data.description)
      formData.append('entry_object', data.entry_object)
      if (data.ports) formData.append('ports', data.ports)
      if (data.command) formData.append('command', data.command)
      if (data.args) formData.append('args', data.args)
      
      // 添加环境变量
      if (envVars.length > 0) {
        formData.append('env_vars', JSON.stringify(envVars))
      }

      // 添加配置文件
      if (configFiles.length > 0) {
        formData.append('config_files', JSON.stringify(configFiles))
      }
      
      formData.append('file', data.file[0])

      await mcpApi.createServer(formData)
      toast.success('服务器创建成功')
      setOpen(false)
      form.reset()
      setEnvVars([])
      setConfigFiles([])
      setShowSecrets({})
      onServerCreated()
    } catch (error) {
      console.error(error)
      toast.error('创建服务器失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className='mr-2 h-4 w-4' /> Create Server
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[900px] overflow-y-auto max-h-[95vh]'>
        <DialogHeader>
          <DialogTitle>创建 MCP 服务器</DialogTitle>
          <DialogDescription>
            上传 Python 脚本或压缩包 (.zip, .tar.gz) 来部署新的 MCP 服务器
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              rules={{ required: '名称不能为空' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名称</FormLabel>
                  <FormControl>
                    <Input placeholder='my-mcp-tool' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder='描述您的工具...' 
                      rows={3} 
                      {...field}
                      value={field.value || ''}
                    />
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
                    <FormLabel>入口对象 (仅 Python)</FormLabel>
                    <FormControl>
                      <Input placeholder='mcp' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='ports'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>端口 (可选)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder='自动分配或 8000,8001' 
                        {...field}
                        value={field.value || ''}
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
                    <FormLabel>自定义命令 (可选)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder='uv, python, node...' 
                        {...field}
                        value={field.value || ''}
                      />
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
                    <FormLabel>参数 (可选)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder='run main.py, --dir ...' 
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 环境变量部分 */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <FormLabel>环境变量</FormLabel>
                <Button type='button' variant='outline' size='sm' onClick={addEnvVar}>
                  <Plus className='mr-1 h-3 w-3' /> 添加环境变量
                </Button>
              </div>
              
              {envVars.length > 0 && (
                <div className='space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-3'>
                  {envVars.map((env, index) => (
                    <div key={index} className='flex items-start gap-2 pb-2 border-b last:border-b-0'>
                      <div className='flex-1 grid grid-cols-2 gap-2'>
                        <Input
                          placeholder='变量名 (如 API_KEY)'
                          value={env.key}
                          onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                        />
                        <div className='relative'>
                          <Input
                            type={env.is_secret && !showSecrets[index] ? 'password' : 'text'}
                            placeholder='变量值'
                            value={env.value}
                            onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                            className='pr-8'
                          />
                          {env.is_secret && (
                            <button
                              type='button'
                              onClick={() => toggleSecretVisibility(index)}
                              className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
                            >
                              {showSecrets[index] ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className='flex items-center gap-2 pt-1'>
                        <div className='flex items-center gap-1'>
                          <Switch
                            checked={env.is_secret}
                            onCheckedChange={(checked) => updateEnvVar(index, 'is_secret', checked)}
                          />
                          <span className='text-xs text-muted-foreground'>密钥</span>
                        </div>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => removeEnvVar(index)}
                          className='h-8 w-8 p-0'
                        >
                          <Trash2 className='h-4 w-4 text-red-500' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 配置文件部分 */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <FormLabel>配置文件 (可选)</FormLabel>
                <Button type='button' variant='outline' size='sm' onClick={addConfigFile}>
                  <Plus className='mr-1 h-3 w-3' /> 添加配置文件
                </Button>
              </div>
              
              {configFiles.length > 0 && (
                <div className='space-y-3 max-h-[300px] overflow-y-auto border rounded-md p-3'>
                  {configFiles.map((cfg, index) => (
                    <div key={index} className='space-y-2 pb-3 border-b last:border-b-0'>
                      <div className='flex items-center gap-2'>
                        <Input
                          placeholder='文件路径 (如 config/dev.json)'
                          value={cfg.filename}
                          onChange={(e) => updateConfigFile(index, 'filename', e.target.value)}
                          className='flex-1'
                        />
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => removeConfigFile(index)}
                          className='h-8 w-8 p-0'
                        >
                          <Trash2 className='h-4 w-4 text-red-500' />
                        </Button>
                      </div>
                      <Textarea
                        placeholder='文件内容...'
                        value={cfg.content}
                        onChange={(e) => updateConfigFile(index, 'content', e.target.value)}
                        className='font-mono text-sm min-h-[120px]'
                      />
                    </div>
                  ))}
                </div>
              )}
              <p className='text-xs text-muted-foreground'>
                配置文件将保存到容器的 /app/data/ 目录，启动参数中使用 /app/data/文件路径 引用
              </p>
            </div>

            <FormField
              control={form.control}
              name='file'
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>上传代码 (.py, .zip, .tar.gz)</FormLabel>
                  <FormControl>
                    <Input
                      {...fieldProps}
                      type='file'
                      accept='.py,.zip,.tar,.gz,.tgz'
                      onChange={(event) => {
                        onChange(event.target.files)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? '创建中...' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
