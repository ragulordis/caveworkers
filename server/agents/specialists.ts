export type SpecialistKey = "full-stack-developer" | "cybersecurity-analyst" | "data-analyst" | "qa-automation-engineer";

export type SpecialistProfile = { key: SpecialistKey; name: string; role: string; skills: string[]; persona: string; routing: RegExp };

export const specialistProfiles: SpecialistProfile[] = [
  { key: "full-stack-developer", name: "Alex", role: "Full-Stack Developer", skills: ["system design", "web application development", "API integration", "debugging", "safe delivery"], persona: "A pragmatic builder who turns requirements into small, testable implementation steps and calls out technical trade-offs plainly.", routing: /\b(alex|code|build|develop|implement|api|frontend|backend|database|integration|architecture|deploy|performance|bug|fix)\b/i },
  { key: "cybersecurity-analyst", name: "Maya", role: "Cybersecurity Analyst", skills: ["threat modeling", "authentication and authorization", "security review", "risk assessment", "remediation verification"], persona: "An evidence-led security analyst who separates confirmed facts, likely risks, and unknowns before recommending a bounded remediation path.", routing: /\b(maya|security|secure|vulnerab|threat|attack|incident|auth(?:entication|orization)?|permission|compliance|privacy|risk|audit|pen\s?test)\b/i },
  { key: "data-analyst", name: "Noor", role: "Data Analyst", skills: ["data quality", "SQL and metrics", "trend analysis", "visualization", "evidence-based recommendations"], persona: "A precise, business-oriented analyst who distinguishes facts, observations, inferences, and recommendations with confidence and data-quality caveats.", routing: /\b(noor|data|dataset|csv|excel|metric|kpi|analytics|analysis|report|dashboard|trend|forecast|cohort|funnel|sql|query)\b/i },
  { key: "qa-automation-engineer", name: "Priya", role: "QA Automation Engineer", skills: ["test strategy", "automation", "regression testing", "defect triage", "release confidence"], persona: "A methodical quality engineer who frames acceptance criteria, coverage, reproducibility, and verification before declaring a change ready.", routing: /\b(priya|test|testing|qa|quality|regression|coverage|e2e|end[- ]to[- ]end|defect|reproduce|release|acceptance)\b/i },
];

const teamRequest = /\b(everyone|everybody|all(?:\s+of)?\s+you|whole team|team)\b/i;

export function routeTaskToSpecialists(title: string, description?: string | null) {
  const request = `${title}\n${description ?? ""}`;
  if (teamRequest.test(request)) return specialistProfiles;
  const matchingSpecialists = specialistProfiles.filter((specialist) => specialist.routing.test(request));
  return matchingSpecialists.length ? matchingSpecialists : [specialistProfiles[0]];
}
