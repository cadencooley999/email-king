import React, { useRef, useState, useCallback, useEffect } from 'react';
import '../css/template-editor.css';

export interface TemplateVariable { id: number; name: string; }

interface TemplateEditorProps {
  userEmail: string;
  variables: TemplateVariable[]
  clearSignal?: number,
  onVariablesChange?: (variables: TemplateVariable[]) => void;
  onTemplateChange?: (data: { subject: string; body: string }) => void;
  onVariableEdited?: (oldkey: string, newkey: string) => void;
}

const FONTS = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New'];
const SIZES = ['1', '2', '3', '4', '5', '6', '7'];

// ── Selection save/restore (module-level so toolbar clicks don't lose it) ─────

let _savedRange: Range | null = null;

function saveRange() {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) _savedRange = sel.getRangeAt(0).cloneRange();
}
function restoreRange() {
  if (!_savedRange) return;
  try {
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(_savedRange);
  } catch { /* ignore stale range */ }
}

// ── Strip an inline style property from an element; remove attr if empty ─────
function stripProp(el: HTMLElement, prop: string) {
  (el.style as unknown as Record<string, string>)[prop] = '';
  if (!el.style.cssText.trim()) el.removeAttribute('style');
}

// ── Clear a style property in the selection AND reset the caret pending format.
// Handles both a text selection (strips existing spans) and a collapsed caret
// (resets what the browser will apply to the next typed characters). ──────────
function clearTextColor(editor: HTMLElement) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);

  if (!range.collapsed) {
    const frag = range.extractContents();
    const clean = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        stripProp(node as HTMLElement, 'color');
        node.childNodes.forEach(clean);
      }
    };
    frag.childNodes.forEach(clean);
    range.insertNode(frag);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  editor.focus();
  document.execCommand('styleWithCSS', false, 'true');
  document.execCommand('foreColor', false, 'windowtext');
}

function clearHighlight(editor: HTMLElement) {
  const sel = window.getSelection();

  if (!sel || sel.rangeCount === 0) return;

  restoreRange();
  editor.focus();

  // Only remove highlight from SELECTED text
  document.execCommand('styleWithCSS', false, 'true');
  document.execCommand('hiliteColor', false, 'transparent');
}
 
// ─────────────────────────────────────────────────────────────────────────────

