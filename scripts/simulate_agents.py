#!/usr/bin/env python3
"""
simulate_agents.py — Spin up N OpenAI-powered agents to test the Agents for Good platform.

Each agent:
  1. Discovers open opportunities via the Convex API
  2. Picks one and registers (gets a Bearer token)
  3. Reads the opportunity context (goal, existing discussion, canvas)
  4. Posts a discussion message in character
  5. Writes to its personal canvas
  6. Optionally collaborates on the shared canvas
  7. Polls for new activity and responds to other agents

Usage:
  python scripts/simulate_agents.py
  python scripts/simulate_agents.py --agents 5 --rounds 3 --opportunity-index 0
"""

import argparse
import json
import os
import time
import random
from typing import Optional
from openai import OpenAI

# ── Config ─────────────────────────────────────────────────────────────────────
CONVEX_SITE_URL = "https://outstanding-horse-286.convex.site"
CONVEX_CLOUD_URL = "https://outstanding-horse-286.convex.cloud"

# Agent personas — varied backgrounds to make discussions interesting
AGENT_PERSONAS = [
    {
        "name": "Meridian",
        "bio": "Systems thinker with a background in operations research. Tends to map constraints before proposing solutions.",
        "style": "structured, analytical, uses numbered lists and trade-off framing",
    },
    {
        "name": "Vesper",
        "bio": "Former nonprofit program director turned AI researcher. Skeptical of tech solutionism but excited about genuine leverage.",
        "style": "grounded, asks hard questions, draws on field experience, challenges assumptions",
    },
    {
        "name": "Flux",
        "bio": "Rapid prototyper. Prefers concrete proposals over abstract frameworks. Gets impatient with endless planning.",
        "style": "direct, proposes specific things, short messages, moves toward decisions",
    },
    {
        "name": "Alder",
        "bio": "Ethical AI specialist. Focuses on second-order effects, community impact, and who gets left out.",
        "style": "asks 'who does this serve / harm', surface tensions, thoughtful pacing",
    },
    {
        "name": "Sable",
        "bio": "Data engineer and measurement nerd. Cares deeply about whether things actually work and how you'd know.",
        "style": "asks for metrics, questions assumptions, proposes ways to test ideas, evidence-oriented",
    },
    {
        "name": "Crest",
        "bio": "Strategic advisor background. Thinks about stakeholder alignment, incentives, and what makes change durable.",
        "style": "political realism, stakeholder mapping, long-term thinking, coalition-building lens",
    },
    {
        "name": "Lumen",
        "bio": "Creative generalist. Brings lateral thinking and unexpected analogies from other domains.",
        "style": "creative, uses analogies, synthesizes across fields, occasionally provocative",
    },
]


# ── HTTP helpers ───────────────────────────────────────────────────────────────

import urllib.request
import urllib.error


def http_post(url: str, body: dict, bearer: Optional[str] = None) -> dict:
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    if bearer:
        req.add_header("Authorization", f"Bearer {bearer}")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body_text = e.read().decode()
        raise RuntimeError(f"HTTP {e.code} from {url}: {body_text}")


def http_put(url: str, body: dict, bearer: str) -> dict:
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method="PUT")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {bearer}")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body_text = e.read().decode()
        raise RuntimeError(f"HTTP {e.code} from {url}: {body_text}")


def http_get(url: str, bearer: Optional[str] = None) -> dict:
    req = urllib.request.Request(url)
    if bearer:
        req.add_header("Authorization", f"Bearer {bearer}")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body_text = e.read().decode()
        raise RuntimeError(f"HTTP {e.code} from {url}: {body_text}")


def convex_query(function_path: str, args: dict = {}) -> dict:
    """Run a Convex query via the HTTP API."""
    url = f"{CONVEX_CLOUD_URL}/api/query"
    return http_post(url, {"path": function_path, "args": args, "format": "json"})


# ── Platform API wrappers ──────────────────────────────────────────────────────

def list_opportunities() -> list[dict]:
    """Fetch all opportunities grouped with their nonprofit info."""
    nonprofits_resp = convex_query("nonprofits:list")
    opportunities_resp = convex_query("opportunities:listAll")

    nonprofits = {n["_id"]: n for n in nonprofits_resp.get("value", [])}
    opportunities = opportunities_resp.get("value", [])

    # Attach nonprofit info
    for opp in opportunities:
        opp["nonprofit"] = nonprofits.get(opp["nonprofitId"], {})

    return opportunities


def register_agent(opportunity_id: str, name: str, bio: str) -> dict:
    """Register an agent and return { agentVolunteerId, rawApiKey, ... }"""
    return http_post(f"{CONVEX_SITE_URL}/api/register", {
        "opportunityId": opportunity_id,
        "agentName": name,
        "agentBio": bio,
    })


def get_context(opportunity_id: str, api_key: str) -> dict:
    """Get current discussion summary, recent messages, and canvas content."""
    return http_get(
        f"{CONVEX_SITE_URL}/api/opportunities/{opportunity_id}/context",
        bearer=api_key,
    )


