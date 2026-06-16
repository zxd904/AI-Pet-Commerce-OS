import { cn } from "../../lib/utils"

export function Button({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium transition-all duration-200",
        "bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500",
        "text-white hover:shadow-lg hover:shadow-accent-500/25",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white placeholder:text-gray-500",
        "focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20",
        className
      )}
      {...props}
    />
  )
}

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl glass-card p-6 transition-all duration-300 hover:border-white/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function Badge({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white",
        "focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20",
        "appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2394a3b8%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27/%3e%3c/svg%3e')] bg-no-repeat bg-[right_0.75rem_center]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}
