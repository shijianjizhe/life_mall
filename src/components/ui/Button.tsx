import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/format'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const variants: Record<Variant, string> = {
  primary:
    'brand-gradient text-white shadow-md shadow-brand-pink/25 hover:opacity-95',
  secondary: 'bg-white text-ink border border-line hover:bg-bg',
  ghost: 'bg-transparent text-ink hover:bg-black/5',
  danger: 'bg-danger text-white hover:opacity-95',
  outline:
    'bg-white text-brand-pink border-2 border-brand-pink/40 hover:border-brand-pink',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-xl',
  md: 'px-4 py-2.5 text-sm rounded-2xl',
  lg: 'px-5 py-3.5 text-base rounded-2xl font-semibold',
}

export function Button({
  variant = 'primary',
  children,
  className,
  fullWidth,
  size = 'md',
  disabled,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition active:scale-[0.96] disabled:opacity-45 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
