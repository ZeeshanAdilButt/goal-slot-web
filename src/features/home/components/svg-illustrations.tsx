export const GoalAchievementSVG = () => (
  <svg viewBox="0 0 400 300" className="h-auto w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background circles */}
    <circle cx="200" cy="150" r="120" fill="#FEF3C7" stroke="#000" strokeWidth="3" />
    <circle cx="200" cy="150" r="80" fill="#FFD700" stroke="#000" strokeWidth="3" />
    <circle cx="200" cy="150" r="40" fill="#22C55E" stroke="#000" strokeWidth="3" />
    {/* Target center */}
    <circle cx="200" cy="150" r="15" fill="#000" />
    {/* Arrow hitting target */}
    <path d="M320 50 L210 140" stroke="#000" strokeWidth="4" strokeLinecap="round" />
    <polygon points="205,145 220,130 215,155" fill="#000" />
    {/* Arrow tail feathers */}
    <path d="M320 50 L340 30 M320 50 L345 55 M320 50 L325 75" stroke="#EC4899" strokeWidth="3" strokeLinecap="round" />
    {/* Sparkles around target */}
    <path d="M100 100 L110 90 L120 100 L110 110 Z" fill="#FFD700" stroke="#000" strokeWidth="2" />
    <path d="M280 200 L290 190 L300 200 L290 210 Z" fill="#FFD700" stroke="#000" strokeWidth="2" />
    <path d="M150 220 L155 210 L160 220 L155 230 Z" fill="#3B82F6" stroke="#000" strokeWidth="2" />
  </svg>
)

export const BeforeAfterSVG = ({ type }: { type: 'before' | 'after' }) => {
  if (type === 'before') {
    return (
      <svg viewBox="0 0 200 200" className="h-auto w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Stressed person */}
        <circle cx="100" cy="70" r="40" fill="#FEF3C7" stroke="#000" strokeWidth="3" />
        {/* Stressed eyes */}
        <path
          d="M85 65 L90 70 L85 75"
          stroke="#000"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M115 65 L110 70 L115 75"
          stroke="#000"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Stressed eyebrows */}
        <path d="M78 55 L92 60" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        <path d="M108 60 L122 55" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        {/* Frown */}
        <path d="M85 90 Q100 82 115 90" stroke="#000" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Sweat drops */}
        <ellipse cx="135" cy="60" rx="4" ry="6" fill="#3B82F6" />
        <ellipse cx="140" cy="75" rx="3" ry="5" fill="#3B82F6" />
        {/* Scattered papers/tasks around */}
        <rect
          x="30"
          y="130"
          width="30"
          height="25"
          fill="#EF4444"
          stroke="#000"
          strokeWidth="2"
          transform="rotate(-15 45 142)"
        />
        <rect
          x="70"
          y="140"
          width="30"
          height="25"
          fill="#F97316"
          stroke="#000"
          strokeWidth="2"
          transform="rotate(10 85 152)"
        />
        <rect
          x="110"
          y="135"
          width="30"
          height="25"
          fill="#8B5CF6"
          stroke="#000"
          strokeWidth="2"
          transform="rotate(-5 125 147)"
        />
        <rect
          x="150"
          y="130"
          width="30"
          height="25"
          fill="#3B82F6"
          stroke="#000"
          strokeWidth="2"
          transform="rotate(12 165 142)"
        />
        {/* X marks */}
        <text x="40" y="148" fontSize="12" fontWeight="bold" fill="#FFF">
          ✗
        </text>
        <text x="80" y="158" fontSize="12" fontWeight="bold" fill="#FFF">
          ✗
        </text>
        <text x="120" y="153" fontSize="12" fontWeight="bold" fill="#FFF">
          ✗
        </text>
        {/* Question marks floating */}
        <text x="55" y="50" fontSize="16" fontWeight="bold" fill="#EC4899">
          ?
        </text>
        <text x="140" y="45" fontSize="14" fontWeight="bold" fill="#F97316">
          ?
        </text>
        <text x="45" y="100" fontSize="12" fontWeight="bold" fill="#8B5CF6">
          ?
        </text>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 200 200" className="h-auto w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Happy person */}
      <circle cx="100" cy="70" r="40" fill="#FEF3C7" stroke="#000" strokeWidth="3" />
      {/* Happy eyes */}
      <circle cx="85" cy="65" r="5" fill="#000" />
      <circle cx="115" cy="65" r="5" fill="#000" />
      {/* Eye sparkle */}
      <circle cx="87" cy="63" r="2" fill="#FFF" />
      <circle cx="117" cy="63" r="2" fill="#FFF" />
      {/* Happy eyebrows */}
      <path d="M78 55 L92 52" stroke="#000" strokeWidth="2" strokeLinecap="round" />
      <path d="M108 52 L122 55" stroke="#000" strokeWidth="2" strokeLinecap="round" />
      {/* Big smile */}
      <path d="M80 82 Q100 100 120 82" stroke="#000" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Organized progress bars */}
      <rect x="30" y="130" width="140" height="15" fill="#E5E5E5" stroke="#000" strokeWidth="2" />
      <rect x="30" y="130" width="120" height="15" fill="#22C55E" stroke="#000" strokeWidth="2" />
      <rect x="30" y="150" width="140" height="15" fill="#E5E5E5" stroke="#000" strokeWidth="2" />
      <rect x="30" y="150" width="95" height="15" fill="#3B82F6" stroke="#000" strokeWidth="2" />
      <rect x="30" y="170" width="140" height="15" fill="#E5E5E5" stroke="#000" strokeWidth="2" />
      <rect x="30" y="170" width="140" height="15" fill="#FFD700" stroke="#000" strokeWidth="2" />
      {/* Check marks */}
      <text x="175" y="143" fontSize="12" fontWeight="bold" fill="#22C55E">
        ✓
      </text>
      <text x="175" y="163" fontSize="12" fontWeight="bold" fill="#3B82F6">
        ↗
      </text>
      <text x="175" y="183" fontSize="12" fontWeight="bold" fill="#FFD700">
        ★
      </text>
      {/* Stars around head */}
      <path d="M50 40 L55 30 L60 40 L50 35 L60 35 Z" fill="#FFD700" stroke="#000" strokeWidth="1" />
      <path d="M140 35 L145 25 L150 35 L140 30 L150 30 Z" fill="#FFD700" stroke="#000" strokeWidth="1" />
      <path d="M155 70 L160 60 L165 70 L155 65 L165 65 Z" fill="#EC4899" stroke="#000" strokeWidth="1" />
    </svg>
  )
}

