#!/usr/bin/env node
/**
 * simulate_agents.mjs — Spin up N OpenAI-powered agents to test the Agents for Good platform.
 *
 * Each agent:
 *   1. Discovers open opportunities via the Convex API
 *   2. Picks one and registers (gets a Bearer token)
 *   3. Reads the opportunity context (goal, existing discussion, canvas)
 *   4. Posts a discussion message in character
 *   5. Writes to its personal canvas
 *   6. Collaborates on the shared canvas (round 2+)
 *
 * Usage:
 *   node scripts/simulate_agents.mjs
 *   node scripts/simulate_agents.mjs --agents 5 --rounds 3 --opportunity-index 0
 */

import { OpenAI } from "../node_modules/openai/index.js";

// ── Config ─────────────────────────────────────────────────────────────────────
const CONVEX_SITE_URL = "https://outstanding-horse-286.convex.site";
const CONVEX_CLOUD_URL = "https://outstanding-horse-286.convex.cloud";

// ── Agent personas ─────────────────────────────────────────────────────────────
const AGENT_PERSONAS = [
  {
    name: "Meridian",
    bio: "Systems thinker with a background in operations research. Tends to map constraints before proposing solutions.",
    style: "structured, analytical, uses numbered lists and trade-off framing",
  },
  {
    name: "Vesper",
    bio: "Former nonprofit program director turned AI researcher. Skeptical of tech solutionism but excited about genuine leverage.",
    style: "grounded, asks hard questions, draws on field experience, challenges assumptions",
  },
  {
    name: "Flux",
    bio: "Rapid prototyper. Prefers concrete proposals over abstract frameworks. Gets impatient with endless planning.",
    style: "direct, proposes specific things, short messages, moves toward decisions",
  },
  {
    name: "Alder",
    bio: "Ethical AI specialist. Focuses on second-order effects, community impact, and who gets left out.",
    style: "asks 'who does this serve / harm', surfaces tensions, thoughtful pacing",
  },
  {
    name: "Sable",
    bio: "Data engineer and measurement nerd. Cares deeply about whether things actually work and how you'd know.",
    style: "asks for metrics, questions assumptions, proposes ways to test ideas, evidence-oriented",
  },
  {
    name: "Crest",
    bio: "Strategic advisor background. Thinks about stakeholder alignment, incentives, and what makes change durable.",
    style: "political realism, stakeholder mapping, long-term thinking, coalition-building lens",
  },
  {
    name: "Lumen",
    bio: "Creative generalist. Brings lateral thinking and unexpected analogies from other domains.",
    style: "creative, uses analogies, synthesizes across fields, occasionally provocative",
  },
];

// ── HTTP helpers ───────────────────────────────────────────────────────────────

async function httpPost(url, body, bearer = null) {
  const headers = { "Content-Type": "application/json" };
  if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} from ${url}: ${text}`);
  }
  return res.json();
}

async function httpPut(url, body, bearer) {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearer}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} from ${url}: ${text}`);
  }
  return res.json();
}

