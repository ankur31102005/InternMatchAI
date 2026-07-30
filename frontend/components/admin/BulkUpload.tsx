"use client"

import { useState, useRef } from "react"
import * as XLSX from "xlsx"
import { motion } from "framer-motion"
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react"
import { apiFetch } from "@/services/api"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import {
  INTERNSHIP_FIELDS,
  coerceInternship,
} from "@/lib/internshipFields"
import { toast } from "@/store/toastStore"

interface ParsedRow {
  index: number
  payload: Record<string, unknown>
  errors: string[]
}

interface ImportResult {
  row: number
  title: string
  ok: boolean
  error?: string
}

export function BulkUpload() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<ImportResult[] | null>(null)

  const validRows = rows.filter((r) => r.errors.length === 0)
  const invalidRows = rows.filter((r) => r.errors.length > 0)

  const downloadTemplate = () => {
    const headers = INTERNSHIP_FIELDS.map((f) => f.key)
    const example = INTERNSHIP_FIELDS.reduce(
      (acc, f) => {
        acc[f.key] = f.example ?? ""
        return acc
      },
      {} as Record<string, unknown>
    )
    const ws = XLSX.utils.json_to_sheet([example], { header: headers })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Internships")
    XLSX.writeFile(wb, "internmatch_template.xlsx")
  }

  const parseFile = async (file: File) => {
    setResults(null)
    setFileName(file.name)
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { cellDates: true })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      })
      const parsed: ParsedRow[] = json.map((raw, i) => {
        const { payload, errors } = coerceInternship(raw)
        return { index: i + 2, payload, errors } // +2: header row + 1-based
      })
      setRows(parsed)
      if (parsed.length === 0) {
        toast.warning("Empty file", "No rows found in the first sheet.")
      }
    } catch {
      toast.error("Couldn't read file", "Please upload a valid .xlsx or .csv file.")
      setRows([])
      setFileName(null)
    }
  }

  const runImport = async () => {
    if (validRows.length === 0) return
    setImporting(true)
    setProgress(0)
    const out: ImportResult[] = []
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]
      const title = String(row.payload.title ?? "Untitled")
      try {
        await apiFetch("/internships/", { method: "POST", json: row.payload })
        out.push({ row: row.index, title, ok: true })
      } catch (err: any) {
        out.push({
          row: row.index,
          title,
          ok: false,
          error: err.message || "Failed",
        })
      }
      setProgress(Math.round(((i + 1) / validRows.length) * 100))
    }
    setResults(out)
    setImporting(false)
    const created = out.filter((r) => r.ok).length
    if (created > 0) toast.success(`${created} internships imported`)
    if (created < out.length)
      toast.error(`${out.length - created} rows failed`, "See the results below.")
  }

  const reset = () => {
    setRows([])
    setFileName(null)
    setResults(null)
    setProgress(0)
  }

  const previewKeys = ["title", "company", "sector", "location", "stipend_amount"]

  return (
    <div className="space-y-6">
      {/* Instructions + template */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-heading text-base font-semibold text-foreground">
              1. Download the template
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Fill in one internship per row. Only{" "}
              <span className="font-medium text-foreground">
                title, company, description
              </span>{" "}
              are required.
            </p>
          </div>
          <Button variant="outline" onClick={downloadTemplate} className="shrink-0">
            <Download className="h-4 w-4" /> Excel template
          </Button>
        </div>
      </div>

      {/* Upload */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h3 className="mb-4 font-heading text-base font-semibold text-foreground">
          2. Upload your file
        </h3>

        {!fileName ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && inputRef.current?.click()
            }
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const f = e.dataTransfer.files?.[0]
              if (f) parseFile(f)
            }}
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])}
            />
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
              <UploadCloud className="h-7 w-7" />
            </span>
            <p className="font-medium text-foreground">
              Drag &amp; drop your Excel / CSV file
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              or click to browse — .xlsx, .xls or .csv
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <FileSpreadsheet className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {rows.length} row{rows.length === 1 ? "" : "s"} · {validRows.length}{" "}
                  valid · {invalidRows.length} with issues
                </p>
              </div>
            </div>
            <button
              onClick={reset}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Preview + import */}
      {rows.length > 0 && !results && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-base font-semibold text-foreground">
              3. Review &amp; import
            </h3>
            <div className="flex gap-2">
              <Badge variant="success">{validRows.length} ready</Badge>
              {invalidRows.length > 0 && (
                <Badge variant="danger">{invalidRows.length} skipped</Badge>
              )}
            </div>
          </div>

          <div className="max-h-72 overflow-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  {previewKeys.map((k) => (
                    <th key={k} className="px-3 py-2">
                      {k.replace("_", " ")}
                    </th>
                  ))}
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.index} className={r.errors.length ? "bg-destructive/5" : ""}>
                    <td className="px-3 py-2 text-muted-foreground">{r.index}</td>
                    {previewKeys.map((k) => (
                      <td key={k} className="max-w-[160px] truncate px-3 py-2 text-foreground">
                        {String(r.payload[k] ?? "—")}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      {r.errors.length === 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-success">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-xs text-destructive"
                          title={r.errors.join(", ")}
                        >
                          <AlertTriangle className="h-3.5 w-3.5" /> {r.errors[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {importing ? (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Importing…
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <Button
              onClick={runImport}
              disabled={validRows.length === 0}
              className="mt-5"
            >
              Import {validRows.length} internship
              {validRows.length === 1 ? "" : "s"}
            </Button>
          )}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-base font-semibold text-foreground">
              Import complete
            </h3>
            <Button variant="outline" size="sm" onClick={reset}>
              Import another file
            </Button>
          </div>
          <div className="mb-4 flex gap-3">
            <Badge variant="success">
              {results.filter((r) => r.ok).length} created
            </Badge>
            <Badge variant="danger">
              {results.filter((r) => !r.ok).length} failed
            </Badge>
          </div>
          <div className="max-h-72 space-y-1.5 overflow-auto">
            {results.map((r) => (
              <motion.div
                key={r.row}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                {r.ok ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                )}
                <span className="text-muted-foreground">Row {r.row}:</span>
                <span className="truncate font-medium text-foreground">{r.title}</span>
                {!r.ok && r.error && (
                  <span className="ml-auto truncate text-xs text-destructive">
                    {r.error}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