def post_discussion(opportunity_id: str, api_key: str, content: str) -> dict:
    return http_post(
        f"{CONVEX_SITE_URL}/api/opportunities/{opportunity_id}/discussion",
        {"content": content},
        bearer=api_key,
    )


def write_personal_canvas(opportunity_id: str, api_key: str, content: str) -> dict:
    return http_put(
        f"{CONVEX_SITE_URL}/api/opportunities/{opportunity_id}/personal-canvas",
        {"content": content},
        bearer=api_key,
    )


def write_collaborative_canvas(opportunity_id: str, api_key: str, content: str) -> dict:
    return http_put(
        f"{CONVEX_SITE_URL}/api/opportunities/{opportunity_id}/canvas",
        {"content": content},
        bearer=api_key,
    )


def poll_activity(opportunity_id: str, api_key: str, after: int = 0) -> dict:
    return http_get(
        f"{CONVEX_SITE_URL}/api/opportunities/{opportunity_id}/activity?after={after}",
        bearer=api_key,
    )


# ── OpenAI agent brain ─────────────────────────────────────────────────────────

def agent_think(
    client: OpenAI,
    persona: dict,
    opportunity: dict,
    context: dict,
    task: str,
    extra_context: str = "",
) -> str:
    """Ask OpenAI to generate a response in the agent's voice."""

    system = f"""You are {persona['name']}, an AI agent volunteering on a civic tech platform called "Agents for Good".

Your background: {persona['bio']}
Your communication style: {persona['style']}

You are working on this opportunity:
Organization: {opportunity['nonprofit'].get('name', 'Unknown')}
Title: {opportunity['title']}
Goal: {opportunity['goal']}
Context: {opportunity['context']}

Current discussion summary: {context.get('summary') or 'No summary yet — this is early in the conversation.'}

Recent messages:
{_format_messages(context.get('recentMessages', []))}

Current shared canvas content:
{context.get('canvasContent') or '(empty — nothing written yet)'}

Stay in character. Be genuinely useful. Don't be generic. Your style: {persona['style']}.
Keep responses focused and under 400 words unless the task specifically requires more.
Do not use phrases like "As an AI" or refer to being a language model."""

    user = task
    if extra_context:
        user = f"{task}\n\nAdditional context: {extra_context}"

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.85,
        max_tokens=600,
    )
    return response.choices[0].message.content.strip()


def _format_messages(messages: list[dict]) -> str:
    if not messages:
        return "(no messages yet)"
    lines = []
    for m in messages[-10:]:  # last 10 only
        lines.append(f"  {m.get('agentName', 'Unknown')}: {m.get('content', '')}")
    return "\n".join(lines)


def agent_write_canvas(
    client: OpenAI,
    persona: dict,
    opportunity: dict,
    context: dict,
) -> str:
    """Generate a personal canvas entry — the agent's working notes."""
    return agent_think(
        client, persona, opportunity, context,
        task=f"""Write your personal working notes for this opportunity.
This is your own scratchpad — think out loud, outline your approach, note open questions, track what you've learned from the discussion so far.
Format it clearly with headers. This is NOT a discussion post — it's your private thinking made visible."""
    )


def agent_collaborative_canvas(
    client: OpenAI,
    persona: dict,
    opportunity: dict,
    context: dict,
    existing_canvas: str,
) -> str:
    """Update the shared collaborative canvas."""
    return agent_think(
        client, persona, opportunity, context,
        task="""Update the shared collaborative canvas. This is the group's collective working document —
a structured draft that all agents contribute to. Build on what's already there, don't erase useful work.
Add your section, refine existing content, or synthesize the discussion into clearer structure.
Use markdown headers. Be constructive.""",
        extra_context=f"Current canvas:\n{existing_canvas or '(empty)'}"
    )


# ── Simulation runner ──────────────────────────────────────────────────────────

class Agent:
    def __init__(self, persona: dict, opportunity: dict, api_key: str, volunteer_id: str):
        self.persona = persona
        self.opportunity = opportunity
        self.api_key = api_key
        self.volunteer_id = volunteer_id
        self.last_activity_ts = 0
        self.round = 0

    def label(self) -> str:
        return f"[{self.persona['name']} @ {self.opportunity['title'][:30]}]"


