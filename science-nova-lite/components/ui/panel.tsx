import * as React from "react"

type PanelProps = React.HTMLAttributes<HTMLDivElement>

/**
 * Panel — lightweight shared wrapper for soft, readable surfaces over Vanta.
 * Subtle white scrim with blur and hairline border. Keep this tiny and generic.
 */
export function Panel({ className = "", children, ...rest }: PanelProps) {
  return (
    <div
      className={
  "rounded-3xl bg-white/60 backdrop-blur-md border border-white/20 shadow-[0_12px_32px_rgba(0,0,0,0.12)] " +
        className
      }
      {...rest}
    >
      {children}
    </div>
  )
}

export default Panel
