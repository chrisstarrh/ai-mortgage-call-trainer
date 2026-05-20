Score the mortgage training call from 0-100.

Rubric:
- Discovery: 20 points
- Rapport and trust: 15 points
- Needs analysis: 15 points
- Product positioning: 15 points
- Objection handling: 15 points
- Compliance-safe language: 10 points
- Closing / next step: 10 points

Return JSON only:
{
  "overall_score": number,
  "pass_fail": "pass" | "fail",
  "category_scores": {
    "discovery": number,
    "rapport": number,
    "needs_analysis": number,
    "product_positioning": number,
    "objection_handling": number,
    "compliance_safe_language": number,
    "closing_next_step": number
  },
  "what_went_well": [string],
  "missed_opportunities": [string],
  "best_objection_response": string,
  "coaching_notes": [string],
  "recommended_drill": string
}
