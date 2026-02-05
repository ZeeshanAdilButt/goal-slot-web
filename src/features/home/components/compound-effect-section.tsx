import { AnimatedSection } from '@/components/animated-section'

export function CompoundEffectSection() {
  return (
    <section className="w-full border-b-2 border-secondary bg-white px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl text-center">
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="mb-4 font-display text-4xl font-black sm:text-5xl">
            The Compound Effect of Deep Work
          </h2>
          <p className="mb-12 text-lg text-gray-600">
            1 hour of tracked work daily leads to mastery over 10 months
          </p>

          {/* Graph Visualization */}
          <div className="relative mx-auto max-w-3xl">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-grid opacity-30"></div>

            {/* Chart Area */}
            <div className="relative rounded-sm border-2 border-secondary bg-white p-8 shadow-brutal">
              {/* Y-axis labels */}
              <div className="absolute left-2 top-8 flex flex-col justify-between text-right text-xs font-bold text-gray-400" style={{ height: '250px' }}>
                <span>300h</span>
                <span>200h</span>
                <span>100h</span>
                <span>0h</span>
              </div>

              {/* Chart Container */}
              <div className="ml-8 mt-4">
                {/* Exponential Growth Curve */}
                <svg viewBox="0 0 400 250" className="w-full" style={{ height: '250px' }}>
                  {/* Grid lines */}
                  <line x1="0" y1="250" x2="400" y2="250" stroke="#e5e7eb" strokeWidth="2" />
                  <line x1="0" y1="187.5" x2="400" y2="187.5" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
                  <line x1="0" y1="125" x2="400" y2="125" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
                  <line x1="0" y1="62.5" x2="400" y2="62.5" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />

                  {/* Growth Curve Path */}
                  <defs>
                    <filter id="shadow">
                      <feDropShadow dx="2" dy="2" stdDeviation="0" floodColor="#1c190d" />
                    </filter>
                  </defs>

                  {/* Fill under curve */}
                  <path
                    d="M 0 250 Q 50 240, 100 220 T 200 140 T 300 60 T 400 20 L 400 250 Z"
                    fill="#f2cc0d"
                    opacity="0.3"
                  />

                  {/* Main curve line */}
                  <path
                    d="M 0 250 Q 50 240, 100 220 T 200 140 T 300 60 T 400 20"
                    stroke="#f2cc0d"
                    strokeWidth="6"
                    fill="none"
                    filter="url(#shadow)"
                  />

                  {/* Data points */}
                  <circle cx="0" cy="250" r="6" fill="#1c190d" stroke="#f2cc0d" strokeWidth="3" />
                  <circle cx="100" cy="220" r="6" fill="#1c190d" stroke="#f2cc0d" strokeWidth="3" />
                  <circle cx="200" cy="140" r="6" fill="#1c190d" stroke="#f2cc0d" strokeWidth="3" />
                  <circle cx="300" cy="60" r="6" fill="#1c190d" stroke="#f2cc0d" strokeWidth="3" />
                  <circle cx="400" cy="20" r="8" fill="#f2cc0d" stroke="#1c190d" strokeWidth="3" />

                  {/* Mastery Zone Label - clean box style */}
                  <rect x="295" y="0" width="105" height="24" rx="2" fill="#1c190d" />
                  <text x="347" y="16" fontSize="11" fontWeight="bold" fill="#f2cc0d" textAnchor="middle">
                    MASTERY ZONE
                  </text>
                </svg>

                {/* X-axis labels */}
                <div className="mt-2 flex justify-between text-xs font-bold text-gray-400">
                  <span>Month 1</span>
                  <span>Month 3</span>
                  <span>Month 6</span>
                  <span>Month 9</span>
                  <span>Month 10</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Below Graph */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-sm border-2 border-secondary bg-background p-6 shadow-brutal-sm">
              <div className="mb-2 font-mono text-4xl font-black text-primary">1h</div>
              <p className="text-sm font-bold text-gray-600">Daily Commitment</p>
            </div>
            <div className="rounded-sm border-2 border-secondary bg-background p-6 shadow-brutal-sm">
              <div className="mb-2 font-mono text-4xl font-black text-primary">300h</div>
              <p className="text-sm font-bold text-gray-600">Total in 10 Months</p>
            </div>
            <div className="rounded-sm border-2 border-secondary bg-background p-6 shadow-brutal-sm">
              <div className="mb-2 font-mono text-4xl font-black text-primary">3%</div>
              <p className="text-sm font-bold text-gray-600">Who Actually Track</p>
            </div>
          </div>

          <p className="mt-12 font-display text-xl font-bold text-gray-700">
            "Small daily efforts compound into impossible outcomes. But only if you track them."
          </p>
        </AnimatedSection>
      </div>
    </section>
  )
}
