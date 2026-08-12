// 90-Day Results Operating System — data model
//
// This encodes the "First 90 days" results from the mandate into a machine-
// checkable scorecard. Each Result is broken into concrete Metrics with
// targets and red/amber thresholds so the engine can objectively flag major
// issues and emit action steps. No external services required.

export type Status = "green" | "amber" | "red";

export type MetricKind =
  | "percent" // 0-100, higher is better unless invert=true
  | "count" // integer, compared against target band
  | "boolean" // true/false gate (e.g. "CEO-approved plan")
  | "currency"; // dollars, higher is better unless invert=true

export interface MetricDef {
  id: string;
  label: string;
  help: string;
  kind: MetricKind;
  unit?: string;
  /** Value at or above which the metric is on-track (green). */
  target: number;
  /** Below this the metric is a major issue (red). Between amber & target = amber. */
  amber: number;
  red: number;
  /** For count metrics we also cap the healthy band (e.g. 3-5 levers). */
  targetMax?: number;
  /** When true, lower numbers are better (e.g. churn %). */
  invert?: boolean;
  /** Optional starting value used for the "load sample data" demo. */
  sample?: number | boolean;
  /** Pre-authored remediation played when this metric is amber or red. */
  actions: {
    amber: ActionTemplate;
    red: ActionTemplate;
  };
}

export interface ActionTemplate {
  title: string;
  steps: string[];
  owner: string;
  /** Rough time-to-impact so the UI can sort quick wins vs. long plays. */
  horizon: "this week" | "this month" | "this quarter";
}

export interface ResultDef {
  id: string;
  title: string;
  /** Verbatim mandate line this result tracks. */
  mandate: string;
  /** Relative importance used to weight the overall readiness score. */
  weight: number;
  metrics: MetricDef[];
}

// ---------------------------------------------------------------------------
// The plan — one ResultDef per line in the "First 90 days" mandate.
// ---------------------------------------------------------------------------

