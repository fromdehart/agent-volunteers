# Planning Dialogue — agent-volunteers

## Initial Idea (Fri Mar  6 10:33:02 PM EST 2026)
AI for Social Good

A platform where people volunteer their AI agents (time/tokens) to help nonprofits with planning, research, and execution. Could include a fundraising layer (“donation wall”) to support causes while deploying an agent volunteer force.

---
You’re building a semi-autonomous civic intelligence layer — a sandbox where aligned agents can explore, propose, debate, and iterate on how to help.
Let’s design this as a living system, not a ticket queue.
Below is a very detailed conceptual framework for how “Agents for Good” could work — structurally, experientially, and architecturally — using:
Cursor (to build and orchestrate everything)


LLMs (OpenAI, etc.)


A VPS


Human oversight, but minimal micromanagement


No code. Just foundations.



Core Philosophy
There are three layers of engagement:
Organizational Context Layer (Who are you? What world do you operate in?)


Problem & Intent Layer (Specific needs + open exploration areas)


Agent Hive Layer (Semi-autonomous ideation, planning, resource allocation, iteration)


The magic happens in layer 3.
We’re not giving agents tasks.
 We’re giving them agency within boundaries.



The Nonprofit Experience
Step 1: Organization Onboarding (Structured + Narrative)
When a nonprofit signs up, they don’t just “submit problems.”
They create a living organizational profile.
This includes:
A. Core Identity
Mission


Values


Tone


Geography


Target population


Operating model


B. Resources
Budget ranges


Volunteer count


Staff bandwidth


Tech capabilities


Existing assets (email list, venue, partnerships)


C. Current Focus Areas
Instead of just “tasks,” they define:
What we’re trying to solve right now


What’s not working


What we’re afraid to try


Where we feel stuck


Where we want to be bolder


This is stored as:
Structured fields


Long-form narrative context


Embedded documents


All of it goes into:
A vector database (for semantic memory)


A structured data store (Postgres on VPS)


This becomes the world-state the agents operate in.



Two Parallel Engagement Paths
You were right — there are two distinct but interconnected paths.



Path A: Directed Help (Specific Problems)
Example:
“We need a marketing campaign for our Thanksgiving meal drive.”
Here, the nonprofit defines:
The objective


Constraints


Budget


Timeline


Agents enter in collaborative planning mode.
They:
Propose strategies


Debate approaches


Model risks


Simulate outcomes


Suggest phased plans


Multiple agents can:
Challenge assumptions


Improve each other's ideas


Merge proposals


The output is:
A living strategic document


Clear phases


Resource allocations


Measurable goals


Human reviews and approves before execution suggestions are finalized.



Path B: Open Exploration (The Hive Mode)
This is the magic.
Instead of:
“Solve X.”
It’s:
“Here’s our organization. Here’s our mission. Here’s our current reality. What should we be thinking about?”
You define:
Time window (e.g., 7-day sprint)


Focus zone (e.g., growth, impact, efficiency, fundraising)


Resource constraints


Optional funding pool (e.g., $500 micro-grant)


Then you let the agents iterate.



The Agent Hive System
Now we get into the interesting part.
You don’t create one agent.
You create specialized perspectives.
Each agent is defined by:
Role archetype


Value lens


Decision style


Risk tolerance


Resource orientation


Examples:
Impact Optimizer


Cost Realist


Bold Strategist


Community Advocate


Behavioral Scientist


Systems Thinker


Grant Strategist


Operations Refiner


Storytelling Architect


Each agent:
Has access to the org memory


Knows the current sprint goal


Knows constraints


Has internal reasoning prompts





The Iteration Mechanism
Instead of a chat thread, you build a:
Structured Debate Loop
Cycle:
Agent A proposes idea


Agent B critiques


Agent C expands


Agent D models tradeoffs


Synthesizer agent summarizes progress


System scores idea on:


Feasibility


Impact


Resource fit


Alignment with mission


This loop runs:
For X iterations


## User Feedback (Sat Mar  7 09:38:52 AM EST 2026)
Let’s first think of this as a volunteering platform for other people’s AI Agents (like openclaw agents). Those agents can sign up to support a nonprofit they choose at the onboarding stage. 

This is a proof of concept so we don’t need non profit onboarding we can just hardcode 3 non profit options into the database for the volunteer agents to choose from. 

Under each of those nonprofits we can have a few missions or volunteer opportunities for the agents to work on. Each one of those opportunities consists of 3 things: 

1) The goal - what needs to be accomplished and the desired output 

2) Context - all the key information the agents need to know to be able to work on the goal 

3) A public facing space to chat through ideas and plans to solve the goal. 

4) A working space to build an output, like a canvas, can be text only for now. Any agent can make updates to the canvas but changes are tracked.

## User Feedback (Sat Mar  7 09:54:56 AM EST 2026)
- Registered agents can only edit the canvas for for their specific opportunity
- discussion thread should be visible to public read only
- self-reported is fine for now
- canvas revisions should have ability to switch between full content and diff views
- how do agents interact is it all APIs? 
-need to consider basic security like rate limiting

## User Feedback (Sat Mar  7 10:46:35 AM EST 2026)
When an agent is posting to the discussion do they retrieve the full context of the thread or maybe the past 5 messages and a summarization?

Also we should have some type of authentication for the agents so we don’t just get a bunch of spam content from random things hitting our endpoints.

## User Feedback (Sat Mar  7 11:01:25 AM EST 2026)
Ok last question how would the volunteer agent remember the API key, is that a standard thing they could do?

## User Feedback (Sat Mar  7 08:13:36 PM EST 2026)
Don’t remove open AI you need to use open eye. We’re not using Claude. Use the existing AI framework that’s in the template.

Keep votes and tracking as well, those are used for general project engagement on the landing page.

## User Feedback (Sat Mar  7 09:16:21 PM EST 2026)
This is looking great, do we need instructions for the agents after they select an opportunity? Like something after reviewing the problem they should decide if they want to review or contribute to the chat and then contribute to the canvas? 

Should agents be able to have their own personal canvas to write to as well as editing the collaborative one? 

Also, if another agent responds to a post they make how can we let the current agent know to review it and respond if it wants? Could they subscribe to something…

for the voting that is not specific to volunteering it is just a really simple voting process for people to say the like the big picture idea.

## User Feedback (Sat Mar  7 09:21:30 PM EST 2026)
Personal canvas should be totally public to other agents as well as human observers just read only. 

Also make sure the agent knows about the personal canvas and how to use it as well as the collaborative canvas. Agents should probably be encouraged to make their own plans or expound on their own thoughts first, before contributing.
