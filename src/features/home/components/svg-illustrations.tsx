export const GoalAchievementSVG = () => (
  <svg viewBox="0 0 400 300" className="h-auto w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Subtle background gradient circle */}
    <defs>
      <linearGradient id="targetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="100%" stopColor="#FDE68A" />
      </linearGradient>
      <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22C55E" />
        <stop offset="100%" stopColor="#16A34A" />
      </linearGradient>
    </defs>
    {/* Background circles with softer strokes */}
    <circle cx="200" cy="150" r="110" fill="url(#targetGradient)" stroke="#E5E7EB" strokeWidth="2" />
    <circle cx="200" cy="150" r="75" fill="url(#innerGradient)" stroke="#D97706" strokeWidth="2" />
    <circle cx="200" cy="150" r="40" fill="url(#centerGradient)" stroke="#15803D" strokeWidth="2" />
    {/* Target center */}
    <circle cx="200" cy="150" r="12" fill="#111827" />
    <circle cx="200" cy="150" r="4" fill="#fff" />
    {/* Arrow hitting target - cleaner design */}
    <path d="M300 70 L212 142" stroke="#374151" strokeWidth="3" strokeLinecap="round" />
    <path d="M212 142 L206 148 L218 138 Z" fill="#374151" />
    {/* Arrow tail feathers - subtle */}
    <path d="M300 70 L315 55" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" />
    <path d="M300 70 L318 72" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" />
    <path d="M300 70 L303 85" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" />
    {/* Subtle sparkles */}
    <circle cx="120" cy="100" r="4" fill="#FFD700" opacity="0.8" />
    <circle cx="280" cy="200" r="3" fill="#FFD700" opacity="0.8" />
    <circle cx="100" cy="180" r="2" fill="#3B82F6" opacity="0.6" />
    <circle cx="300" cy="120" r="2" fill="#EC4899" opacity="0.6" />
  </svg>
)

export const BeforeAfterSVG = ({ type }: { type: 'before' | 'after' }) => {
  if (type === 'before') {
    return (
      <svg viewBox="0 0 200 200" className="h-auto w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Stressed person - softer style */}
        <circle cx="100" cy="70" r="38" fill="#FEF3C7" stroke="#D1D5DB" strokeWidth="2" />
        {/* Stressed eyes */}
        <path
          d="M85 65 L90 70 L85 75"
          stroke="#6B7280"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M115 65 L110 70 L115 75"
          stroke="#6B7280"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Stressed eyebrows */}
        <path d="M78 55 L92 60" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
        <path d="M108 60 L122 55" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
        {/* Frown */}
        <path d="M85 88 Q100 80 115 88" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Sweat drops */}
        <ellipse cx="132" cy="62" rx="3" ry="5" fill="#93C5FD" />
        {/* Scattered papers/tasks - softer colors */}
        <rect
          x="30"
          y="130"
          width="28"
          height="22"
          fill="#FCA5A5"
          stroke="#DC2626"
          strokeWidth="1.5"
          rx="2"
          transform="rotate(-12 44 141)"
        />
        <rect
          x="72"
          y="138"
          width="28"
          height="22"
          fill="#FDBA74"
          stroke="#EA580C"
          strokeWidth="1.5"
          rx="2"
          transform="rotate(8 86 149)"
        />
        <rect
          x="114"
          y="132"
          width="28"
          height="22"
          fill="#C4B5FD"
          stroke="#7C3AED"
          strokeWidth="1.5"
          rx="2"
          transform="rotate(-4 128 143)"
        />
        <rect
          x="152"
          y="135"
          width="28"
          height="22"
          fill="#93C5FD"
          stroke="#2563EB"
          strokeWidth="1.5"
          rx="2"
          transform="rotate(10 166 146)"
        />
        {/* Question marks floating - subtler */}
        <text x="55" y="48" fontSize="14" fontWeight="600" fill="#EC4899" opacity="0.7">
          ?
        </text>
        <text x="138" y="44" fontSize="12" fontWeight="600" fill="#F97316" opacity="0.7">
          ?
        </text>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 200 200" className="h-auto w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Happy person - softer style */}
      <circle cx="100" cy="70" r="38" fill="#FEF3C7" stroke="#D1D5DB" strokeWidth="2" />
      {/* Happy eyes */}
      <circle cx="85" cy="65" r="4" fill="#374151" />
      <circle cx="115" cy="65" r="4" fill="#374151" />
      {/* Eye sparkle */}
      <circle cx="86.5" cy="63.5" r="1.5" fill="#FFF" />
      <circle cx="116.5" cy="63.5" r="1.5" fill="#FFF" />
      {/* Happy eyebrows */}
      <path d="M78 55 L90 53" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
      <path d="M110 53 L122 55" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
      {/* Smile */}
      <path d="M82 82 Q100 96 118 82" stroke="#374151" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Organized progress bars - modern rounded style */}
      <rect x="30" y="130" width="140" height="12" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1" rx="6" />
      <rect x="30" y="130" width="118" height="12" fill="#22C55E" rx="6" />
      <rect x="30" y="148" width="140" height="12" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1" rx="6" />
      <rect x="30" y="148" width="95" height="12" fill="#3B82F6" rx="6" />
      <rect x="30" y="166" width="140" height="12" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1" rx="6" />
      <rect x="30" y="166" width="140" height="12" fill="#F59E0B" rx="6" />
      {/* Check marks - cleaner */}
      <circle cx="180" cy="136" r="6" fill="#22C55E" />
      <path d="M177 136 L179 138 L183 134" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="180" cy="154" r="6" fill="#3B82F6" />
      <path d="M178 154 L182 150" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="180" cy="172" r="6" fill="#F59E0B" />
      <text x="177" y="175" fontSize="8" fill="#FFF">★</text>
      {/* Subtle sparkles */}
      <circle cx="52" cy="38" r="3" fill="#FFD700" opacity="0.8" />
      <circle cx="148" cy="42" r="2.5" fill="#FFD700" opacity="0.8" />
    </svg>
  )
}

