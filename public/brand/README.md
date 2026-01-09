# GoalSlot.io Brand Assets

Production-ready SVG brand assets for GoalSlot.io social media marketing.

## Brand Essence

**Tagline:** "Your growth, measured."

**What we stand for:**
- Proof over feeling
- Hours stacking toward mastery  
- Deliberate practice, tracked
- Progress you can actually see

## Icon Component

Use the React component for consistent branding across the app:

```tsx
import { GoalSlotLogo, GoalSlotBrand } from '@/components/goalslot-logo'

// Default logo
<GoalSlotLogo size="md" />

// White logo for dark backgrounds
<GoalSlotLogo size="md" variant="white" />

// Full brand with name and tagline
<GoalSlotBrand size="md" tagline="Your growth, measured." />

// Full brand with white variant for dark backgrounds
<GoalSlotBrand size="md" variant="white" tagline="Your growth, measured." />
```

## Files

### Profile Pictures
| File | Size | Use |
|------|------|-----|
| `goalslot-icon-square.svg` | 512×512 | Twitter/X, LinkedIn, general profiles |
| `goalslot-icon-circle.svg` | 512×512 | Instagram, TikTok, circular crops |
| `goalslot-favicon.svg` | 32×32 | Website favicon |

### Banners
| File | Size | Platform |
|------|------|----------|
| `goalslot-twitter-header.svg` | 1500×500 | Twitter/X header |
| `goalslot-linkedin-banner.svg` | 1584×396 | LinkedIn company page |
| `goalslot-youtube-banner.svg` | 2560×1440 | YouTube channel art |

### Posts & Sharing
| File | Size | Use |
|------|------|-----|
| `goalslot-instagram-post.svg` | 1080×1080 | Instagram/Facebook posts |
| `goalslot-instagram-story.svg` | 1080×1920 | Stories, Reels, TikTok |
| `goalslot-og-image.svg` | 1200×630 | Link previews (Open Graph) |

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Gold | `#FFD700` | Primary brand, accents, CTAs |
| Black | `#000000` | Icon, borders |
| Near Black | `#0A0A0A` | Headings |
| Dark Gray | `#444444` | Body text |
| Light Gray | `#666666` | Secondary text |
| Off White | `#FEFEFE` | Backgrounds |

## Typography

**Font Stack:** `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

- Headings: Weight 700, tight letter-spacing (-2 to -3)
- Body: Weight 500
- CTAs: Weight 600

## Messaging

### Primary
- **"Your growth, measured."**

### Supporting
- "Track hours. See progress. Level up."
- "Start Free"

## Converting to PNG

```bash
# Using Inkscape
inkscape goalslot-icon-square.svg -o goalslot-icon-square.png -w 512 -h 512

# Using ImageMagick
magick convert goalslot-icon-square.svg goalslot-icon-square.png
```

## Platform Quick Reference

| Platform | Profile | Banner |
|----------|---------|--------|
| Twitter/X | `goalslot-icon-square.svg` | `goalslot-twitter-header.svg` |
| LinkedIn | `goalslot-icon-square.svg` | `goalslot-linkedin-banner.svg` |
| YouTube | `goalslot-icon-square.svg` | `goalslot-youtube-banner.svg` |
| Instagram | `goalslot-icon-circle.svg` | N/A |
| Facebook | `goalslot-icon-square.svg` | `goalslot-twitter-header.svg` |
| Website | `goalslot-favicon.svg` | `goalslot-og-image.svg` |
