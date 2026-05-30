export interface RecipientRow {
    [key: string]: string;
}

export function fillStringTemplate(
  text: string,
  row: RecipientRow
) {
  let output = text;

  Object.entries(row).forEach(([key, value]) => {
    output = output
      .split(`[[${key}]]`)
      .join(value || "");
  });

  return output;
}

export function BuildAllEmails(
    html: string,
    subject: string, 
    rows: RecipientRow[]
) {
    return rows.map((row) => ({
        email: row.email,
        subject: fillStringTemplate(subject, row),
        body: fillStringTemplate(html, row)
    }))
}