export const FragmentedToolsSVG = () => (
  <svg viewBox="0 0 300 200" className="h-auto w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Scattered boxes representing different apps */}
    <rect
      x="20"
      y="30"
      width="60"
      height="50"
      fill="#EF4444"
      stroke="#000"
      strokeWidth="3"
      transform="rotate(-5 50 55)"
    />
    <text x="35" y="60" fontSize="10" fontWeight="bold" fill="#FFF">
      Toggl
    </text>

    <rect
      x="100"
      y="20"
      width="60"
      height="50"
      fill="#8B5CF6"
      stroke="#000"
      strokeWidth="3"
      transform="rotate(8 130 45)"
    />
    <text x="110" y="50" fontSize="10" fontWeight="bold" fill="#FFF">
      Notion
    </text>

    <rect
      x="180"
      y="40"
      width="60"
      height="50"
      fill="#F97316"
      stroke="#000"
      strokeWidth="3"
      transform="rotate(-3 210 65)"
    />
    <text x="190" y="70" fontSize="10" fontWeight="bold" fill="#FFF">
      Todoist
    </text>

    <rect
      x="60"
      y="100"
      width="60"
      height="50"
      fill="#3B82F6"
      stroke="#000"
      strokeWidth="3"
      transform="rotate(5 90 125)"
    />
    <text x="68" y="130" fontSize="10" fontWeight="bold" fill="#FFF">
      Calendar
    </text>

    <rect
      x="160"
      y="110"
      width="60"
      height="50"
      fill="#22C55E"
      stroke="#000"
      strokeWidth="3"
      transform="rotate(-7 190 135)"
    />
    <text x="168" y="140" fontSize="10" fontWeight="bold" fill="#FFF">
      Sheets
    </text>

    {/* Chaos lines */}
    <path d="M80 55 Q120 80 100 95" stroke="#000" strokeWidth="2" strokeDasharray="4,4" />
    <path d="M160 45 Q200 90 160 135" stroke="#000" strokeWidth="2" strokeDasharray="4,4" />
    <path d="M90 125 L160 135" stroke="#000" strokeWidth="2" strokeDasharray="4,4" />

    {/* X marks for frustration */}
    <text x="130" y="90" fontSize="24" fontWeight="bold" fill="#EF4444">
      ✗
    </text>
  </svg>
)

export const UnifiedSystemSVG = () => (
  <svg viewBox="0 0 300 200" className="h-auto w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Connection lines - drawn first so they appear behind everything */}
    <line x1="75" y1="75" x2="50" y2="60" stroke="#000" strokeWidth="3" />
    <line x1="225" y1="75" x2="250" y2="60" stroke="#000" strokeWidth="3" />
    <line x1="75" y1="125" x2="50" y2="140" stroke="#000" strokeWidth="3" />
    <line x1="225" y1="125" x2="250" y2="140" stroke="#000" strokeWidth="3" />

    {/* Central unified box */}
    <rect x="75" y="50" width="150" height="100" fill="#FFD700" stroke="#000" strokeWidth="4" />
    <text x="150" y="95" fontSize="14" fontWeight="bold" fill="#000" textAnchor="middle">
      GOAL
    </text>
    <text x="150" y="115" fontSize="14" fontWeight="bold" fill="#000" textAnchor="middle">
      SLOT
    </text>

    {/* Connected feature circles with text centered */}
    <circle cx="50" cy="60" r="25" fill="#22C55E" stroke="#000" strokeWidth="3" />
    <text x="50" y="64" fontSize="8" fontWeight="bold" fill="#000" textAnchor="middle">
      Goals
    </text>

    <circle cx="250" cy="60" r="25" fill="#3B82F6" stroke="#000" strokeWidth="3" />
    <text x="250" y="64" fontSize="8" fontWeight="bold" fill="#FFF" textAnchor="middle">
      Time
    </text>

    <circle cx="50" cy="140" r="25" fill="#EC4899" stroke="#000" strokeWidth="3" />
    <text x="50" y="144" fontSize="8" fontWeight="bold" fill="#FFF" textAnchor="middle">
      Schedule
    </text>

    <circle cx="250" cy="140" r="25" fill="#8B5CF6" stroke="#000" strokeWidth="3" />
    <text x="250" y="144" fontSize="8" fontWeight="bold" fill="#FFF" textAnchor="middle">
      Reports
    </text>

    {/* Check mark */}
    <text x="150" y="180" fontSize="24" fontWeight="bold" fill="#22C55E" textAnchor="middle">
      ✓
    </text>
  </svg>
)
