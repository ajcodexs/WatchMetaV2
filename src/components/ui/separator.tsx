
import * as React from "react"
import { cn } from "cn"
import { Separator as SeparatorPrimitive } from "radix-ui"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0",
        orientation === "horizontal"
          ? "h-px w-full bg-gradient-to-r from-transparent via-border to-transparent"
          : "w-px self-stretch bg-gradient-to-b from-transparent via-border to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
