import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase_funcitons/auth"; // your firebase init
import { fillStringTemplate } from "../utilities/template_compiler";

const functions = getFunctions(app, "us-central1");

interface SendBulkProps {
    accessToken: string
    recipientRows: Record<string, string>[]
    bodyTemplate: string
    subjectTemplate: string
    setProgress: React.Dispatch<React.SetStateAction<BulkProgress>>
    cancelRef: React.MutableRefObject<boolean>
}

interface EmailResponse {
    success: boolean
}

export interface BulkProgress {
    sent: number,
    total: number,
    failed: number
}

const sendTestEmail = httpsCallable<any, EmailResponse>(functions, "sendTestEmail");

export const sendBulk = async (props: SendBulkProps) => {
    let totalSent = 0
    let totalFailed = 0
    for (const row of props.recipientRows) {
        if (props.cancelRef.current) {
            break
        }
        const body = fillStringTemplate(
            props.bodyTemplate,
            row
        )
        const subject = fillStringTemplate(
            props.subjectTemplate,
            row
        )
        const res = await sendTestEmail({
            accessToken: props.accessToken,
            to: row.email,
            subject,
            html: body,
        })
        if (res.data.success) {
            totalSent++
        }
        else {
            totalFailed++
        }
        props.setProgress({sent: totalSent, total: props.recipientRows.length, failed: totalFailed})
    }

};