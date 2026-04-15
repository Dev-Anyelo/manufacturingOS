"use client"

import * as React from "react"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

function Command({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command"
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-lg border border-border/50 bg-popover text-popover-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <div className="flex items-center border-b border-border/50 px-2">
      <Input
        data-slot="command-input"
        className={cn(
          "h-9 w-full border-0 bg-transparent px-2 text-sm shadow-none ring-0 focus-visible:ring-0",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-list"
      className={cn("max-h-64 overflow-y-auto p-1", className)}
      {...props}
    />
  )
}

function CommandEmpty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-empty"
      className={cn("p-4 text-center text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CommandGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-group"
      className={cn("overflow-hidden p-1 text-foreground", className)}
      {...props}
    />
  )
}

function CommandItem({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="command-item"
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

export {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
}
