import { toast } from "sonner";

export function exportToCsv(data: Record<string, any>[], filename: string) {
  if (!data || data.length === 0) {
    toast.error("Aucune donnée à exporter");
    return;
  }

  try {
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(";"),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return "";
          if (typeof value === "string" && (value.includes(";") || value.includes("\n") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        }).join(";")
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Export CSV réussi");
  } catch (error) {
    toast.error("Erreur lors de l'export");
    console.error("Export error:", error);
  }
}

export function exportToJson(data: Record<string, any>[], filename: string) {
  if (!data || data.length === 0) {
    toast.error("Aucune donnée à exporter");
    return;
  }

  try {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Export JSON réussi");
  } catch (error) {
    toast.error("Erreur lors de l'export");
    console.error("Export error:", error);
  }
}
