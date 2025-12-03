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
import { mcpApi, MCPServer, UpdateServerRequest } from '@/lib/api'
import { toast } from 'sonner'

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
      // Only send fields that are changed or necessary
      const updateData: UpdateServerRequest = {
        description: data.description,
        entry_object: data.entry_object,
        command: data.command,
        args: data.args,
        // Port needs to be handled carefully, only if supported by backend update
      }
      // Add port if your backend update endpoint supports it (we added it)
      // @ts-ignore
      if (data.port) updateData.port = Number(data.port)

      await mcpApi.updateServer(server.id, updateData)
      toast.success('Server updated successfully')
      onOpenChange(false)
      onServerUpdated()
    } catch (error) {
      console.error(error)
      toast.error('Failed to update server. Ensure it is stopped.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px] overflow-y-auto max-h-[90vh]'>
        <DialogHeader>
          <DialogTitle>Edit Server</DialogTitle>
          <DialogDescription>
            Update server configuration. Server must be stopped.
          </DialogDescription>
        </DialogHeader>
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
                {isLoading ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
