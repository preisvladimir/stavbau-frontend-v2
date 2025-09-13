import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthContext'
import { AuthGuard } from '@/auth/AuthGuard'
import DashboardPage from '@/features/dashboard/DashboardPage'
import NotFound from '@/pages/NotFound'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <AuthGuard>
          <DashboardPage />
        </AuthGuard>
      </AuthProvider>
    )
  },
  { path: '*', element: <NotFound /> }
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
