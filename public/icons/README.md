# GoalSlot.io Icons

All icon variations for the GoalSlot logo.

## Logo Files

| File | Description |
|------|-------------|
| `goalslot-logo.svg` | Default logo (black on transparent bg) |
| `goalslot-logo-black.svg` | Black logo on transparent bg |
| `goalslot-logo-white.svg` | White logo for dark backgrounds |
| `goalslot-logo-gold.svg` | Gold (#FFD700) logo on transparent bg |
| `goalslot-logo-gray.svg` | Gray (#9CA3AF) logo for disabled states |
| `goalslot-logo-original.svg` | Original source logo |

### Size Variations
| File | Size | Description |
|------|------|-------------|
| `goalslot-logo-16.svg` | 16x16 | Favicon size |
| `goalslot-logo-32.svg` | 32x32 | Small icon |
| `goalslot-logo-64.svg` | 64x64 | Optimized for small sizes |
| `goalslot-logo-128.svg` | 128x128 | Medium size optimization |
| `goalslot-logo-256.svg` | 256x256 | Large size optimization |

## Usage in React

Use the `GoalSlotLogo` component for consistent styling:

```tsx
import { GoalSlotLogo, GoalSlotBrand } from '@/components/goalslot-logo'

// Default logo
<GoalSlotLogo size="md" />

// White logo for dark backgrounds
<GoalSlotLogo size="md" variant="white" />

// Black logo for light backgrounds
<GoalSlotLogo size="md" variant="black" />

// Gold logo for accent areas
<GoalSlotLogo size="md" variant="gold" />

// Gray logo for disabled states
<GoalSlotLogo size="md" variant="gray" />

// Full brand (logo + name + tagline)
<GoalSlotBrand size="md" tagline="Your growth, measured." />

// Brand with white variant for dark backgrounds
<GoalSlotBrand size="md" variant="white" />

// Brand without tagline
<GoalSlotBrand size="sm" showTagline={false} />
```

### Size Options
- `xs` - 24px (extra small buttons)
- `sm` - 32px (compact headers)
- `md` - 40px (default)
- `lg` - 48px (large headers)
- `xl` - 56px (hero sections)

### Variant Options
- `default` - Standard logo (black on transparent)
- `white` - White logo for dark backgrounds
- `black` - Black logo for light backgrounds
- `gold` - Gold logo for special accents
- `gray` - Gray logo for disabled states

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Gold | `#FFD700` | Primary, backgrounds, CTAs |
| Black | `#000000` | Logo, text, borders |
| White | `#FFFFFF` | On dark backgrounds |
| Gray | `#9CA3AF` | Disabled states |
