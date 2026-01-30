import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

interface SimpleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

const SimpleDialog: React.FC<SimpleDialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Content */}
      <div className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-md">
        {children}
      </div>
    </div>
  )
}

const SimpleDialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { onClick?: () => void }
>(({ className, onClick, ...props }, ref) => (
  <button
    ref={ref}
    className={cn("", className)}
    onClick={onClick}
    {...props}
  />
))
SimpleDialogTrigger.displayName = "SimpleDialogTrigger"

const SimpleDialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative border bg-black border-gray-800 p-6 shadow-lg rounded-lg",
      className
    )}
    {...props}
  >
    <button
      className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
      onClick={() => {
        // Find parent dialog and close it
        const dialog = document.querySelector('[data-simple-dialog="true"]')
        if (dialog) {
          const event = new CustomEvent('closeDialog')
          dialog.dispatchEvent(event)
        }
      }}
    >
      <X className="h-4 w-4 text-gray-400" />
    </button>
    {children}
  </div>
))
SimpleDialogContent.displayName = "SimpleDialogContent"

const SimpleDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SimpleDialogHeader.displayName = "SimpleDialogHeader"

const SimpleDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-white",
      className
    )}
    {...props}
  />
))
SimpleDialogTitle.displayName = "SimpleDialogTitle"

export {
  SimpleDialog as Dialog,
  SimpleDialogTrigger as DialogTrigger,
  SimpleDialogContent as DialogContent,
  SimpleDialogHeader as DialogHeader,
  SimpleDialogTitle as DialogTitle,
}