export default function TemplateEditor({ userEmail, variables, clearSignal, onVariablesChange, onTemplateChange, onVariableEdited}: TemplateEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editMode, setEditMode] = useState<boolean>(false)
  const [editTarget, setEditTarget] = useState<TemplateVariable>()
  const [subject, setSubject] = useState('');
  const [newVariable, setNewVariable] = useState('');
  const [isSubjectFocused, setIsSubjectFocused] = useState(false);
  const [subjectCursorPos, setSubjectCursorPos] = useState(0);


  useEffect(() => {
    onVariablesChange?.([{id: 1, name: "name"}])
  }, [])

  useEffect(() => {

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubject("")

    if (editorRef.current) {
      editorRef.current.innerHTML = ""
    }

    onTemplateChange?.({
      subject: "",
      body: ""
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearSignal])

  const notify = useCallback(() => {
    if (onTemplateChange && editorRef.current)
      onTemplateChange({ subject, body: editorRef.current.innerHTML });
  }, [onTemplateChange, subject]);

  // Prevent toolbar from stealing focus; save selection first
  const tbDown = (e: React.MouseEvent) => { e.preventDefault(); saveRange(); };

  // Run an execCommand after restoring the saved selection
  function exec(command: string, value?: string) {
    restoreRange();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    notify();
  }

  // Insert plain text at the caret using execCommand (keeps undo history intact)
  const insertVariable = useCallback((name: string) => {
    const varString = ` [[${name}]]`

    console.log(isSubjectFocused)

    if (isSubjectFocused) {

        const newSubject = 
        subject.substring(0, subjectCursorPos) + 
        varString + 
        subject.substring(subjectCursorPos);
        
        setSubject(newSubject);
        
        // Move cursor right after the newly inserted variable string
        const newPos = subjectCursorPos + varString.length;
        setSubjectCursorPos(newPos);

        // Keep focus in the input box and place the caret back down
        const inputEl = document.querySelector('.subject-input') as HTMLInputElement;
        if (inputEl) {
        inputEl.focus();
        setTimeout(() => {
            inputEl.setSelectionRange(newPos, newPos);
        }, 0);
        }

        if (onTemplateChange && editorRef.current) {
        onTemplateChange({ subject: newSubject, body: editorRef.current.innerHTML });
        }
    } else { 
        const editor = editorRef.current;
        if (!editor) return;
        restoreRange(); // restore the selection saved on mousedown
        editor.focus();
        document.execCommand('insertText', false, `[[${name}]]`);
        notify();
    }

  }, [notify, subject, isSubjectFocused, subjectCursorPos]);

    // Tab key inside editor: insert 4 spaces instead of tabbing away
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '    ');
            return;
        }
    };

  function replaceVariableInHtml(
    html: string,
    oldName: string,
    newName: string
  ) {
    const oldToken = `[[${oldName}]]`;
    const newToken = `[[${newName}]]`;

    return html.split(oldToken).join(newToken);
  }

  const addVariable = () => {
    if (!newVariable.trim()) return;
    const updated = [...variables, { id: Date.now(), name: newVariable.trim() }];
    onVariablesChange?.(updated);
    setNewVariable('');
  };

  const removeVariable = (id: number) => {
    const updated = variables.filter(v => v.id !== id);
    onVariablesChange?.(updated);
  };

  const editVariable = () => {
    const updated = variables.map((v) => {
      if (v.id == editTarget?.id) {
       return {
        ...v,
        name: newVariable
       }
      }
      return v
    })
    onVariablesChange?.(updated);
    if (editTarget) {
       onVariableEdited?.(editTarget.name, newVariable)
    }
    if (editorRef.current && editTarget) {
      editorRef.current.innerHTML = replaceVariableInHtml(
        editorRef.current.innerHTML,
        editTarget.name,
        newVariable,
      );
    }
    setNewVariable('')
    setEditMode(false)
  }

  return (
    <div className="template-editor-container">
      <div className="editor-main">

        <div className="sender-info">
          <label>From</label>
          <div className="email-display">{userEmail}</div>
        </div>

        <div className="subject-section">
          <label>Subject</label>
          <input
            type="text"
            value={subject}
            onFocus={() => setIsSubjectFocused(true)}
            onBlur={() => {setTimeout(() => setIsSubjectFocused(false), 150)}}
            onSelect={e => {
                const input = e.target as HTMLInputElement
                setSubjectCursorPos(input.selectionStart || 0)
            }}
            onChange={e => {
              setSubject(e.target.value);
              if (onTemplateChange && editorRef.current)
                onTemplateChange({ subject: e.target.value, body: editorRef.current.innerHTML });
            }}
            className="subject-input"
          />
        </div>

        <div className="toolbar">
          <select defaultValue="" onChange={e => { saveRange();
              exec('fontName', e.target.value)}
          }>
            <option value="" disabled>Font</option>
            {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
          </select>

          <select defaultValue="" onChange={e => {saveRange(); 
           exec('fontSize', e.target.value)
          }}>
            <option value="" disabled>Size</option>
            {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Text color + clear */}
          <div className="color-tool-group">
            <label className="color-picker-label" title="Text Color" onMouseDown={tbDown}>
              A
              <input type="color" defaultValue="#000000"
                onChange={e => exec('foreColor', e.target.value)} />
            </label>
            <button className="clear-color-btn" title="Remove text color"
              onMouseDown={tbDown}
              onClick={() => { restoreRange(); clearTextColor(editorRef.current!); notify(); }}>
              ✕
            </button>
          </div>

          {/* Highlight + clear */}
          <div className="color-tool-group">
            <label className="color-picker-label highlight-label" title="Highlight" onMouseDown={tbDown}>
              🖍
              <input type="color" defaultValue="#ffff00"
                onChange={e => {
                    restoreRange();

                    const sel = window.getSelection();
                    if (!sel || sel.rangeCount === 0) return;

                    const range = sel.getRangeAt(0);
                    if (range.collapsed) return;

                    // 1. Apply the highlight style using CSS spans
                    document.execCommand('styleWithCSS', false, 'true');
                    document.execCommand('hiliteColor', false, e.target.value);

                    // 2. Clear the current selection highlight so the user can see where the cursor is going
                    const rawRange = sel.getRangeAt(0);
                    const endContainer = rawRange.endContainer;
                    const endOffset = rawRange.endOffset;

                    // 3. Precise DOM manipulation to force a breakout point right where the selection ends
                    setTimeout(() => {
                        editorRef.current?.focus();
                        
                        const finalSel = window.getSelection();
                        if (!finalSel) return;

                        const breakoutRange = document.createRange();
                        
                        // Create an explicit unstyled text node anchor containing an invisible zero-width space
                        const textSpacingNode = document.createTextNode('\u200B');

                        if (endContainer.nodeType === Node.TEXT_NODE) {
                        // If selection ended inside a text node, split it or place spacing immediately after
                        const parent = endContainer.parentNode;
                        if (parent) {
                            if (endOffset === endContainer.textContent?.length) {
                            // If at the very end of the text node, insert spacing after its styled parent element
                            parent.parentNode?.insertBefore(textSpacingNode, parent.nextSibling);
                            } else {
                            // If in the middle, insert spacing right in place
                            endContainer.parentNode.insertBefore(textSpacingNode, endContainer.nextSibling);
                            }
                        }
                        } else {
                        // If selection ended on an element boundary, insert the spacing node at that exact child offset
                        endContainer.insertBefore(textSpacingNode, endContainer.childNodes[endOffset] || null);
                        }

                        // Move the caret perfectly into our clean spacing node, right after the invisible space
                        breakoutRange.setStart(textSpacingNode, 1);
                        breakoutRange.collapse(true);

                        finalSel.removeAllRanges();
                        finalSel.addRange(breakoutRange);

                        // Save this clean range position so toolbar sub-actions don't corrupt it
                        saveRange();
                        notify();
                    }, 0);
                    }} />
            </label>
            <button className="clear-color-btn" title="Remove highlight"
              onMouseDown={tbDown}
              onClick={() => { restoreRange(); clearHighlight(editorRef.current!); notify(); }}>
              ✕
            </button>
          </div>

          <button onMouseDown={tbDown} onClick={() => exec('bold')}><strong>B</strong></button>
          <button onMouseDown={tbDown} onClick={() => exec('italic')}><em>I</em></button>
          <button onMouseDown={tbDown} onClick={() => exec('underline')}><u>U</u></button>
          <button onMouseDown={tbDown} onClick={() => exec('justifyLeft')}>Left</button>
          <button onMouseDown={tbDown} onClick={() => exec('justifyCenter')}>Center</button>
          <button onMouseDown={tbDown} onClick={() => exec('justifyRight')}>Right</button>
          <button onMouseDown={tbDown} onClick={() => exec('insertUnorderedList')}>• List</button>
        </div>

        <div
          ref={editorRef}
          className="editor-body"
          contentEditable
          suppressContentEditableWarning
          onFocus={() => {
            console.log("SETTING FALSe")
            setIsSubjectFocused(false)}
          }
          onSelect={() => setIsSubjectFocused(false)}
          onInput={notify}
          onKeyDown={handleKeyDown}
          onMouseUp={saveRange}
          onKeyUp={saveRange}
        />
      </div>

      <div className="variables-panel">
        <h2>Template Variables</h2>
        <p className="variables-description">
          Click a variable to insert it at your cursor, or type it directly using
          double brackets — e.g. <code>[[first_name]]</code>. Variables are replaced
          with real values when the email is sent.
        </p>

        <div className="variable-input-row">
          <input type="text" value={newVariable} placeholder="Add variable..."
            onChange={e => setNewVariable(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addVariable(); }} />
          {editMode ? <button onClick={editVariable}>Confirm</button> : <button onClick={addVariable}>Add</button>}
        </div>

        <div className="variable-list">
          {variables.map(v => (
            <div key={v.id} className="variable-item">
              <button className="variable-button"
                onMouseDown={tbDown}
                onClick={() => insertVariable(v.name)}>
                {`[[${v.name}]]`}
              </button>
              <button className="delete-button" onClick={() => removeVariable(v.id)}>✕</button>
              {!editMode ? <button className="edit-button" onClick={() => {
                  setEditMode(true)
                  setEditTarget(v)
                  setNewVariable(v.name)
                  console.log(newVariable)
                }
              }>edit</button> : <button className="edit-button" onClick={() => {
                  setEditMode(false)
                  setEditTarget(undefined)
                  setNewVariable("")
                }
              }>cancel</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}