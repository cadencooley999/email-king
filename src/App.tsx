import "./css/App.css"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Dashboard from "./pages/dashboard.tsx"
import BulkSender from "./pages/bulksender.tsx"
import { useEffect, useState } from "react"
import { auth } from "../src/firebase_funcitons/auth.ts"
import { onAuthStateChanged } from "firebase/auth"

function App() {

  const [userEmail, setUserEmail] = useState("")
  const [accessToken, setAccessToken] = useState("")

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log(user.email)
      }
    })

    return unsub
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard userEmail={userEmail} setUserEmail={(e) => setUserEmail(e)} setAccessToken={(a) => setAccessToken(a)} accessToken={accessToken}/>}/>
        <Route path="/bulk-sender" element={<BulkSender userEmail={userEmail} accessToken={accessToken}/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
