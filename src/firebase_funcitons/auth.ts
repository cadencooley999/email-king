import { initializeApp } from "firebase/app"
import { getAuth, OAuthProvider} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDUcBmGmjMjaXmUN_Br9nvpWaUq616VspU",
  authDomain: "email-5612e.firebaseapp.com",
  projectId: "email-5612e",
  storageBucket: "email-5612e.firebasestorage.app",
  messagingSenderId: "793415678248",
  appId: "1:793415678248:web:3fd6958d935215060f381d"
};

export const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

export const microsoftProvider = new OAuthProvider("microsoft.com")

microsoftProvider.addScope("Mail.Send")
microsoftProvider.addScope("offline_access")
microsoftProvider.addScope("User.Read")

microsoftProvider.addScope("openid");
microsoftProvider.addScope("profile");
microsoftProvider.addScope("email");