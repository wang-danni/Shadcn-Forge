import { cn } from "@/lib/utils"

export interface TableProps {
  columns: string[]
  rows: string[][]
  className?: string
}

const Table = ({ columns, rows, className }: TableProps) => {
  return (
    <div className={cn("w-full overflow-hidden rounded-xl border", className)}>
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-medium text-foreground">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${row.join("-")}-${rowIndex}`} className="border-t">
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} className="px-4 py-3 text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { Table }