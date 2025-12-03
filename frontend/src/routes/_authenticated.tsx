import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  component: RouteComponent,
})

function RouteComponent() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to='/sign-in' />
  }

  // 必须使用 AuthenticatedLayout 包裹，因为它提供了 SidebarProvider
  return (
    <AuthenticatedLayout>
      <Outlet />
    </AuthenticatedLayout>
  )
}
