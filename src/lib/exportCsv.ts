/**
 * Exports data to a CSV file and triggers download
 */
export function exportToCsv<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns: { key: keyof T; header: string }[]
): void {
  if (data.length === 0) {
    return;
  }

  // Build header row
  const headers = columns.map((col) => `"${col.header}"`).join(";");

  // Build data rows
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = item[col.key];
        if (value === null || value === undefined) {
          return '""';
        }
        // Escape quotes and wrap in quotes
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      })
      .join(";")
  );

  // Combine header and rows
  const csvContent = [headers, ...rows].join("\n");

  // Add BOM for Excel compatibility with UTF-8
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
