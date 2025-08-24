
import AppRoutes from "./routes/Routes"
import { AuthProvider } from "./context/AuthContext"
import { PaymentProvider } from "./context/PaymentContext"
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <AuthProvider>
        <PaymentProvider>
          <AppRoutes/>   
        </PaymentProvider>
      </AuthProvider>
      <Toaster />
    </>
  )
}

export default App
