"use client"

import * as React from "react"
import { DayPicker, type DayPickerProps } from "react-day-picker"

import { cn } from "@/lib/utils"

type CalendarProps = DayPickerProps

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)}
      classNames={{
        root: "w-fit",
        months: "flex flex-col sm:flex-row gap-3",
        month: "space-y-3",
        month_caption: "flex h-8 items-center justify-center relative",
        caption_label: "text-sm font-medium",
        nav: "absolute inset-y-0 flex w-full items-center justify-between",
        button_previous:
          "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        button_next:
          "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "w-8 text-[0.72rem] font-medium text-muted-foreground text-center",
        week: "mt-1 flex w-full",
        day: "h-8 w-8 p-0 text-center text-sm",
        day_button:
          "h-8 w-8 rounded-md p-0 font-normal aria-selected:opacity-100 transition-colors hover:bg-muted",
        selected:
          "bg-brand text-brand-foreground hover:bg-brand/90 hover:text-brand-foreground",
        today: "bg-muted text-foreground",
        outside: "text-muted-foreground/60",
        disabled: "text-muted-foreground/50 opacity-50",
        range_start:
          "rounded-l-md bg-brand text-brand-foreground hover:bg-brand/90 hover:text-brand-foreground",
        range_middle: "rounded-none bg-brand-muted text-foreground",
        range_end:
          "rounded-r-md bg-brand text-brand-foreground hover:bg-brand/90 hover:text-brand-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}

export { Calendar }
