interface TypographyProps {
  text: string
}

export function TypographyH1({ text }: TypographyProps) {
  return (
    <h1 className="scroll-m-20 text-base font-extrabold tracking-tight text-balance md:text-xl lg:text-2xl">
      {text}
    </h1>
  )
}
export function TypographyP({ text }: TypographyProps) {
  return (
    <p className="text-xs leading-7 text-pretty text-muted-foreground md:text-sm">
      {text}
    </p>
  )
}
