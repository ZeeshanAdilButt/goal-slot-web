import { AnimatedSection } from '@/components/animated-section'

const faqs = [
  {
    q: "I've tried tracking apps before and always quit. Why would this be different?",
    a: "Because other apps only track time OR tasks OR goals. They never connect. You quit because the data felt meaningless. GoalSlot links everything: your goals show real hours logged, your schedule turns into tracked time, your progress becomes visible. When you see your hours stack up toward a goal, quitting feels like losing progress—and that's powerful motivation.",
  },
  {
    q: "I'm already using Notion/Toggl/Todoist. Do I need another app?",
    a: "You're paying $25+/month for tools that don't talk to each other. GoalSlot replaces all of them at $7/month AND connects everything. Your logged time automatically updates your goal progress. No more copying data between apps or guessing how much time you spent on what.",
  },
  {
    q: 'What if I forget to track my time?',
    a: "We've got you covered. You can manually add time entries after the fact, use the live timer, or quickly log time from your schedule. Most users find that once they see their progress chart, they WANT to track—it becomes addictive in a good way.",
  },
  {
    q: 'Is my data private? Can my employer see it?',
    a: "100% private by default. You choose what to share and with whom. Share your dashboard with a mentor? Your choice. Keep it completely private? Also your choice. We'll never sell your data or share it without your explicit permission.",
  },
  {
    q: 'What happens if I cancel?',
    a: "You can export all your data anytime. No lock-in, no hostage situation. And if you're on the free plan, you keep access forever. We want you to stay because the product is valuable, not because you're trapped.",
  },
]

export function FAQSection() {
  return (
    <section className="border-y-3 border-secondary bg-white px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <AnimatedSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 font-display text-4xl font-bold uppercase md:text-5xl">Questions? We've Got Answers</h2>
        </AnimatedSection>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <AnimatedSection
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card-brutal"
            >
              <h3 className="mb-3 font-display text-lg font-bold">{faq.q}</h3>
              <p className="font-mono leading-relaxed text-gray-600">{faq.a}</p>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
