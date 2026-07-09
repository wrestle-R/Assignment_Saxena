import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useState } from "react"
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom"

import { DashboardPage } from "@/components/dashboard-page"
import { DashboardShellSkeleton } from "@/components/dashboard-skeleton"
import { LoginPage } from "@/components/login-page"
import { ThemeProvider } from "@/components/theme-provider"
import { getSession, login, logout } from "@/lib/api"
import type { User } from "@/types"

function SessionGate({
  children,
}: {
  children: React.ReactNode
}) {
  const location = useLocation()
  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
  })

  if (sessionQuery.isPending) {
    return <DashboardShellSkeleton sessionOnly />
  }

  if (sessionQuery.isError) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  return children
}

function LoginRoute() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
  })

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (user: User) => {
      queryClient.setQueryData(["session"], user)
      navigate("/dashboard", { replace: true })
    },
  })

  if (sessionQuery.isSuccess) {
    return <Navigate to="/dashboard" replace />
  }

  return (
      <LoginPage
        errorMessage={
          loginMutation.error instanceof Error ? loginMutation.error.message : null
        }
        isSubmitting={loginMutation.isPending}
        onSubmit={async (credentials) => {
          await loginMutation.mutateAsync(credentials)
        }}
      />
  )
}

function DashboardRoute() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
  })

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["exceptions"] })
      queryClient.removeQueries({ queryKey: ["exception-detail"] })
      queryClient.removeQueries({ queryKey: ["data-quality-issues"] })
      queryClient.removeQueries({ queryKey: ["data-quality-issue-detail"] })
      queryClient.setQueryData(["session"], null)
      navigate("/", { replace: true })
    },
  })

  return (
    <SessionGate>
      <DashboardPage
        currentUser={sessionQuery.data as User}
        onLogout={async () => {
          await logoutMutation.mutateAsync()
        }}
      />
    </SessionGate>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginRoute />} />
      <Route path="/dashboard" element={<DashboardRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