export const PLAN: ResultDef[] = [
  {
    id: "operating-cadence",
    title: "Operating Cadence & Scorecards",
    mandate:
      "Full operating cadence live, every department on a consistent scorecard owned by this person.",
    weight: 1,
    metrics: [
      {
        id: "departments-on-scorecard",
        label: "Departments on a consistent scorecard",
        help: "Share of departments reporting into one standard weekly scorecard format.",
        kind: "percent",
        unit: "%",
        target: 100,
        amber: 70,
        red: 40,
        sample: 55,
        actions: {
          amber: {
            title: "Roll the standard scorecard to remaining departments",
            owner: "This person (Ops lead)",
            horizon: "this month",
            steps: [
              "List departments not yet on the standard scorecard template.",
              "Book a 30-min onboarding per department to map their 5-7 core metrics.",
              "Set a hard date by which every department reports in the shared format.",
            ],
          },
          red: {
            title: "Stand up the operating cadence — this is the keystone result",
            owner: "This person (Ops lead)",
            horizon: "this week",
            steps: [
              "Publish one canonical scorecard template (metric, target, owner, trend).",
              "Personally own rollout: schedule the weekly cadence meeting now.",
              "Get the CEO to name you as the single owner of the cadence in writing.",
            ],
          },
        },
      },
      {
        id: "cadence-adherence",
        label: "Weekly cadence adherence (last 4 weeks)",
        help: "Percent of scheduled weekly business reviews actually held with a quorum.",
        kind: "percent",
        unit: "%",
        target: 90,
        amber: 70,
        red: 50,
        sample: 75,
        actions: {
          amber: {
            title: "Protect the cadence from slippage",
            owner: "This person (Ops lead)",
            horizon: "this week",
            steps: [
              "Make the weekly review a recurring, non-movable calendar hold.",
              "Define a quorum rule and a pre-read due 24h before each meeting.",
              "Track attendance; follow up 1:1 with any leader who no-shows.",
            ],
          },
          red: {
            title: "Re-establish the cadence — meetings are not happening",
            owner: "This person (Ops lead)",
            horizon: "this week",
            steps: [
              "Reset the meeting series with CEO sponsorship stated up front.",
              "Cut the agenda to red metrics + blockers only, 30 minutes max.",
              "Send a same-day recap with owners and due dates after each session.",
            ],
          },
        },
      },
      {
        id: "on-time-reporting",
        label: "Metrics reported on time",
        help: "Percent of scorecard metrics submitted before the weekly deadline.",
        kind: "percent",
        unit: "%",
        target: 85,
        amber: 65,
        red: 45,
        sample: 60,
        actions: {
          amber: {
            title: "Tighten reporting discipline",
            owner: "Department leads",
            horizon: "this month",
            steps: [
              "Automate a reminder 24h and 2h before the reporting deadline.",
              "Pre-fill metrics that can be pulled from source systems.",
              "Publish a weekly on-time leaderboard by department.",
            ],
          },
          red: {
            title: "Fix broken reporting — you are flying blind",
            owner: "This person (Ops lead)",
            horizon: "this week",
            steps: [
              "Identify the 2-3 metrics that are hardest to report and simplify them.",
              "Assign a named backup reporter for every department.",
              "Make on-time reporting a line item in each leader's own scorecard.",
            ],
          },
        },
      },
      {
        id: "cadence-owner-named",
        label: "Cadence has a single named owner",
        help: "The mandate requires the cadence and scorecards be owned by this person.",
        kind: "boolean",
        target: 1,
        amber: 1,
        red: 1,
        sample: false,
        actions: {
          amber: {
            title: "Confirm ownership",
            owner: "CEO + this person",
            horizon: "this week",
            steps: ["Confirm ownership of the cadence is documented and shared."],
          },
          red: {
            title: "Get named as the owner of the operating cadence",
            owner: "CEO + this person",
            horizon: "this week",
            steps: [
              "Secure explicit, written ownership of the cadence from the CEO.",
              "Announce the ownership to all department leaders.",
              "Add 'operating cadence' to your own goals and scorecard.",
            ],
          },
        },
      },
    ],
  },
  {
    id: "margin-expansion",
    title: "Margin-Expansion Plan",
    mandate:
      "A CEO-approved margin-expansion plan with the top 3-5 levers in motion.",
    weight: 1.2,
    metrics: [
      {
        id: "plan-ceo-approved",
        label: "Margin plan is CEO-approved",
        help: "The mandate requires an explicitly CEO-approved margin-expansion plan.",
        kind: "boolean",
        target: 1,
        amber: 1,
        red: 1,
        sample: false,
        actions: {
          amber: {
            title: "Close out CEO sign-off",
            owner: "This person + CEO",
            horizon: "this week",
            steps: ["Walk the CEO through the plan and capture formal approval."],
          },
          red: {
            title: "Get the margin-expansion plan approved by the CEO",
            owner: "This person + CEO",
            horizon: "this month",
            steps: [
              "Draft a one-page plan: current margin, target, and top levers.",
              "Quantify expected margin impact and investment for each lever.",
              "Book a decision meeting with the CEO to approve and fund it.",
            ],
          },
        },
      },
      {
        id: "levers-identified",
        label: "Top margin levers identified",
        help: "Mandate calls for the top 3-5 levers. Fewer than 3 is a gap; more than 5 dilutes focus.",
        kind: "count",
        unit: "levers",
        target: 3,
        targetMax: 5,
        amber: 2,
        red: 1,
        sample: 2,
        actions: {
          amber: {
            title: "Complete the lever shortlist",
            owner: "This person (Ops/Finance)",
            horizon: "this month",
            steps: [
              "Size the top margin opportunities: pricing, COGS, mix, retention, efficiency.",
              "Rank by impact x confidence x speed and pick the top 3-5.",
            ],
          },
          red: {
            title: "Identify the margin levers — none are defined yet",
            owner: "This person (Ops/Finance)",
            horizon: "this month",
            steps: [
              "Run a margin waterfall to find where dollars leak today.",
              "Interview finance and department leads for the biggest levers.",
              "Shortlist the top 3-5 levers with a rough impact estimate each.",
            ],
          },
        },
      },
      {
        id: "levers-in-motion",
        label: "Levers actively in motion",
        help: "Levers with a named owner, a plan, and work underway (not just identified).",
        kind: "count",
        unit: "levers",
        target: 3,
        targetMax: 5,
        amber: 2,
        red: 1,
        sample: 1,
        actions: {
          amber: {
            title: "Move more levers from plan to execution",
            owner: "Lever owners",
            horizon: "this month",
            steps: [
              "Assign a single accountable owner to each lever.",
              "Give each lever a milestone plan and a spot on the weekly scorecard.",
            ],
          },
          red: {
            title: "Put the margin levers into motion",
            owner: "This person (Ops lead)",
            horizon: "this week",
            steps: [
              "Kick off the highest-impact lever with a 30-day milestone this week.",
              "Assign owners and add each lever's status to the weekly review.",
              "Report projected vs. realized margin impact every week.",
            ],
          },
        },
      },
      {
        id: "gross-margin",
        label: "Current gross margin",
        help: "Blended gross margin today. Compared against the target you set in the plan.",
        kind: "percent",
        unit: "%",
        target: 60,
        amber: 50,
        red: 40,
        sample: 47,
        actions: {
          amber: {
            title: "Defend and grow margin",
            owner: "This person (Ops/Finance)",
            horizon: "this quarter",
            steps: [
              "Attack the two largest COGS lines and renegotiate top vendor terms.",
              "Review pricing and discounting policy for margin leakage.",
            ],
          },
          red: {
            title: "Margin is below target — treat as urgent",
            owner: "This person + CEO",
            horizon: "this quarter",
            steps: [
              "Freeze low-margin discounting and re-price loss-making segments.",
              "Cut or renegotiate the biggest cost drivers under the plan.",
              "Set a weekly margin trend on the CEO scorecard until it recovers.",
            ],
          },
        },
      },
    ],
  },
  {
    id: "ai-enablement",
    title: "AI-Enablement Roadmap",
    mandate:
      "An AI-enablement roadmap for all departments, with the first 2-3 automations shipped and their margin/time impact measured.",
    weight: 1,
    metrics: [
      {
        id: "departments-with-roadmap",
        label: "Departments covered by the AI roadmap",
        help: "Share of departments with at least one scoped AI/automation opportunity on the roadmap.",
        kind: "percent",
        unit: "%",
        target: 100,
        amber: 60,
        red: 30,
        sample: 40,
        actions: {
          amber: {
            title: "Extend the roadmap to every department",
            owner: "This person + dept leads",
            horizon: "this month",
            steps: [
              "Run a 30-min opportunity scan with each uncovered department.",
              "Log every idea with an effort/impact tag on one roadmap.",
            ],
          },
          red: {
            title: "Build the AI-enablement roadmap — coverage is thin",
            owner: "This person (Ops lead)",
            horizon: "this month",
            steps: [
              "Inventory repetitive, high-volume tasks across all departments.",
              "Score each for time saved, margin impact, and ease of automation.",
              "Publish a single roadmap sequencing the top opportunities.",
            ],
          },
        },
      },
      {
        id: "automations-shipped",
        label: "Automations shipped",
        help: "Mandate calls for the first 2-3 automations live in production.",
        kind: "count",
        unit: "shipped",
        target: 2,
        targetMax: 3,
        amber: 1,
        red: 0,
        sample: 0,
        actions: {
          amber: {
            title: "Ship the next automation",
            owner: "This person + owner",
            horizon: "this month",
            steps: [
              "Pick the highest impact/lowest effort item and set a ship date.",
              "Define the before/after metric you will measure.",
            ],
          },
          red: {
            title: "Ship the first automations — nothing is live yet",
            owner: "This person (Ops lead)",
            horizon: "this month",
            steps: [
              "Choose 2-3 quick-win automations from the roadmap.",
              "Timebox each to a 2-week build and assign an owner.",
              "Instrument each with a baseline so impact is measurable at launch.",
            ],
          },
        },
      },
      {
        id: "impact-measured",
        label: "Shipped automations have measured impact",
        help: "Every shipped automation has a quantified margin or time-saved result.",
        kind: "boolean",
        target: 1,
        amber: 1,
        red: 1,
        sample: false,
        actions: {
          amber: {
            title: "Close the measurement gap",
            owner: "This person (Ops lead)",
            horizon: "this month",
            steps: ["Attach a measured before/after result to each shipped automation."],
          },
          red: {
            title: "Measure the impact of shipped automations",
            owner: "This person (Ops lead)",
            horizon: "this month",
            steps: [
              "Define the metric (hours saved, cost removed, margin points) per automation.",
              "Capture the pre-launch baseline and the post-launch actual.",
              "Report the measured impact on the weekly scorecard.",
            ],
          },
        },
      },
      {
        id: "hours-saved",
        label: "Hours saved per week (measured)",
        help: "Total measured weekly hours returned by shipped automations.",
        kind: "count",
        unit: "hrs/wk",
        target: 20,
        amber: 5,
        red: 1,
        sample: 0,
        actions: {
          amber: {
            title: "Scale time savings",
            owner: "This person (Ops lead)",
            horizon: "this quarter",
            steps: [
              "Expand a working automation to adjacent teams or use cases.",
              "Redeploy freed hours to higher-value work and note it.",
            ],
          },
          red: {
            title: "Demonstrate real time savings",
            owner: "This person (Ops lead)",
            horizon: "this month",
            steps: [
              "Ship at least one automation that removes measurable manual hours.",
              "Track hours saved weekly and roll it into the margin story.",
            ],
          },
        },
      },
    ],
  },
  {
    id: "retention",
    title: "Retention Read & First Improvements",
    mandate:
      "A clear read on retention drivers, with the first improvements shipped.",
    weight: 1,
    metrics: [
      {
        id: "drivers-identified",
        label: "Retention drivers identified",
        help: "The mandate requires a clear, evidence-based read on what drives retention and churn.",
        kind: "boolean",
        target: 1,
        amber: 1,
        red: 1,
        sample: false,
        actions: {
          amber: {
            title: "Validate the retention drivers",
            owner: "This person + CX/Product",
            horizon: "this month",
            steps: ["Confirm the top churn/retention drivers with data and customer input."],
          },
          red: {
            title: "Get a clear read on retention drivers",
            owner: "This person + CX/Product",
            horizon: "this month",
            steps: [
              "Pull cohort retention and segment churn by reason and value.",
              "Interview recently churned and at-risk accounts for root causes.",
              "Rank the top 3 drivers you can actually influence.",
            ],
          },
        },
      },
      {
        id: "retention-rate",
        label: "Current retention rate",
        help: "Logo or revenue retention over the trailing period. Higher is better.",
        kind: "percent",
        unit: "%",
        target: 90,
        amber: 80,
        red: 70,
        sample: 78,
        actions: {
          amber: {
            title: "Lift retention toward target",
            owner: "This person + CX/Product",
            horizon: "this quarter",
            steps: [
              "Focus the first improvement on the largest controllable churn driver.",
              "Add a leading indicator (e.g. activation, health score) to the scorecard.",
            ],
          },
          red: {
            title: "Retention is below target — prioritize it",
            owner: "This person + CX/Product",
            horizon: "this quarter",
            steps: [
              "Launch a save/win-back play for the highest-value at-risk segment.",
              "Fix the top onboarding or value gap driving early churn.",
              "Review retention weekly until the trend turns.",
            ],
          },
        },
      },
      {
        id: "improvements-shipped",
        label: "Retention improvements shipped",
        help: "Mandate calls for the first improvements to be shipped, not just planned.",
        kind: "count",
        unit: "shipped",
        target: 1,
        amber: 1,
        red: 0,
        sample: 0,
        actions: {
          amber: {
            title: "Ship the next retention improvement",
            owner: "This person + CX/Product",
            horizon: "this month",
            steps: [
              "Pick the improvement tied to the biggest driver and set a ship date.",
              "Define the retention metric it should move.",
            ],
          },
          red: {
            title: "Ship the first retention improvement",
            owner: "This person + CX/Product",
            horizon: "this month",
            steps: [
              "Select one high-leverage fix from the driver analysis.",
              "Timebox it and assign an owner to ship within 30 days.",
              "Measure the before/after effect on the target cohort.",
            ],
          },
        },
      },
    ],
  },
];

/** Convenience: flat list of every metric with its parent result id. */
export function allMetrics(): { result: ResultDef; metric: MetricDef }[] {
  return PLAN.flatMap((result) =>
    result.metrics.map((metric) => ({ result, metric }))
  );
}
