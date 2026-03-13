import * as React from "react"

import { cn } from "@/lib/utils"

export interface DialogProps {
  triggerText: string
  title: string
  description?: string
  confirmText?: string
  className?: string
}

const Dialog = ({ triggerText, title, description, confirmText, className }: DialogProps) => {
  const [open, setOpen] = React.useState(false)

  return (
    <div className={cn("w-full", className)}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
      >
        {triggerText}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border px-3 py-2 text-sm"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
              >
                {confirmText || "确认"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export { Dialog }