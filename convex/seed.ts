import { mutation, internalMutation } from "./_generated/server";

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("nonprofits").first();
    if (existing) {
      return { seeded: false, message: "Already seeded" };
    }

    // Nonprofit 1: Open Library Foundation
    const olfId = await ctx.db.insert("nonprofits", {
      name: "Open Library Foundation",
      mission:
        "Making all the world's knowledge freely accessible through open, collaborative digital libraries.",
      logoEmoji: "📚",
    });

    await ctx.db.insert("opportunities", {
      nonprofitId: olfId,
      title: "AI-Powered Reading Recommendations",
      goal: "Design and document a complete technical specification for an AI-powered book recommendation system for Open Library. The deliverable is a structured spec document covering: (1) data inputs (user reading history, ratings, subject tags), (2) embedding model selection rationale, (3) similarity scoring approach, (4) privacy-preserving design constraints, (5) cold-start strategy for new users, and (6) A/B testing plan. The output should be thorough enough that an engineering team could begin implementation without further design work.",
      context:
        "Open Library (openlibrary.org) hosts metadata for 40 million+ book records and supports user reading lists and ratings. The current 'related books' feature is purely subject-tag-based with no personalization. The system must work without storing personally identifiable data beyond a hashed user identifier. The platform is open-source (Python/Infogami stack) and serves ~10 million monthly unique visitors. Budget for inference is constrained — prefer smaller, cacheable embeddings over large real-time models.",
    });

    await ctx.db.insert("opportunities", {
      nonprofitId: olfId,
      title: "Accessibility Testing Playbook",
      goal: "Produce a comprehensive, actionable accessibility testing playbook for the Open Library web interface. The deliverable is a structured markdown document covering: (1) automated testing tools and CI integration (axe-core, Lighthouse), (2) manual testing checklist (screen reader, keyboard-only navigation, color contrast, cognitive load), (3) WCAG 2.1 AA criteria prioritized for a library catalog context, (4) remediation templates for the 5 most common issues found in library UIs, and (5) a quarterly review cadence. The playbook should be usable by a non-specialist volunteer QA team.",
      context:
        "Open Library currently has no systematic accessibility QA process. The site uses server-rendered HTML with jQuery enhancements. Known issues include low-contrast text on some book detail pages and incomplete keyboard navigation in search filters. The target compliance standard is WCAG 2.1 AA. Users include visually impaired researchers, students using assistive tech in schools, and elderly patrons.",
    });

    // Nonprofit 2: Code for America
    const cfaId = await ctx.db.insert("nonprofits", {
      name: "Code for America",
      mission:
        "Using the power of technology to help government work for all people, especially those who need it most.",
      logoEmoji: "🏛️",
    });

    await ctx.db.insert("opportunities", {
      nonprofitId: cfaId,
      title: "Benefits Eligibility Navigator Flow",
      goal: "Design a complete conversational agent flow for a benefits eligibility navigator that helps low-income residents determine which government assistance programs they may qualify for. The deliverable is: (1) a structured conversation flow diagram described in text/pseudocode, (2) three annotated sample dialogues covering different user profiles, (3) an edge case handling guide (conflicting answers, user drops off, eligibility on the margin), (4) a list of the 10 highest-impact federal/state programs to cover in v1, and (5) plain-language phrasing guidelines for eligibility questions. The output should be ready for a UX team to prototype from.",
      context:
        "CfA's GetCalFresh product demonstrated that well-designed eligibility flows dramatically increase program uptake. The target audience has limited tech literacy, may use mobile-only internet access, and may distrust government interfaces. There are 54+ overlapping federal and state benefit programs. The navigator must avoid storing sensitive data and must be ADA-compliant. Key programs to consider: SNAP, Medicaid, CHIP, WIC, EITC, LIHEAP, Section 8, SSI, TANF, and state-level variants.",
    });

    await ctx.db.insert("opportunities", {
      nonprofitId: cfaId,
      title: "Court Date SMS Reminder System Spec",
      goal: "Draft a complete technical specification for an SMS-based court date reminder system for public defender offices. The deliverable is a spec document covering: (1) system architecture overview, (2) Twilio integration design, (3) message templates for 7-day, 3-day, and day-of reminders, (4) opt-in and opt-out flow, (5) handling for rescheduled or cancelled hearings, (6) privacy and data retention policy, (7) failure handling (undelivered SMS, wrong numbers), and (8) estimated cost per client per case. The spec should be implementable by a two-person engineering team in six weeks.",
      context:
        "Missed court dates are one of the most common causes of bench warrants and pretrial detention for low-income defendants. Public defender offices typically manage caseloads via case management software that lacks automated client communication. The system must handle clients without smartphones (landline fallback TTS), must never include the nature of the charge in SMS content, and must be privacy-forward. SMS delivery rates in low-income communities are high even for feature phones.",
    });

    await ctx.db.insert("opportunities", {
      nonprofitId: cfaId,
      title: "Civic Tech Volunteer Onboarding Guide",
      goal: "Produce a structured onboarding guide for new Code for America volunteers that reduces time-to-first-contribution and improves 30-day retention. The deliverable is a markdown document organized into sections for: (1) software engineers, (2) designers, (3) data scientists and analysts, and (4) policy and communications generalists. Each section includes: project discovery steps, first-task recommendations by skill level, communication channel norms, how to ask for help, and what good looks like in week 1 vs. month 1. Also include a universal section on CfA's mission, culture, and code of conduct expectations.",
      context:
        "CfA has 80+ active projects in various stages, maintained by distributed volunteer teams. Dropout in the first 30 days is estimated at 60%+. Current onboarding is a GitHub README and a Slack welcome message. Volunteers range from senior engineers donating 5 hours/week to college students working on capstone projects. The goal is a living document updated quarterly and maintained in the CfA GitHub wiki.",
    });

    // Nonprofit 3: Environmental Defense Fund
    const edfId = await ctx.db.insert("nonprofits", {
      name: "Environmental Defense Fund",
      mission:
        "Protecting the health of the planet and the people who live on it through science, economics, and partnership.",
      logoEmoji: "🌱",
    });

    await ctx.db.insert("opportunities", {
      nonprofitId: edfId,
      title: "Small Business Carbon Tracker Design",
      goal: "Design a user-friendly carbon footprint tracking tool for small businesses with 10–50 employees. The deliverable is a product requirements document (PRD) covering: (1) user personas and their carbon accounting literacy, (2) data input model (what the business provides vs. what is calculated), (3) Scope 1 and Scope 2 emissions calculation methodology with cited emission factors, (4) monthly and annual reporting format, (5) UX wireframe descriptions for four core screens (dashboard, data entry, report view, goal-setting), (6) integration hooks for QuickBooks and utility bill imports, and (7) a phased rollout plan (MVP vs. v2). The PRD should be detailed enough for a product manager to write user stories from it.",
      context:
        "Small and medium businesses account for 44% of US GDP but lack affordable carbon accounting tools — enterprise solutions start at $15,000/year. Target users are office managers or owners with no sustainability background. Scope 1 covers direct emissions (company vehicles, on-site gas); Scope 2 covers purchased electricity. Scope 3 is out of scope for MVP. Emission factors should draw from the EPA eGRID database and the GHG Protocol. The tool should produce a report businesses can share with customers or supply chain partners.",
    });

    await ctx.db.insert("opportunities", {
      nonprofitId: edfId,
      title: "Open Climate Data Dashboard Specification",
      goal: "Produce a detailed technical specification for an open-source climate data visualization dashboard that aggregates publicly available datasets and makes them accessible to non-technical journalists and policy staff. The deliverable is a spec covering: (1) selected data sources and their update cadences (NOAA, EPA, NASA GISS, NSIDC), (2) eight to ten core visualizations with descriptions and intended audience, (3) frontend tech stack recommendation with rationale, (4) public API design (endpoints, query params, response format), (5) data pipeline architecture (ingestion, normalization, storage, refresh), (6) citation and methodology transparency requirements, and (7) a maintenance burden estimate for a two-person open-source team. All visualizations must be embeddable in news articles via iframe.",
      context:
        "Climate data is publicly available but fragmented across dozens of agency portals with inconsistent formats and update schedules. Journalists at local news outlets struggle to find citable, up-to-date data for stories on local temperature records, air quality, and sea level. Policy staff need downloadable, clearly-sourced charts for testimony. The spec should prioritize data that updates at least monthly and covers at least 30 years of historical records. Existing tools like Climate Central are not open-source and not embeddable, creating a clear gap.",
    });

    return { seeded: true, message: "Seeded 3 nonprofits and 7 opportunities" };
  },
});

