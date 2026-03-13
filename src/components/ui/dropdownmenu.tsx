import * as React from "react"

import { cn } from "@/lib/utils"

export interface DropdownMenuProps {
  triggerText: string
  items: string[]
  className?: string
}

const DropdownMenu = ({ triggerText, items, className }: DropdownMenuProps) => {
  const [open, setOpen] = React.useState(false)

  return (
    <div className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
      >
        {triggerText}
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-20 mt-2 min-w-44 rounded-lg border bg-background p-1 shadow-xl">
          {items.map((item) => (
            <button
              key={item}
              type="button"
              className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export { DropdownMenu }