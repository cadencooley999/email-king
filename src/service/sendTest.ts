import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase_funcitons/auth"; // your firebase init

const functions = getFunctions(app, "us-central1");

interface SendEmailProps {
  accessToken: string;
  to: string;
  subject: string;
  body: string;
}

const sendTestEmail = httpsCallable(functions, "sendTestEmail");

export const sendTest = async (props: SendEmailProps) => {
  return await sendTestEmail({
    accessToken: props.accessToken,
    to: props.to,
    subject: props.subject,
    html: props.body,
  });
};