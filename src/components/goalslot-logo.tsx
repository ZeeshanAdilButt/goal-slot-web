import Image from 'next/image'
import { cn } from '@/lib/utils'

interface GoalSlotLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  variant?: 'default' | 'boxed' | 'icon' | 'white' | 'black' | 'gold' | 'gray'
  className?: string
}

const sizeClasses = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-14 w-14',
  '2xl': 'h-20 w-20',
  '3xl': 'h-32 w-32',
}

const sizePx = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
  '2xl': 80,
  '3xl': 128,
}

// Map variants to their respective SVG files
const logoVariants = {
  default: '/icons/goalslot-logo-boxed.svg',
  boxed: '/icons/goalslot-logo-boxed.svg',
  icon: '/icons/goalslot-icon.svg',
  white: '/icons/goalslot-logo-white.svg',
  black: '/icons/goalslot-logo-black.svg',
  gold: '/icons/goalslot-logo-gold.svg',
  gray: '/icons/goalslot-logo-gray.svg',
}

/**
 * GoalSlot Logo Component - The official GoalSlot logo
 * Use this component everywhere the logo/icon is needed for consistency
 * 
 * Variants:
 * - default/boxed: Logo with yellow background and black border (main branding)
 * - icon: Icon only without box/border (for loading spinners)
 * - white: White logo for dark backgrounds
 * - black: Black logo for light backgrounds
 * - gold: Gold logo for special accents
 * - gray: Gray logo for disabled states
 */
export function GoalSlotLogo({ size = 'md', variant = 'default', className }: GoalSlotLogoProps) {
  const logoSrc = logoVariants[variant]
  const pixelSize = sizePx[size]

  return (
    <div className={cn('relative shrink-0', sizeClasses[size], className)}>
      <Image
        src={logoSrc}
        alt="GoalSlot Logo"
        width={pixelSize}
        height={pixelSize}
        className="h-full w-full object-contain"
        priority
      />
    </div>
  )
}

/**
 * GoalSlot Loading Spinner - Uses the icon variant with Y-axis rotation
 * Perfect for loading states throughout the app
 */
interface GoalSlotSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  className?: string
}

export function GoalSlotSpinner({ size = 'md', className }: GoalSlotSpinnerProps) {
  const pixelSize = sizePx[size]

  return (
    <div 
      className={cn(
        'relative shrink-0 animate-flip-y',
        sizeClasses[size], 
        className
      )}
      style={{ perspective: '1000px' }}
    >
      <Image
        src="/icons/goalslot-icon.svg"
        alt="Loading..."
        width={pixelSize}
        height={pixelSize}
        className="h-full w-full object-contain"
        priority
      />
    </div>
  )
}

interface GoalSlotBrandProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'white' | 'dark'
  showTagline?: boolean
  tagline?: string
  className?: string
}

const brandSizeClasses = {
  sm: {
    container: 'gap-2',
    logo: 'sm' as const,
    title: 'text-lg',
    tagline: 'text-[10px]',
  },
  md: {
    container: 'gap-3',
    logo: 'lg' as const,
    title: 'text-xl',
    tagline: 'text-xs',
  },
  lg: {
    container: 'gap-3',
    logo: 'xl' as const,
    title: 'text-2xl',
    tagline: 'text-xs',
  },
}

// Text color classes based on variant for proper contrast
const brandTextVariants = {
  default: {
    title: '',
    tagline: 'text-gray-600',
    logoVariant: 'boxed' as const,
  },
  white: {
    title: 'text-white',
    tagline: 'text-gray-300',
    logoVariant: 'white' as const,
  },
  dark: {
    title: 'text-black',
    tagline: 'text-gray-600',
    logoVariant: 'boxed' as const,
  },
}

/**
 * GoalSlot Brand Component - Logo + Name + Tagline
 * Use this for headers, navigation, and branding areas
 * 
 * Variants:
 * - default: Boxed logo with standard colors for light backgrounds
 * - white: White logo and text for dark backgrounds
 * - dark: Boxed logo with dark text for light backgrounds
 */
export function GoalSlotBrand({
  size = 'md',
  variant = 'default',
  showTagline = true,
  tagline = 'Your growth, measured.',
  className,
}: GoalSlotBrandProps) {
  const sizes = brandSizeClasses[size]
  const textStyles = brandTextVariants[variant]

  return (
    <div className={cn('flex items-center', sizes.container, className)}>
      <GoalSlotLogo size={sizes.logo} variant={textStyles.logoVariant} />
      <div className="leading-tight">
        <span className={cn('font-display font-bold uppercase tracking-tight', sizes.title, textStyles.title)}>GoalSlot</span>
        {showTagline && (
          <span className={cn('block font-sans', sizes.tagline, textStyles.tagline)}>{tagline}</span>
        )}
      </div>
    </div>
  )
}
