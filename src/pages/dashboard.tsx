import { Link } from "react-router-dom"
import { signInWithPopup } from 'firebase/auth'
import {auth, microsoftProvider} from "../firebase_funcitons/auth"
import { OAuthProvider } from "firebase/auth/web-extension"

interface DashboardProps {
  userEmail: string
  setUserEmail: (e: string) => void
  setAccessToken: (a: string) => void
  accessToken: string
}

function Dashboard({userEmail, setUserEmail, setAccessToken}: DashboardProps) {

  const handleMicrosoftLogin = async () => {
    try {
      const result = await signInWithPopup(auth, microsoftProvider)
      const credential = OAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      
      const user = result.user;

      setUserEmail(user?.email || "")
      setAccessToken(accessToken || "")
      console.log(user.email, accessToken)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="app-container">
      <header className="hero-section">
        <h1 className="title">Email King</h1>
        <p className="subtitle">Created by Caden Cooley</p>

        <div className="signed-in-status">
          <span>Signed in with:</span>

          {userEmail ? (
            <strong>{userEmail}</strong>
          ) : (
            <em>No email authenticated</em>
          )}
        </div>
      </header>

      <section className="auth-section">
        <div className="auth-card">

          <div className="auth-info">
            <h2>Connect Outlook</h2>

            <p>
              Sign in with Microsoft to send emails directly from your Outlook
              account.
            </p>
          </div>

          <button className="microsoft-auth-button" onClick={handleMicrosoftLogin}>
            <span className="microsoft-logo">
              <span className="ms-red"></span>
              <span className="ms-green"></span>
              <span className="ms-blue"></span>
              <span className="ms-yellow"></span>
            </span>

            Continue with Microsoft
          </button>

        </div>
      </section>

      <section className="actions-section">
        <Link to="/bulk-sender" className="action-card active-card">
          <h2>Bulk Sender</h2>
          <p>Send personalized emails in bulk</p>
        </Link>

        <div className="action-card disabled-card">
          <h2>N/A</h2>
          <p>Coming soon</p>
        </div>

        <div className="action-card disabled-card">
          <h2>N/A</h2>
          <p>Coming soon</p>
        </div>

        <div className="action-card disabled-card">
          <h2>N/A</h2>
          <p>Coming soon</p>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;