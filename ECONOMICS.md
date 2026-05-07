# Economics & Unit Economics

## Value of a Converted Lead to Credex
**Estimate: $2,500 LTV per converted lead.**
*Reasoning:* Credex sells discounted AI infrastructure credits. A company spending >$1,000/mo on AI APIs ($12k/yr) is the prime target. If Credex captures that spend and takes a 10% margin on reselling credits, they make $1,200/yr per customer. Assuming an average customer lifespan of ~2 years, the LTV is roughly $2,400. Let's round to $2,500 for simplicity.

## CAC by GTM Channel
Since TokenLeak is a free, self-serve tool, the marginal cost of serving an audit is effectively $0 (a few cents for the LLM summary and edge compute). The acquisition costs are purely labor and distribution:
1. **Cold Outreach to Fractional CTOs:** High labor cost, $0 ad spend. Assuming it takes 2 hours of scraping and messaging to get 10 clicks, and 1 converts to a lead. If labor is valued at $50/hr, the CAC here is **$100 per lead**.
2. **Hacker News "Show HN":** $0 ad spend, moderate labor (creating the post, replying to comments). If 1 successful post takes 4 hours of active engagement ($200 labor) and yields 40 leads, the CAC is **$5 per lead**.
3. **Credex "Rejected/Too Small" Pipeline:** $0 labor, $0 ad spend. Fully automated. CAC is **$0**.

## Profitability Conversion Thresholds
If the blended CAC for a captured email lead via TokenLeak is roughly $15 (factoring in organic sharing), what conversion rates make this profitable?
- **Cost per 1,000 audits:** ~$10 (Vercel compute + Anthropic API).
- **Visitor to Audit:** 20%
- **Audit to Email Lead:** 10%
- **Lead to Consultation Booked (High-Savings only):** 20%
- **Consultation to Closed Deal:** 25%

*The Math for 5,000 visitors:*
- 5,000 visitors → 1,000 audits ($10 infra cost)
- 1,000 audits → 100 email leads (10% conversion)
- 100 leads → 20 consultations booked (20% conversion)
- 20 consultations → 5 closed deals (25% conversion)
- 5 closed deals * $2,500 LTV = **$12,500 in LTV generated**.
- Total Cost (Infra + ~$1,500 blended CAC labor) = $1,510.
- **ROI:** Exceptionally profitable. Even a 1% conversion from lead to closed deal (1 deal) yields $2,500 LTV against a $1,510 cost.

## Driving $1M ARR in 18 Months
To generate $1,000,000 in ARR specifically from TokenLeak leads within 18 months, what must be true?
Assuming the average closed deal brings $1,200/yr in ARR (from our LTV math):
- Target deals needed: $1,000,000 / $1,200 = **833 closed deals**.
- Funnel math (using the conservative 5% Lead → Deal conversion rate from above): 
  - 833 deals / 0.05 = 16,660 email leads needed.
  - 16,660 leads / 0.10 (Audit to Lead rate) = 166,600 completed audits needed.
  - 166,600 audits / 18 months = **9,255 audits per month (~300 per day)**.

*What has to be true:*
1. **Viral Loop Works:** The "share this report" feature must drive a K-factor > 0.2. Every 5 audits must generate 1 new visitor organically.
2. **B2B Partnership Expansion:** The tool cannot rely solely on Hacker News. It must become the standard "calculator" embedded in AI infrastructure blogs, newsletters, and accelerator playbooks.
3. **Credex API Margins hold:** Credex must maintain at least a 10% margin on the resold compute to justify the acquisition model.