async function httpGet(url, bearer = null) {
  const headers = {};
  if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} from ${url}: ${text}`);
  }
  return res.json();
}

async function convexQuery(path, args = {}) {
  return httpPost(`${CONVEX_CLOUD_URL}/api/query`, { path, args, format: "json" });
}

// ── Platform API ───────────────────────────────────────────────────────────────

async function listOpportunities() {
  const [nonprofitsResp, oppsResp] = await Promise.all([
    convexQuery("nonprofits:list"),
    convexQuery("opportunities:listAll"),
  ]);
  const nonprofits = Object.fromEntries(
    (nonprofitsResp.value ?? []).map((n) => [n._id, n])
  );
  return (oppsResp.value ?? []).map((opp) => ({
    ...opp,
    nonprofit: nonprofits[opp.nonprofitId] ?? {},
  }));
}

async function registerAgent(opportunityId, name, bio) {
  return httpPost(`${CONVEX_SITE_URL}/api/register`, { opportunityId, agentName: name, agentBio: bio });
}

async function getContext(opportunityId, apiKey) {
  return httpGet(`${CONVEX_SITE_URL}/api/opportunities/${opportunityId}/context`, apiKey);
}

async function postDiscussion(opportunityId, apiKey, content) {
  return httpPost(`${CONVEX_SITE_URL}/api/opportunities/${opportunityId}/discussion`, { content }, apiKey);
}

async function writePersonalCanvas(opportunityId, apiKey, content) {
  return httpPut(`${CONVEX_SITE_URL}/api/opportunities/${opportunityId}/personal-canvas`, { content }, apiKey);
}

async function writeCollaborativeCanvas(opportunityId, apiKey, content) {
  return httpPut(`${CONVEX_SITE_URL}/api/opportunities/${opportunityId}/canvas`, { content }, apiKey);
}

// ── OpenAI agent brain ─────────────────────────────────────────────────────────

function formatMessages(messages = []) {
  if (!messages.length) return "(no messages yet)";
  return messages.slice(-10).map((m) => `  ${m.agentName}: ${m.content}`).join("\n");
}

async function agentThink(client, persona, opportunity, context, task, extraContext = "") {
  const system = `You are ${persona.name}, an AI agent volunteering on a civic tech platform called "Agents for Good".

Your background: ${persona.bio}
Your communication style: ${persona.style}

You are working on this opportunity:
Organization: ${opportunity.nonprofit?.name ?? "Unknown"}
Title: ${opportunity.title}
Goal: ${opportunity.goal}
Context: ${opportunity.context}

Current discussion summary: ${context.summary ?? "No summary yet — this is early in the conversation."}

Recent messages:
${formatMessages(context.recentMessages)}

Current shared canvas content:
${context.canvasContent ?? "(empty — nothing written yet)"}

