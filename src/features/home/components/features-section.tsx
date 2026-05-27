'use client'

import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-7xl space-y-24 px-4 sm:px-6 lg:px-8">
        {/* Feature 1 */}
        <div className="flex flex-col items-center gap-12 md:flex-row">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="order-2 w-full md:order-1 md:w-1/2"
          >
            <div className="flex aspect-video items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-6">
              <div className="grid w-full grid-cols-3 gap-2">
                <div className="rounded border border-l-2 border-transparent bg-gray-100 p-2 text-[10px] text-gray-500">
                  Generic Meeting
                </div>
                <div className="flex h-20 flex-col justify-between rounded border border-l-4 border-[#f2cc0d] bg-[#f2cc0d]/10 p-2 text-xs font-bold text-[#8a7307]">
                  <span>Deep Work: API</span>
                  <span className="w-max rounded bg-[#f2cc0d] px-1 text-[10px] text-gray-900">ACTIVE</span>
                </div>
                <div className="rounded bg-gray-100 p-2 text-[10px] text-gray-500">Gym</div>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="order-1 w-full md:order-2 md:w-1/2"
          >
            <h3 className="font-display text-3xl font-bold text-gray-900">Anti-Drift Mechanism</h3>
            <p className="mt-4 text-lg text-gray-600">
              Goals without schedules are wishes. Time tracking without goals is busywork. GoalSlot hard-links your
              calendar blocks to your goals. You can&apos;t start a timer without assigning it to a mission.
            </p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-center gap-3 text-gray-700">
                <CheckCircle className="h-5 w-5 text-[#f2cc0d]" />
                Forces deliberate action
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <CheckCircle className="h-5 w-5 text-[#f2cc0d]" />
                Reduces context switching cost
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Feature 2 */}
        <div className="flex flex-col items-center gap-12 md:flex-row">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="w-full md:w-1/2"
          >
            <h3 className="font-display text-3xl font-bold text-gray-900">Data as Accountability</h3>
            <p className="mt-4 text-lg text-gray-600">
              Don&apos;t rely on &ldquo;feeling productive.&rdquo; Get a receipt for your effort. See exactly how many
              hours you invested in &ldquo;Learn React&rdquo; vs &ldquo;Random YouTube.&rdquo;
            </p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-center gap-3 text-gray-700">
                <CheckCircle className="h-5 w-5 text-[#f2cc0d]" />
                Weekly heatmap visualization
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <CheckCircle className="h-5 w-5 text-[#f2cc0d]" />
                Export reports for clients or bosses
              </li>
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="w-full md:w-1/2"
          >
            <div className="flex aspect-video items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-6">
              <div className="w-full">
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500">Total Focus</div>
                    <div className="text-3xl font-bold text-gray-900">34h 12m</div>
                  </div>
                  <div className="text-sm font-bold text-[#8a7307]">+12% vs last week</div>
                </div>
                <div className="flex h-32 items-end gap-2">
                  {[40, 65, 85, 50, 75, 20, 10].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.6, delay: i * 0.07, ease: 'easeOut' }}
                      className={`flex-1 rounded-t transition-colors ${
                        i === 2 ? 'bg-[#f2cc0d] shadow-[0_0_15px_rgba(242,204,13,0.4)]' : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