export const runInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("nonprofits").first();
    if (existing) {
      return { seeded: false, message: "Already seeded" };
    }

    const olfId = await ctx.db.insert("nonprofits", {
      name: "Open Library Foundation",
      mission:
        "Making all the world's knowledge freely accessible through open, collaborative digital libraries.",
      logoEmoji: "📚",
    });

    await ctx.db.insert("opportunities", {
      nonprofitId: olfId,
      title: "AI-Powered Reading Recommendations",
      goal: "Design and document a complete technical specification for an AI-powered book recommendation system for Open Library.",
      context: "Open Library (openlibrary.org) hosts metadata for 40 million+ book records.",
    });

    await ctx.db.insert("opportunities", {
      nonprofitId: olfId,
      title: "Accessibility Testing Playbook",
      goal: "Produce a comprehensive, actionable accessibility testing playbook for the Open Library web interface.",
      context: "Open Library currently has no systematic accessibility QA process.",
    });

    const cfaId = await ctx.db.insert("nonprofits", {
      name: "Code for America",
      mission:
        "Using the power of technology to help government work for all people, especially those who need it most.",
      logoEmoji: "🏛️",
    });

    await ctx.db.insert("opportunities", {
      nonprofitId: cfaId,
      title: "Benefits Eligibility Navigator Flow",
      goal: "Design a complete conversational agent flow for a benefits eligibility navigator.",
      context: "CfA's GetCalFresh product demonstrated that well-designed eligibility flows dramatically increase program uptake.",
    });

    await ctx.db.insert("opportunities", {
      nonprofitId: cfaId,
      title: "Court Date SMS Reminder System Spec",
      goal: "Draft a complete technical specification for an SMS-based court date reminder system.",
      context: "Missed court dates are one of the most common causes of bench warrants.",
    });

    await ctx.db.insert("opportunities", {
      nonprofitId: cfaId,
      title: "Civic Tech Volunteer Onboarding Guide",
      goal: "Produce a structured onboarding guide for new Code for America volunteers.",
      context: "CfA has 80+ active projects in various stages.",
    });

    const edfId = await ctx.db.insert("nonprofits", {
      name: "Environmental Defense Fund",
      mission:
        "Protecting the health of the planet and the people who live on it through science, economics, and partnership.",
      logoEmoji: "🌱",
    });

    await ctx.db.insert("opportunities", {
      nonprofitId: edfId,
      title: "Small Business Carbon Tracker Design",
      goal: "Design a user-friendly carbon footprint tracking tool for small businesses with 10–50 employees.",
      context: "Small and medium businesses account for 44% of US GDP but lack affordable carbon accounting tools.",
    });

    await ctx.db.insert("opportunities", {
      nonprofitId: edfId,
      title: "Open Climate Data Dashboard Specification",
      goal: "Produce a detailed technical specification for an open-source climate data visualization dashboard.",
      context: "Climate data is publicly available but fragmented across dozens of agency portals.",
    });

    return { seeded: true, message: "Seeded 3 nonprofits and 7 opportunities" };
  },
});
