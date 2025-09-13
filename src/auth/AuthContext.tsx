import React from 'react'

type User = { id: string; email: string; companyId: string } | null
type AuthState = { user: User; loading: boolean }

const AuthContext = React.createContext<{
  state: AuthState
  setUser: (u: User) => void
}>({ state: { user: null, loading: true }, setUser: () => {} })

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // TODO: volání GET /auth/me -> setUser / setLoading(false)
    setLoading(false)
  }, [])

  return (
    <AuthContext.Provider value={{ state: { user, loading }, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => React.useContext(AuthContext)
