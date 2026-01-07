import Link from 'next/link'
import { CheckCircle, XCircle } from 'lucide-react'
import { AnimatedSection } from '@/components/animated-section'

const comparisonData = [
  { feature: 'Goal Tracking', tm: true, toggl: false, notion: 'manual', todoist: false },
  { feature: 'Time Tracking', tm: true, toggl: true, notion: false, todoist: false },
  { feature: 'Weekly Schedule', tm: true, toggl: false, notion: 'manual', todoist: false },
  { feature: 'Tasks & To-Dos', tm: true, toggl: false, notion: true, todoist: true },
  { feature: 'Notion-Like Notes', tm: true, toggl: false, notion: true, todoist: false },
  { feature: 'Progress Analytics', tm: true, toggl: true, notion: false, todoist: 'basic' },
  { feature: 'Goals ↔ Time Linked', tm: true, toggl: false, notion: false, todoist: false },
  { feature: 'Share with Mentor', tm: true, toggl: 'team only', notion: true, todoist: false },
  { feature: 'Built for Developers', tm: true, toggl: false, notion: false, todoist: false },
]

export function ComparisonSection() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 font-display text-4xl font-bold uppercase md:text-5xl">Why GoalSlot?</h2>
          <p className="font-mono text-xl text-gray-600">See how we compare to the tools you're already paying for</p>
        </AnimatedSection>

        <div className="overflow-x-auto">
          <table className="w-full border-3 border-secondary">
            <thead>
              <tr className="bg-secondary text-white">
                <th className="p-4 text-left font-display text-sm uppercase">Feature</th>
                <th className="p-4 text-center font-display text-sm uppercase">
                  <span className="text-primary">GoalSlot</span>
                  <span className="block font-mono text-xs text-gray-300">$7/mo</span>
                </th>
                <th className="p-4 text-center font-display text-sm uppercase">
                  Toggl
                  <span className="block font-mono text-xs text-gray-300">$10/mo</span>
                </th>
                <th className="p-4 text-center font-display text-sm uppercase">
                  Notion
                  <span className="block font-mono text-xs text-gray-300">$10/mo</span>
                </th>
                <th className="p-4 text-center font-display text-sm uppercase">
                  Todoist
                  <span className="block font-mono text-xs text-gray-300">$5/mo</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {comparisonData.map((row, i) => (
                <tr key={i} className="border-t-2 border-gray-200">
                  <td className="p-4 font-mono text-sm font-bold">{row.feature}</td>
                  <td className="p-4 text-center">
                    {row.tm === true ? (
                      <CheckCircle className="mx-auto h-6 w-6 text-accent-green" />
                    ) : (
                      <span className="font-mono text-sm text-gray-400">{row.tm}</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.toggl === true ? (
                      <CheckCircle className="mx-auto h-6 w-6 text-gray-400" />
                    ) : row.toggl === false ? (
                      <XCircle className="mx-auto h-6 w-6 text-red-300" />
                    ) : (
                      <span className="font-mono text-xs text-gray-400">{row.toggl}</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.notion === true ? (
                      <CheckCircle className="mx-auto h-6 w-6 text-gray-400" />
                    ) : row.notion === false ? (
                      <XCircle className="mx-auto h-6 w-6 text-red-300" />
                    ) : (
                      <span className="font-mono text-xs text-gray-400">{row.notion}</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {row.todoist === true ? (
                      <CheckCircle className="mx-auto h-6 w-6 text-gray-400" />
                    ) : row.todoist === false ? (
                      <XCircle className="mx-auto h-6 w-6 text-red-300" />
                    ) : (
                      <span className="font-mono text-xs text-gray-400">{row.todoist}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-3 border-secondary bg-primary/10">
                <td className="p-4 font-display font-bold uppercase">Total Cost</td>
                <td className="p-4 text-center font-mono text-xl font-bold text-accent-green">$7/mo</td>
                <td colSpan={3} className="p-4 text-center font-mono text-gray-500">
                  $25+/mo for all three
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  )
}
