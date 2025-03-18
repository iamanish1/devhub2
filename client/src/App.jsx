
import AppRoutes from "./routes/Routes"
import { AuthProvider } from "./context/AuthContext"

function App() {
  

  return (
    <>
    <AuthProvider>
    <AppRoutes/>   
    </AuthProvider>
    
    </>
  )
}

export default App
