# Go-To-Market Strategy (GTM)

## Exact Target User
The target user is a **VP of Engineering or Fractional CTO** at a Series A to Series C startup (50–300 employees). At this stage, companies have enough headcount that AI tool sprawl is happening organically (some engineers expense Cursor, others use GitHub Copilot, marketing uses ChatGPT Plus, support uses Claude), but they don’t yet have a rigid procurement department blocking credit card expenses. The VP of Eng or Fractional CTO is responsible for the tech budget and feels the pain of SaaS bloat, but doesn't have the time to manually audit API keys and seat usage across 5 different dashboards.

## The "Aha!" Trigger
Right before wanting this tool, the user is likely:
- Scrolling through their monthly Ramp or Brex statement and groaning at the aggregated "Software Subscriptions" category.
- Googling phrases like: *"how to track chatgpt enterprise usage"*, *"cursor vs copilot team pricing"*, or *"anthropic api volume discount"*.
- Reading a Hacker News thread titled *"We just cut our AI API spend by 60% by switching models"*.

## Where They Hang Out
- **Private Slack/Discord Communities:** Rands Leadership Slack, Fractional CTO communities, YC Founder Slack (if alumni), and local tech leadership groups (e.g., CTO School).
- **Subreddits:** r/ExperiencedDevs, r/SaaS, r/startups.
- **X (Twitter):** Following pragmatic engineering leaders (e.g., Gergely Orosz, Swyx) and actively participating in discussions about engineering efficiency and AI adoption.

## Getting the First 100 Users ($0 Budget)
"Post on Twitter" won't work from a zero-audience account. Instead, I will use **highly targeted direct outreach combined with a tool-drop strategy**.
1. **Cold Outreach to Fractional CTOs:** Fractional CTOs manage multiple companies and are inherently incentivized to save their clients money. I will scrape LinkedIn for "Fractional CTO" and send a direct message: *"Hey [Name], built a quick free tool that audits AI spend (Copilot, Claude, APIs) and finds overspend. Takes 2 mins, no login. Thought it might be useful for your clients. tokenleak.com."* If 1 Fractional CTO loves it, they use it across 4 clients.
2. **The "Show HN" Drop:** A meticulously crafted Hacker News post. The angle isn't "Here is an audit tool." The angle is: *"Show HN: You're probably overpaying for AI seats. I built a calculator to prove it."* HN loves saving money and optimizing SaaS waste.
3. **Open Source Repositories:** Find popular open-source projects related to AI proxying (like LiteLLM or Helicone) and politely drop the link in relevant GitHub discussions about cost management.

## The Unfair Distribution Channel
**Credex's existing rejected or "too small" pipeline.** Credex likely has companies that apply for credits but are too small to qualify or aren't a fit for the primary product. Credex can automatically send them to TokenLeak as a value-add: *"We can't help you directly yet, but run your stack through TokenLeak—you might find $1k/mo in savings just by optimizing your seats."* When those companies grow, TokenLeak sends them back to Credex.

## Week-1 Traction (Success Metrics)
If this GTM works, Week 1 looks like:
- **Traffic:** 1,500 unique visitors (primarily from the HN launch and shared links).
- **Engagement:** 400 completed audits (26% conversion from visitor to audit).
- **Viral Loop:** 50 unique share links generated and visited by at least 1 other person.
- **Lead Capture:** 40 emails captured (10% of completed audits).
- **High-Intent Leads:** 5 companies identified with >$500/mo in savings that trigger the Credex consultation workflow.
