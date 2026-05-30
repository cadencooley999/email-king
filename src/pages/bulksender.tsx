import { useState, useRef } from "react";
import TemplateEditor, { type TemplateVariable } from "../components/template-editor";
import RecipientTable from "../components/recipient-table";
import {fillStringTemplate} from "../utilities/template_compiler"
import { sendTest } from "../service/sendTest"
import { sendBulk, type BulkProgress } from "../service/sendBulk"
import Papa from "papaparse";

import "../css/bulk-sender.css";

interface BulkSenderProps {
  userEmail: string
  accessToken: string
}

function BulkSender({userEmail, accessToken}: BulkSenderProps) {
  const [templateVariables, setTemplateVariables] = useState<TemplateVariable[]>([{id: 1, name: "name"}])
  const [templateSubject, setTemplateSubject] = useState("")
  const [templateBody, setTemplateBody] = useState("")
  const [recipientRows, setRecipientRows] = useState<Record<string, string>[]>([]);
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewSubject, setPreviewSubject] = useState("")
  const [clearSignal, setClearSignal] = useState(0)
  const [progress, setProgress] = useState<BulkProgress>({sent: 0, total: 0, failed: 0})
  const cancelRef = useRef(false)
  const [isSending, setIsSending] = useState(false)
  const [wasCancelled, setWasCancelled] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null);

  const completed = progress.sent + progress.failed;
  const percent = progress.total
    ? Math.round((completed / progress.total) * 100)
    : 0;

  const isComplete =
    progress.total > 0 &&
    completed === progress.total;

  const handleCSVUpload = (file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,

      complete: (results) => {
        const data = results.data;

        if (!data.length) return;

        // Normalize rows so email key ALWAYS becomes "email"
        const normalizedRows = data.map((row) => {
          const updated: Record<string, string> = {};

          Object.entries(row).forEach(([key, value]) => {
            const normalizedKey =
              key.toLowerCase().trim() === "email"
                ? "email"
                : key;

            updated[normalizedKey] = value;
          });

          return updated;
        });

        // Extract template variable headers (excluding email)
        const headers = Object.keys(normalizedRows[0]).filter(
          (v) => v !== "email"
        );

        const newVariables: TemplateVariable[] = headers.map(
          (header, index) => ({
            id: index + 1,
            name: header,
          })
        );

        setTemplateVariables(newVariables);

        // Store normalized rows
        setRecipientRows(normalizedRows);
      },
    });
  };

  const editRowKeys = (oldkey: string, newkey: string) => {
    recipientRows.map((row) => {
      row[newkey] = row[oldkey]
      delete row[oldkey]
    })
  }

  const clearTemplate = () => {
    setClearSignal(clearSignal + 1)
  }

  const previewFirstEmail = () => {
    setPreviewHtml(fillStringTemplate(templateBody, recipientRows[0]))
    setPreviewSubject(fillStringTemplate(templateSubject, recipientRows[0]))
  }

  return (
    <div className="bulk-sender-page">
        <div className="bulk-topbar">
          <div className="bulk-title-group">
            <h1>Bulk Sender</h1>
            <p>Create and send personalized email campaigns</p>
          </div>

          <div className="bulk-email-input">
            <label>Sender Email</label>
            {userEmail ?  <p>{userEmail}</p> : <p>No email authenticated</p>}
          </div>
        </div>

      <div className="bulk-content-width">

        {/* Top Bar */}

        {/* Editor Section */}
        <div className="bulk-editor-section">
          <div className="bulk-section-header">
            <h2>Template Editor</h2>
            <p>Write and format your email template for bulk sending.</p>
            <div className="bulk-actions">
              <button>Load Template</button>
              <button>Save Template</button>
              <button className="danger-button" 
                onClick={clearTemplate}
              >Clear Template</button>
            </div>
          </div>

          <TemplateEditor
            userEmail={userEmail}
            variables={templateVariables}
            clearSignal={clearSignal}
            onVariablesChange={(n) => {
                setTemplateVariables([...n])
                console.log(recipientRows)
              }
            }
            onVariableEdited={editRowKeys}
            onTemplateChange={(data) => {
              setTemplateBody(data.body)
              setTemplateSubject(data.subject)
            }}
          />
        </div>

        {/* Recipient Table Section */}

        <div className="bulk-recipient-section">
          <div className="recipient-table-header">
              <div>
                  <h2>Recipient Data</h2>
                  <p>Add recipient information for template variable replacement</p>
              </div>
          </div>

          <>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".csv" 
              style={{display: "none"}} 
              onChange={(e) => {
                  const file = e.target.files?.[0]

                  if (file) {
                    handleCSVUpload(file)
                  }

                  e.target.value = "";
              }}
            />

            <button
              className="csv-button"
              onClick={() => fileInputRef.current?.click()}
            >Load CSV</button>
          </>
          <RecipientTable variables={templateVariables} rows={recipientRows} onRowsChange={setRecipientRows} />
        </div>

        <div className="bulk-preview-section">
          <div className="bulk-section-header">
            <h2>Preview First Email</h2>
            <p>
              See how the first recipient will recieve the email.
            </p>

            <button
              className="preview-button"
              onClick={previewFirstEmail}
            >Preview</button>

            <div className="email-preview-card">
              <div className="preview-row">
                <span className="preview-label">
                  From
                </span>
                <span>{userEmail}</span>
              </div>

              <div className="preview-row">
                <span className="preview-label">
                  To
                </span>
                <span>
                  {recipientRows[0]?.email || "recipient@email.com"}
                </span>
              </div>

              <div className="preview-row">
                <span className="preview-label">Subject</span>
                <span>{previewSubject}</span>
              </div>

              <div className="preview-body">
                <div
                  dangerouslySetInnerHTML={{
                    __html: previewHtml,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bulk-send-section">

        <div className="bulk-section-header">
          <h2>Send Campaign</h2>

          <p>
            Preview your campaign, send a test email, or send personalized
            emails to all recipients.
          </p>
        </div>

        <div className="send-actions">

          <button className="send-test-button" onClick={() => sendTest({accessToken: accessToken, to: userEmail, subject: previewSubject, body: previewHtml})}>
            Send Test to:<code>  {userEmail}</code>
          </button>

          <button className="send-all-button" onClick={() => {setWasCancelled(false); cancelRef.current = false; setIsSending(true); sendBulk({accessToken: accessToken, recipientRows: recipientRows, setProgress: setProgress, subjectTemplate: templateSubject, bodyTemplate: templateBody, cancelRef: cancelRef})}}>
            Send All
          </button>

        </div>
          {isSending && (
            <div className="bulk-progress-container">

              <div className="bulk-progress-header">
                <span>
                  {isComplete
                    ? `Completed • ${progress.sent} sent • ${progress.failed} failed`
                    : `Sending emails... ${completed} / ${progress.total}`
                  }
                </span>

                {!isComplete && (
                  <button
                    className="cancel-send-button"
                    onClick={() => {
                      cancelRef.current = true;
                      setWasCancelled(true)
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="bulk-progress-bar">
                <div
                  className="bulk-progress-fill"
                  style={{
                    width: `${percent}%`
                  }}
                />
              </div>

              <div className="bulk-progress-footer">
                <span>
                  {progress.sent} sent • {progress.failed} failed
                </span>

                <span>{percent}%</span>
              </div>

              {isComplete && (
                <div className="bulk-complete-message">
                  ✓ Bulk send completed successfully
                </div>
              )}

              {(wasCancelled === true) && (
                <div className="bulk-cancelled-message">
                  Bulk send cancelled.
                </div>
              )}

            </div>
          )}
      </div>

      </div>
    </div>
  );
}

export default BulkSender;