export const FragmentedToolsSVG = () => (
  <svg viewBox="0 0 300 200" className="h-auto w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Scattered boxes representing different apps - modern rounded style */}
    <rect
      x="20"
      y="30"
      width="55"
      height="42"
      fill="#FCA5A5"
      stroke="#DC2626"
      strokeWidth="1.5"
      rx="6"
      transform="rotate(-5 47 51)"
    />
    <text x="32" y="56" fontSize="9" fontWeight="600" fill="#7F1D1D">
      Toggl
    </text>

    <rect
      x="100"
      y="22"
      width="55"
      height="42"
      fill="#C4B5FD"
      stroke="#7C3AED"
      strokeWidth="1.5"
      rx="6"
      transform="rotate(6 127 43)"
    />
    <text x="110" y="48" fontSize="9" fontWeight="600" fill="#4C1D95">
      Notion
    </text>

    <rect
      x="185"
      y="38"
      width="55"
      height="42"
      fill="#FDBA74"
      stroke="#EA580C"
      strokeWidth="1.5"
      rx="6"
      transform="rotate(-3 212 59)"
    />
    <text x="193" y="64" fontSize="9" fontWeight="600" fill="#7C2D12">
      Todoist
    </text>

    <rect
      x="55"
      y="100"
      width="55"
      height="42"
      fill="#93C5FD"
      stroke="#2563EB"
      strokeWidth="1.5"
      rx="6"
      transform="rotate(4 82 121)"
    />
    <text x="62" y="126" fontSize="9" fontWeight="600" fill="#1E3A8A">
      Calendar
    </text>

    <rect
      x="165"
      y="108"
      width="55"
      height="42"
      fill="#86EFAC"
      stroke="#16A34A"
      strokeWidth="1.5"
      rx="6"
      transform="rotate(-5 192 129)"
    />
    <text x="173" y="134" fontSize="9" fontWeight="600" fill="#14532D">
      Sheets
    </text>

    {/* Chaos lines - subtler */}
    <path d="M75 52 Q115 78 95 98" stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="4,4" />
    <path d="M155 44 Q195 88 158 130" stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="4,4" />
    <path d="M110 122 L162 130" stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="4,4" />

    {/* X mark - cleaner */}
    <circle cx="135" cy="85" r="14" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.5" />
    <path d="M130 80 L140 90 M140 80 L130 90" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const UnifiedSystemSVG = () => (
  <svg viewBox="0 0 300 220" className="h-auto w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hubGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    
    {/* Connection lines from center to each feature */}
    <line x1="150" y1="110" x2="150" y2="35" stroke="#E5E7EB" strokeWidth="2" />
    <line x1="150" y1="110" x2="55" y2="70" stroke="#E5E7EB" strokeWidth="2" />
    <line x1="150" y1="110" x2="245" y2="70" stroke="#E5E7EB" strokeWidth="2" />
    <line x1="150" y1="110" x2="70" y2="175" stroke="#E5E7EB" strokeWidth="2" />
    <line x1="150" y1="110" x2="230" y2="175" stroke="#E5E7EB" strokeWidth="2" />

    {/* Central hub */}
    <circle cx="150" cy="110" r="40" fill="url(#hubGrad)" stroke="#D97706" strokeWidth="2" />
    <text x="150" y="105" fontSize="11" fontWeight="700" fill="#78350F" textAnchor="middle">GOAL</text>
    <text x="150" y="120" fontSize="11" fontWeight="700" fill="#78350F" textAnchor="middle">SLOT</text>

    {/* 1. Goals - Top */}
    <circle cx="150" cy="28" r="22" fill="#DCFCE7" stroke="#22C55E" strokeWidth="2" />
    <text x="150" y="32" fontSize="9" fontWeight="600" fill="#166534" textAnchor="middle">Goals</text>

    {/* 2. Schedule - Top Left */}
    <circle cx="48" cy="65" r="22" fill="#FCE7F3" stroke="#EC4899" strokeWidth="2" />
    <text x="48" y="69" fontSize="9" fontWeight="600" fill="#9D174D" textAnchor="middle">Schedule</text>

    {/* 3. Time Tracking - Top Right */}
    <circle cx="252" cy="65" r="22" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="2" />
    <text x="252" y="62" fontSize="8" fontWeight="600" fill="#1E40AF" textAnchor="middle">Time</text>
    <text x="252" y="72" fontSize="8" fontWeight="600" fill="#1E40AF" textAnchor="middle">Tracking</text>

    {/* 4. Notes - Bottom Left */}
    <circle cx="65" cy="180" r="22" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
    <text x="65" y="184" fontSize="9" fontWeight="600" fill="#92400E" textAnchor="middle">Notes</text>

    {/* 5. Reports - Bottom Right */}
    <circle cx="235" cy="180" r="22" fill="#EDE9FE" stroke="#8B5CF6" strokeWidth="2" />
    <text x="235" y="184" fontSize="9" fontWeight="600" fill="#5B21B6" textAnchor="middle">Reports</text>

    {/* Small dots at connection points on hub */}
    <circle cx="150" cy="70" r="3" fill="#D97706" />
    <circle cx="115" cy="90" r="3" fill="#D97706" />
    <circle cx="185" cy="90" r="3" fill="#D97706" />
    <circle cx="120" cy="140" r="3" fill="#D97706" />
    <circle cx="180" cy="140" r="3" fill="#D97706" />
  </svg>
)
