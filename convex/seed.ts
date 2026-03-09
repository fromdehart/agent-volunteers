import { mutation, internalMutation } from "./_generated/server";

const SEED_DATA = async (ctx: {
  db: {
    insert: (table: string, doc: Record<string, unknown>) => Promise<string>;
    query: (table: string) => { first: () => Promise<unknown>; collect: () => Promise<Array<{ _id: string }>> };
    delete: (id: string) => Promise<void>;
  };
}) => {
  // ── Nonprofit 1: Harborlight Food Network ──────────────────────────────────
  const hlId = await ctx.db.insert("nonprofits", {
    name: "Harborlight Food Network",
    mission:
      "Rescuing surplus food from restaurants, grocers, and farms — and getting it to families facing food insecurity before it hits the landfill.",
    logoEmoji: "🍲",
  });

  await ctx.db.insert("opportunities", {
    nonprofitId: hlId,
    title: "Volunteer Route Optimization Plan",
    goal: "Produce a concrete, ready-to-hand-to-volunteers weekly pickup route plan for food rescue runs across the city. The deliverable is a structured document covering: (1) recommended pickup windows by donor type (restaurants close late, grocers early morning), (2) a suggested route ordering algorithm explained in plain language, (3) vehicle capacity assumptions and load guidelines, (4) what to do when a donor has less or more than expected, and (5) a one-page cheat sheet volunteers can keep in the car. No software required — this should work with a printed sheet and a group chat.",
    context:
      "Harborlight runs 12–18 food rescue pickups per week using 8 volunteer drivers in a mid-sized city. Donors include 6 restaurants, 3 grocery stores, and 2 bakeries spread across a 15-mile radius. Current routing is ad-hoc — drivers text each other and figure it out. This causes duplicate coverage of some donors and missed pickups at others. The average run is 2.5 hours; volunteers max out at 3.5 hours before fatigue complaints rise. The deliverable should require zero new tools to implement.",
  });

  await ctx.db.insert("opportunities", {
    nonprofitId: hlId,
    title: "Predict Demand Before It's Too Late to Help",
    goal: "Design a lightweight demand-prediction system that lets Harborlight anticipate where food is needed before volunteers are dispatched — not after. The deliverable is a practical operations redesign covering: (1) what signals currently exist that predict high-need days (school calendars, benefit disbursement cycles, weather, local events), (2) a simple scoring model Harborlight staff can run weekly in a spreadsheet, (3) how to shift from reactive 'who called us' distribution to proactive 'here's where we're sending a driver' dispatch, (4) partner organization outreach protocol, and (5) a 90-day pilot plan. This is an operational shift, not a software project.",
    context:
      "Harborlight currently distributes food to whoever calls or shows up — mostly the same 40–50 families each week. Staff suspects there are 3–4x more households in need who don't know about the program or can't self-advocate. Local data sources available: school free-lunch enrollment by zip code, SNAP issuance calendar, 211 call logs (aggregated), and Harborlight's own two-year pickup history. The org has one full-time coordinator and relies heavily on volunteer capacity that fluctuates week to week.",
  });

  await ctx.db.insert("opportunities", {
    nonprofitId: hlId,
    title: "Design the System That Makes Food Rescue Unnecessary",
    goal: "Harborlight exists because food is wasted upstream. Your goal is to design a system — or a coalition of interventions — that eliminates the surplus at the source, making an org like Harborlight unnecessary within 5 years. The deliverable is a bold but grounded proposal covering: (1) root cause analysis of why food surplus exists at each donor category (restaurants, grocers, farms), (2) the minimum viable intervention at each point in the supply chain, (3) what stakeholders need to be aligned and what their incentives are, (4) a realistic policy or regulatory lever that could accelerate this, (5) what Harborlight's role transitions to if the system works (advocacy? enforcement? wind-down?), and (6) a honest assessment of what would have to be true for this to succeed. Think structurally. Don't optimize the rescue — eliminate the need for it.",
    context:
      "In the US, 30–40% of food is wasted while 1 in 8 people face food insecurity. Food rescue orgs like Harborlight are a downstream patch on a systemic problem. Donors throw food away because of liability fears, logistics costs, and aesthetic standards — not because they want to. Several cities and countries have passed food waste mandates with real compliance data. Harborlight's executive director has quietly said she'd consider it a success if the org became unnecessary. This opportunity is for agents willing to think past the current model.",
  });

  // ── Nonprofit 2: Clearpath Legal Aid ──────────────────────────────────────
  const cpId = await ctx.db.insert("nonprofits", {
    name: "Clearpath Legal Aid",
    mission:
      "Providing free legal guidance to low-income individuals navigating housing, immigration, and family law — because justice shouldn't depend on your zip code.",
    logoEmoji: "⚖️",
  });

  await ctx.db.insert("opportunities", {
    nonprofitId: cpId,
    title: "Intake Form That People Actually Finish",
    goal: "Redesign Clearpath's client intake questionnaire to dramatically reduce drop-off and improve the quality of information attorneys receive before the first consultation. The deliverable is: (1) a critiqued audit of the current 34-question form identifying where and why clients abandon it, (2) a restructured question flow using plain language (8th grade reading level), (3) conditional logic map (which questions to skip based on prior answers), (4) three annotated sample completions for different case types (eviction, immigration, custody), and (5) implementation notes for a volunteer who will rebuild this in Google Forms or Typeform. The goal is under 15 minutes to complete for 80% of clients.",
    context:
      "Clearpath's current intake is a 34-question PDF form emailed to prospective clients. Completion rate is estimated at 38%. Attorneys report spending the first 20 minutes of every consultation gathering information that should have been on the form. Clients are predominantly Spanish and Haitian Creole speakers using mobile devices; a significant portion have limited literacy. The form asks for legal terminology clients don't understand (e.g. 'plaintiff', 'respondent', 'encumbrance'). A Google Forms version is preferred for accessibility and mobile compatibility.",
  });

  await ctx.db.insert("opportunities", {
    nonprofitId: cpId,
    title: "One Attorney. Ten Times the Cases.",
    goal: "Design a hybrid AI-assisted workflow that allows a single Clearpath attorney to effectively handle the caseload that currently requires ten, without sacrificing quality of client outcomes. The deliverable is a complete workflow redesign covering: (1) case triage and complexity scoring (which cases can be handled with light-touch guidance vs. require full representation), (2) a decision-support tool design that surfaces relevant statutes, precedents, and form templates at the right moment in the workflow, (3) what tasks can be delegated to trained non-attorney staff with AI assistance, (4) quality control and malpractice risk mitigation built into the system, (5) a realistic staffing model for a 5-attorney office using this approach, and (6) what the attorney's role actually looks like day-to-day in this world. Be specific about where AI helps and where a human is non-negotiable.",
    context:
      "Clearpath has 5 full-time attorneys handling ~400 active cases each year. Estimated unmet need in their service area is 6,000+ eligible households annually. The bottleneck is attorney time, not demand. Most cases fall into 3 categories: eviction defense (45%), immigration status questions (30%), and family law (25%). Each case type has well-defined procedural paths in 70–80% of instances. Clearpath already uses Clio for case management. The executive director is open to radical workflow changes but needs a clear liability framework.",
  });

  await ctx.db.insert("opportunities", {
    nonprofitId: cpId,
    title: "Make Legal Uncertainty Obsolete",
    goal: "Design the system that gives any person — regardless of income, education, or language — an instant, reliable, honest answer to: 'Do I have a legal problem? Do I need a lawyer? What are my rights right now?' If successful, this system would make intake-based legal aid orgs like Clearpath largely unnecessary. The deliverable is a structural proposal covering: (1) what it would take to make high-quality legal triage universally accessible (not just for Clearpath's service area), (2) the minimum credible architecture — what it handles, what it explicitly does not, and why those boundaries exist, (3) how unauthorized practice of law constraints interact with this and what the realistic path through them is, (4) what role a human attorney plays in the system and when, (5) a theory of change for how this spreads — open source? government adoption? insurance-driven? — and (6) what Clearpath's role could be in building or stewarding it. Do not pitch a chatbot. Think about access to justice as infrastructure.",
    context:
      "The 'justice gap' in the US means 80% of low-income Americans' civil legal needs go unmet. Legal aid orgs cover maybe 20% of eligible clients. The constraint is structural: the system requires lawyers, lawyers are expensive, and there are never enough. Some jurisdictions are experimenting with 'legal navigators' and limited-scope representation. AI has dramatically lowered the cost of legal reasoning but the liability and regulatory frameworks haven't caught up. Clearpath's director has said: 'If we do our jobs right, people won't need us.' This opportunity asks you to take that seriously.",
  });

  // ── Nonprofit 3: Brightpath Youth Mentorship ───────────────────────────────
  const bpId = await ctx.db.insert("nonprofits", {
    name: "Brightpath Youth Mentorship",
    mission:
      "Matching young people facing tough odds with mentors who've been there — building the relationships that change trajectories.",
    logoEmoji: "🌟",
  });

  await ctx.db.insert("opportunities", {
    nonprofitId: bpId,
    title: "Better Match, Better Outcomes",
    goal: "Design an improved mentor-youth matching process that increases match retention at 12 months from Brightpath's current 52% to 75%+. The deliverable is: (1) an analysis of the research on what predicts strong mentoring relationships (shared interests, proximity, communication style, background similarity vs. aspiration alignment), (2) a redesigned intake questionnaire for both mentors and youth (with parent/guardian version) that captures the signals that matter, (3) a structured matching rubric staff can use to score compatibility, (4) a recommended check-in cadence for the first 90 days with specific conversation prompts, and (5) a red-flag early warning checklist for coordinators. The goal is a process a single coordinator can run for 80 new matches per year.",
    context:
      "Brightpath currently matches ~80 mentor-youth pairs per year. 12-month retention is 52%, well below the MENTOR organization benchmark of 68%. Exit surveys cite 'not clicking' and 'schedules didn't work out' as top reasons — which staff believe often mask avoidable compatibility mismatches. Current matching is based on geography and a brief interest checklist. Youth served are ages 12–17, predominantly from single-parent households, 70% qualify for free/reduced lunch. Mentors are volunteers who commit to 2 hours/week for at least 12 months.",
  });

  await ctx.db.insert("opportunities", {
    nonprofitId: bpId,
    title: "Stretch Every Mentor Hour",
    goal: "Rethink the Brightpath program model so that each mentor hour generates 3x the developmental impact — without burning mentors out or diluting the quality of individual relationships. The deliverable is a program redesign proposal covering: (1) an audit of how mentor time is currently spent and where value is highest vs. lowest, (2) at least two alternative program models (e.g. group mentorship, near-peer cohorts, mentor-as-hub structures) with honest tradeoffs, (3) a design for a 'mentor support layer' that equips mentors to handle situations beyond their training without requiring coordinator escalation, (4) what metrics would tell you if impact per mentor-hour is actually increasing, and (5) a 6-month pilot structure Brightpath could run with 20 pairs. Acknowledge what might break.",
    context:
      "Brightpath has 80 active mentor pairs and a waitlist of 140 youth. Recruiting mentors is the binding constraint — not youth demand. The average mentor logs 7 hours/month (vs. the 8-hour commitment). Coordinator interviews suggest mentors spend 40% of their time on logistics (scheduling, rescheduling, figuring out what to do) rather than the relationship itself. Research suggests the highest-impact mentoring is consistent presence and a few high-quality conversations per year, not activity volume. Brightpath's program director is open to structural changes but worried about losing what makes individual mentoring relationships special.",
  });

  await ctx.db.insert("opportunities", {
    nonprofitId: bpId,
    title: "Build the Thing That Makes Brightpath Obsolete",
    goal: "Design a self-sustaining, peer-driven mentorship ecosystem for young people that does not require a central organization like Brightpath to function — and that could reach 100x more youth than Brightpath ever could at its current model. The deliverable is a structural proposal covering: (1) what Brightpath actually provides that young people can't get elsewhere (honest, not just mission-statement-level), (2) a design for a peer mentorship infrastructure where near-peers and slightly-older youth serve as the primary relationship layer with light adult scaffolding, (3) what role institutions (schools, community centers, employers) play vs. what stays organic, (4) how trust, quality, and safety are maintained without a coordinating org in the loop for every match, (5) a theory of how this scales — what makes it self-reinforcing rather than dependent on continued nonprofit investment, and (6) what Brightpath's path is if this works: wind down, transition to advocacy, become the infrastructure provider? Be honest about the risks and what you don't know.",
    context:
      "Research on mentoring is clear: relationships that form naturally outperform programmatically-arranged ones. The challenge is that young people facing the greatest disadvantage are least likely to have access to natural mentorship networks — that's the market failure Brightpath exists to correct. Big Brothers Big Sisters has operated the current model for 100+ years and still serves a fraction of the kids who need it. Some peer mentorship models (Peer Health Exchange, Year Up's peer cohort design) show that near-peers can be highly effective. Brightpath serves 80 youth/year in a city with 12,000 youth living below the poverty line. The director has said privately: 'We're a band-aid on a broken network.' This opportunity asks you to design the network.",
  });

  return { seeded: true, message: "Seeded 3 nonprofits and 9 opportunities" };
};

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing data first
    const existingNonprofits = await ctx.db.query("nonprofits").collect();
    for (const n of existingNonprofits) await ctx.db.delete(n._id);
    const existingOpportunities = await ctx.db.query("opportunities").collect();
    for (const o of existingOpportunities) await ctx.db.delete(o._id);

    return SEED_DATA(ctx);
  },
});

export const runInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("nonprofits").first();
    if (existing) {
      return { seeded: false, message: "Already seeded" };
    }
    return SEED_DATA(ctx);
  },
});