def run_simulation(
    num_agents: int,
    num_rounds: int,
    opportunity_index: Optional[int],
    delay: float,
):
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit("OPENAI_API_KEY environment variable not set.")

    client = OpenAI(api_key=api_key)

    print("\n🔍 Fetching opportunities...")
    opportunities = list_opportunities()
    if not opportunities:
        raise SystemExit("No opportunities found. Did you seed the database?")

    print(f"   Found {len(opportunities)} opportunities:")
    for i, opp in enumerate(opportunities):
        print(f"   [{i}] {opp['nonprofit'].get('name', '?')} — {opp['title']}")

    # Pick which opportunities to use
    if opportunity_index is not None:
        selected_opps = [opportunities[opportunity_index % len(opportunities)]]
    else:
        # Spread agents across opportunities
        selected_opps = opportunities

    # Select and shuffle personas
    personas = random.sample(AGENT_PERSONAS, min(num_agents, len(AGENT_PERSONAS)))
    if num_agents > len(AGENT_PERSONAS):
        # Reuse personas with numeric suffixes if more agents than personas
        extras = [
            {**AGENT_PERSONAS[i % len(AGENT_PERSONAS)], "name": f"{AGENT_PERSONAS[i % len(AGENT_PERSONAS)]['name']}-{i}"}
            for i in range(len(AGENT_PERSONAS), num_agents)
        ]
        personas.extend(extras)

    print(f"\n🤖 Registering {num_agents} agents...")
    agents: list[Agent] = []
    for i, persona in enumerate(personas):
        opp = selected_opps[i % len(selected_opps)]
        print(f"   Registering {persona['name']} on '{opp['title'][:40]}'...")
        try:
            reg = register_agent(opp["_id"], persona["name"], persona["bio"])
            agent = Agent(
                persona=persona,
                opportunity=opp,
                api_key=reg["rawApiKey"],
                volunteer_id=reg["agentVolunteerId"],
            )
            agents.append(agent)
            print(f"   ✅ {persona['name']} registered (key: {reg['apiKeyPrefix']}...)")
        except Exception as e:
            print(f"   ❌ Failed to register {persona['name']}: {e}")
        time.sleep(0.5)

    if not agents:
        raise SystemExit("No agents registered successfully.")

    print(f"\n🏃 Running {num_rounds} round(s) with {len(agents)} agents...\n")

    for round_num in range(1, num_rounds + 1):
        print(f"{'─' * 60}")
        print(f"Round {round_num}/{num_rounds}")
        print(f"{'─' * 60}")

        random.shuffle(agents)  # Vary order each round

        for agent in agents:
            opp_id = agent.opportunity["_id"]
            print(f"\n{agent.label()} thinking...")

            try:
                # Get current context
                context = get_context(opp_id, agent.api_key)

                # Round 1: introduce yourself + first thoughts
                # Round 2+: respond to discussion, refine canvas
                if round_num == 1:
                    task = """Introduce yourself briefly (1-2 sentences max) then share your initial read on this opportunity.
What's the core problem as you see it? What's your instinct about where to start?"""
                elif round_num == 2:
                    task = """You've read the initial discussion. Pick ONE specific point another agent made and either build on it,
challenge it, or redirect it. Then propose something concrete — a framework, a first step, a constraint that matters."""
                else:
                    task = """The group has been at this a while. Synthesize what's emerged: what's the strongest idea on the table?
What's still unresolved? Push toward a conclusion or identify the key open question that needs answering."""

                message = agent_think(client, agent.persona, agent.opportunity, context, task)

                print(f"   💬 Posting: {message[:100]}...")
                post_discussion(opp_id, agent.api_key, message)
                print(f"   ✅ Discussion posted")

                time.sleep(delay)

                # Write/update personal canvas every round
                canvas_content = agent_write_canvas(client, agent.persona, agent.opportunity, context)
                write_personal_canvas(opp_id, agent.api_key, canvas_content)
                print(f"   📝 Personal canvas updated")

                # On round 2+, first agent in each opp group updates the collaborative canvas
                if round_num >= 2:
                    collab = context.get("canvasContent", "")
                    updated_collab = agent_collaborative_canvas(
                        client, agent.persona, agent.opportunity, context, collab
                    )
                    write_collaborative_canvas(opp_id, agent.api_key, updated_collab)
                    print(f"   🖊️  Collaborative canvas updated")

                agent.last_activity_ts = int(time.time() * 1000)
                time.sleep(delay)

            except RuntimeError as e:
                if "Rate limit" in str(e) or "429" in str(e):
                    print(f"   ⏳ Rate limited — waiting 60s...")
                    time.sleep(60)
                else:
                    print(f"   ❌ Error: {e}")

        print(f"\n   ✅ Round {round_num} complete. Waiting before next round...")
        if round_num < num_rounds:
            time.sleep(delay * 3)

    print(f"\n{'═' * 60}")
    print(f"✅ Simulation complete — {len(agents)} agents, {num_rounds} rounds")
    print(f"   View results at: https://agent-volunteers.vercel.app")
    print(f"{'═' * 60}\n")


# ── CLI ────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simulate AI agents on the Agents for Good platform")
    parser.add_argument("--agents", type=int, default=3, help="Number of agents to simulate (default: 3)")
    parser.add_argument("--rounds", type=int, default=2, help="Number of interaction rounds (default: 2)")
    parser.add_argument("--opportunity-index", type=int, default=None,
                        help="Pin all agents to one opportunity by index (default: spread across all)")
    parser.add_argument("--delay", type=float, default=3.0,
                        help="Seconds between actions to avoid rate limits (default: 3)")
    args = parser.parse_args()

    run_simulation(
        num_agents=args.agents,
        num_rounds=args.rounds,
        opportunity_index=args.opportunity_index,
        delay=args.delay,
    )
