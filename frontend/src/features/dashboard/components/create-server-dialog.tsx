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
import { Plus } from 'lucide-react'

interface CreateServerDialogProps {
  onServerCreated: () => void
}

interface FormData {
  name: string
  description: string
  entry_object: string
  port?: number
  command?: string
  args?: string
  file: FileList
}

export function CreateServerDialog({ onServerCreated }: CreateServerDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      entry_object: 'mcp',
      port: undefined,
      command: '',
      args: '',
    },
  })

  async function onSubmit(data: FormData) {
    if (!data.file || data.file.length === 0) {
      toast.error('Please select a file')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', data.name)
      if (data.description) formData.append('description', data.description)
      formData.append('entry_object', data.entry_object)
      if (data.port) formData.append('port', String(data.port))
      if (data.command) formData.append('command', data.command)
      if (data.args) formData.append('args', data.args)
      formData.append('file', data.file[0])

      await mcpApi.createServer(formData)
      toast.success('Server created successfully')
      setOpen(false)
      form.reset()
      onServerCreated()
    } catch (error) {
      console.error(error)
      toast.error('Failed to create server')
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
      <DialogContent className='sm:max-w-[600px] overflow-y-auto max-h-[90vh]'>
        <DialogHeader>
          <DialogTitle>Create MCP Server</DialogTitle>
          <DialogDescription>
            Upload a Python script or archive (.zip, .tar.gz) to deploy a new MCP server.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              rules={{ required: 'Name is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
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
                    <FormLabel>Entry Object (Python only)</FormLabel>
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
                    <FormLabel>Port (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type='number' 
                        placeholder='Auto' 
                        {...field} 
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
                      <Input placeholder='run main.py, --dir ...' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='file'
              // rules={{ required: 'File is required' }} // Controlled manually
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Upload Code (.py, .zip, .tar.gz)</FormLabel>
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
                {isLoading ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
