
import AppRoutes from "./routes/Routes"
import { AuthProvider } from "./context/AuthContext"
import { PaymentProvider } from "./context/PaymentContext"

function App() {
  return (
    <>
      <AuthProvider>
        <PaymentProvider>
          <AppRoutes/>   
        </PaymentProvider>
      </AuthProvider>
    </>
  )
}

export default App
