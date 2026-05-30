import { useEffect } from "react";
import { type TemplateVariable } from "./template-editor";
import "../css/recipient-table.css"


interface RecipientTableProps {
    variables: TemplateVariable[]
    rows: Record<string, string>[]
    onRowsChange?: (rows: Record<string, string>[]) => void;
}

export default function RecipientTable({variables, rows, onRowsChange}: RecipientTableProps) {
    
    const createEmptyRow = () => {
        const row: Record<string, string> = {email: "", };
        variables.forEach((v) => {
            row[v.name] = ""
        })
        return row
    }

    useEffect(() => {
        if (rows.length === 0) {
            onRowsChange?.([createEmptyRow()])
        }
    }, [])

    const updateCell = (
        rowIndex: number,
        variableName: string,
        value: string
    ) => {
        const updated = [...rows]

        updated[rowIndex] = {
            ...updated[rowIndex],
            [variableName]: value
        }

        onRowsChange?.(updated)
    }

    const addRowAfter = (rowIndex: number) => {
        const updated = [...rows]

        updated.splice(rowIndex + 1, 0, createEmptyRow())

        onRowsChange?.(updated)
    }

    const removeRow = (rowIndex: number) => {
        if (rows.length <= 1) return

        onRowsChange?.(
            rows.filter((_, i) => i !== rowIndex)
        )
    }

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        rowIndex: number
    ) => {
        if (e.key == "Enter") {
            e.preventDefault()
            if (rowIndex == rows.length-1) {
                addRowAfter(rowIndex+1);
            }
        }
    }

    return (
        <div className="recipient-table-container">
            <div className="table-scroll">
                <table className="recipient-table">
                    <thead>
                        <tr>
                            <th>Email</th>

                            {variables.map((variable) => (
                                <th key={variable.id}>
                                    {variable.name}
                                </th>
                            ))}

                            <th className="add-column"></th>
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                <td>
                                    <input
                                        type="email"
                                        value={row.email || ""}
                                        placeholder="name@company.com"
                                        onChange={(e) => 
                                            updateCell(rowIndex, "email", e.target.value)
                                        }
                                        onKeyDown={(e) => handleKeyDown(e, rowIndex)}
                                    />
                                </td>
                                {variables.map((variable) => (
                                    <td key={variable.id}>
                                        <input type="text" value={row[variable.name]} placeholder={variable.name} onChange={(e) => {updateCell(rowIndex, variable.name, e.target.value)}} onKeyDown={(e) => {handleKeyDown(e, rowIndex)}}/>
                                    </td>
                                ))}
                                <td className="row-actions-cell">

                                    <div className="row-actions-wrapper">
                                        <button
                                        className="add-row-button"
                                        onClick={() => addRowAfter(rowIndex)}
                                        >
                                            +
                                        </button>

                                        <button
                                            className="remove-row-button"
                                            onClick={() => removeRow(rowIndex)}
                                        >
                                            −
                                        </button>
                                    </div>

                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}