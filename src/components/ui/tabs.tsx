import * as React from "react"

import { cn } from "@/lib/utils"

export interface TabsProps {
  tabs: string[]
  defaultTab?: string
  content?: string
  className?: string
}

const Tabs = ({ tabs, defaultTab, content, className }: TabsProps) => {
  const initialTab = defaultTab && tabs.includes(defaultTab) ? defaultTab : tabs[0]
  const [activeTab, setActiveTab] = React.useState(initialTab)

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">{activeTab}</div>
        {content ? <p className="mt-2">{content}</p> : null}
      </div>
    </div>
  )
}

export { Tabs }