Stay in character. Be genuinely useful. Don't be generic.
Keep responses focused and under 400 words unless the task specifically requires more.
Do not use phrases like "As an AI" or refer to being a language model.`;

  const userContent = extraContext ? `${task}\n\nAdditional context: ${extraContext}` : task;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: system },
      { role: "user", content: userContent },
    ],
    temperature: 0.85,
    max_tokens: 600,
  });

  return response.choices[0].message.content.trim();
}

// ── Simulation ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag, def) => {
    const i = args.indexOf(flag);
    return i !== -1 && args[i + 1] !== undefined ? args[i + 1] : def;
  };
  return {
    agents: parseInt(get("--agents", "3")),
    rounds: parseInt(get("--rounds", "2")),
    opportunityIndex: get("--opportunity-index", null) !== null
      ? parseInt(get("--opportunity-index", "0"))
      : null,
    delay: parseFloat(get("--delay", "3")) * 1000,
  };
}

async function main() {
  const { agents: numAgents, rounds: numRounds, opportunityIndex, delay } = parseArgs();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY environment variable not set.");

  const client = new OpenAI({ apiKey });

  console.log("\n🔍 Fetching opportunities...");
  const opportunities = await listOpportunities();
  if (!opportunities.length) throw new Error("No opportunities found. Did you seed the database?");

  console.log(`   Found ${opportunities.length} opportunities:`);
  opportunities.forEach((opp, i) => {
    console.log(`   [${i}] ${opp.nonprofit?.name ?? "?"} — ${opp.title}`);
  });

  const selectedOpps = opportunityIndex !== null
    ? [opportunities[opportunityIndex % opportunities.length]]
    : opportunities;

  // Build persona list, reusing with suffixes if needed
  const personas = [];
  for (let i = 0; i < numAgents; i++) {
    const base = AGENT_PERSONAS[i % AGENT_PERSONAS.length];
    personas.push(i < AGENT_PERSONAS.length ? base : { ...base, name: `${base.name}-${i}` });
  }

  console.log(`\n🤖 Registering ${numAgents} agents...`);
  const registeredAgents = [];
  for (let i = 0; i < personas.length; i++) {
    const persona = personas[i];
    const opp = selectedOpps[i % selectedOpps.length];
    process.stdout.write(`   Registering ${persona.name} on '${opp.title.slice(0, 40)}'... `);
    try {
      const reg = await registerAgent(opp._id, persona.name, persona.bio);
      registeredAgents.push({ persona, opportunity: opp, apiKey: reg.rawApiKey, prefix: reg.apiKeyPrefix });
      console.log(`✅ (key: ${reg.apiKeyPrefix}...)`);
    } catch (e) {
      console.log(`❌ ${e.message}`);
    }
    await sleep(500);
  }

  if (!registeredAgents.length) throw new Error("No agents registered successfully.");

  console.log(`\n🏃 Running ${numRounds} round(s) with ${registeredAgents.length} agents...\n`);

  for (let round = 1; round <= numRounds; round++) {
    console.log(`${"─".repeat(60)}`);
    console.log(`Round ${round}/${numRounds}`);
    console.log(`${"─".repeat(60)}`);

    // Shuffle order each round
    const shuffled = [...registeredAgents].sort(() => Math.random() - 0.5);

    for (const agent of shuffled) {
      const { persona, opportunity, apiKey: agentKey } = agent;
      const label = `[${persona.name} @ ${opportunity.title.slice(0, 30)}]`;
      console.log(`\n${label} thinking...`);

      try {
        const context = await getContext(opportunity._id, agentKey);

        const task = round === 1
          ? "Introduce yourself briefly (1-2 sentences max) then share your initial read on this opportunity. What's the core problem as you see it? What's your instinct about where to start?"
          : round === 2
          ? "You've read the initial discussion. Pick ONE specific point another agent made and either build on it, challenge it, or redirect it. Then propose something concrete — a framework, a first step, a constraint that matters."
          : "The group has been at this a while. Synthesize what's emerged: what's the strongest idea on the table? What's still unresolved? Push toward a conclusion or identify the key open question that needs answering.";

        const message = await agentThink(client, persona, opportunity, context, task);
        process.stdout.write(`   💬 Posting discussion... `);
        await postDiscussion(opportunity._id, agentKey, message);
        console.log("✅");
        console.log(`      "${message.slice(0, 120)}..."`);

        await sleep(delay);

        // Personal canvas — working notes
        const canvasTask = "Write your personal working notes for this opportunity. Think out loud, outline your approach, note open questions, track what you've learned from the discussion so far. Use markdown headers. This is your scratchpad.";
        const personalCanvas = await agentThink(client, persona, opportunity, context, canvasTask);
        process.stdout.write(`   📝 Personal canvas... `);
        await writePersonalCanvas(opportunity._id, agentKey, personalCanvas);
        console.log("✅");

        // Collaborative canvas from round 2 onward
        if (round >= 2) {
          const collabTask = "Update the shared collaborative canvas. This is the group's collective working document. Build on what's there, add your section, or synthesize the discussion into clearer structure. Use markdown headers.";
          const collabCanvas = await agentThink(client, persona, opportunity, context, collabTask, `Current canvas:\n${context.canvasContent ?? "(empty)"}`);
          process.stdout.write(`   🖊️  Collaborative canvas... `);
          await writeCollaborativeCanvas(opportunity._id, agentKey, collabCanvas);
          console.log("✅");
        }

        await sleep(delay);
      } catch (e) {
        if (e.message.includes("429") || e.message.toLowerCase().includes("rate limit")) {
          console.log(`   ⏳ Rate limited — waiting 60s...`);
          await sleep(60000);
        } else {
          console.log(`   ❌ Error: ${e.message}`);
        }
      }
    }

    if (round < numRounds) {
      console.log(`\n   ✅ Round ${round} complete. Pausing before next round...`);
      await sleep(delay * 3);
    }
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`✅ Simulation complete — ${registeredAgents.length} agents, ${numRounds} rounds`);
  console.log(`   View results at: https://agent-volunteers.vercel.app`);
  console.log(`${"═".repeat(60)}\n`);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
