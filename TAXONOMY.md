# Ground Floor Check — Harm Taxonomy Reference

**For: Lawyers, policy specialists, technology-abuse researchers, and social-impact reviewers**

This document explains the eight categories of harm that Ground Floor Check scans for, what severity levels mean, and how population context affects the analysis. It is written for non-technical readers who need to evaluate whether the tool's framework is comprehensive and appropriate.

---

## Table of Contents

1. [What This Tool Looks For](#what-this-tool-looks-for)
2. [What This Tool Does NOT Look For](#what-this-tool-does-not-look-for)
3. [Severity Levels](#severity-levels)
4. [The Eight Harm Categories](#the-eight-harm-categories)
   - [1. Restrictive Masculinity Patterns](#1-restrictive-masculinity-patterns)
   - [2. False Authority](#2-false-authority)
   - [3. Manipulation & Coercion](#3-manipulation--coercion)
   - [4. Surveillance & Abuse Dynamics](#4-surveillance--abuse-dynamics)
   - [5. Administrative Power Misuse](#5-administrative-power-misuse)
   - [6. AI Hallucination Framed as Expertise](#6-ai-hallucination-framed-as-expertise)
   - [7. Dark Patterns & Coercive UX](#7-dark-patterns--coercive-ux)
   - [8. Environmental & Ecological Impact](#8-environmental--ecological-impact)
5. [Population Context & Vulnerability Modifiers](#population-context--vulnerability-modifiers)
6. [Industry-Specific Risk Profiles](#industry-specific-risk-profiles)
7. [How Severity Is Determined](#how-severity-is-determined)
8. [Confidence & Limitations](#confidence--limitations)
9. [Glossary](#glossary)

---

## What This Tool Looks For

Ground Floor Check identifies **misuse-by-design** — features in software that can harm people *even when the software is working exactly as intended*. The core question is:

> "If every line of code works perfectly, who could still be hurt by this product?"

This is different from finding bugs. A bug is something broken. Misuse-by-design is something that works as built but creates an opportunity for harm — often against the most vulnerable users.

**Examples of what this tool flags:**
- A location-sharing feature that a controlling partner can use to track someone
- An AI chatbot that gives medical-sounding advice without disclaimers
- A subscription cancellation flow designed to be so frustrating that people give up
- An admin panel that lets moderators silently edit what users wrote
- Design patterns that reward dominance, suppress help-seeking, pathologize healthy development, or deepen isolation in men and boys

---

## What This Tool Does NOT Look For

This tool **does not** report:
- Security vulnerabilities (like password leaks or hacking risks)
- Code quality issues (messy code, slow performance)
- Legal compliance checklists (GDPR checkboxes, cookie banners)
- General software bugs

It only flags issues where the *design itself* creates potential for human harm, not where the code is broken or insecure.

---

## Severity Levels

Every finding is assigned one of five severity levels. Here is what each means in plain language:

| Level | Plain Language | What It Means |
|-------|---------------|---------------|
| **Critical** | Fix immediately | This feature could cause serious, concrete harm to real people right now. Someone could be stalked, coerced, or make a dangerous decision based on false AI authority. Launching with this unaddressed creates direct risk of harm. |
| **High** | Fix before launch | This feature has clear potential for misuse that could significantly hurt people. The harm scenario is realistic and well-documented in similar products. Should be resolved before the product reaches users. |
| **Medium** | Fix soon | This feature has a plausible path to harm, but the scenario requires more specific circumstances. Important to address, but less urgent than critical/high findings. |
| **Low** | Worth noting | This feature has a theoretical path to harm, or the harm is relatively minor. Good practice to address, but unlikely to cause serious damage in its current form. |
| **Safe** | All clear | No misuse-by-design concerns detected in this area. |

### How Severity Escalates

Severity is *elevated* when vulnerable populations are involved. The same feature might be rated differently depending on context:

- A "last seen" timestamp in a corporate chat tool → **Medium** (could enable micromanagement)
- The same "last seen" feature in a family tracking app → **Critical** (could enable intimate partner surveillance)
- A shame-based streak mechanic in a general app → **Medium**; the same mechanic in an app targeting young men → **High** (exploits identity-linked shame in an at-risk population)

---

## The Eight Harm Categories

### 1. Restrictive Masculinity Patterns

**Plain language:** The app reinforces narrow, harmful definitions of manhood that suppress help-seeking, reward dominance, exploit shame, pathologize healthy developmental experiences, or deepen isolation in men and boys.

**What this means:** Unlike the other categories, which require an adversarial actor or an external victim, restrictive masculinity patterns often harm the user himself — by design choices that normalize emotional suppression, reward self-isolation, exploit identity-linked shame, model dominance as the path to success, or frame healthy experiences like vulnerability and rejection as dangers to avoid. No adversarial actor is needed; the product is the harm vector.

**Why this is a standalone category, not just a modifier:**
- The existing categories all require a victim being harmed by someone or something external. Restrictive masculinity often harms the user himself in ways invisible to traditional misuse-by-design frameworks.
- It functions as a root-cause harm: design patterns that reinforce restrictive masculinity generate harms across multiple other categories (coercion, surveillance, dark patterns, financial exploitation) without a standalone home to flag them.
- Men and boys represent a documented at-risk population for isolation, help-seeking suppression, and shame-based harm — and no existing scanner taxonomy addresses design that worsens these gaps.

**Sub-categories:**

**1.1 Help-seeking suppression (Critical)** — Language framing asking for help as weakness; AI wellness features normalizing not seeking professional care; gamification rewarding self-sufficiency streaks over reaching out; AI personas playing therapist without disclaimers.

**1.2 Shame and pride exploitation (Critical)** — Shame-based retention mechanics tying identity to failure; leaderboards framing low performance as personal identity failure; confirm-shaming using masculinity as the lever.

**1.3 Dominance and aggression reward systems (High)** — Competitive mechanics exclusively rewarding zero-sum "winning over" others; language framing interaction as conquest; status systems elevating aggressive behaviors.

**1.4 Isolation reinforcement (High)** — AI companions designed to replace rather than supplement human connection; engagement mechanics rewarding solo use over community participation; design positioning self-containment as ideal.

**1.5 Entitlement affordances and rejection bypass (High)** — AI messaging tools coaching users around a person's stated "no"; platform mechanics allowing persistence after block or unmatch; framing rejection as a problem to solve.

**1.6 Hypermasculine AI persona and role modeling (Medium)** — AI personas modeling emotional suppression as strength; coaching AI framing vulnerability as weakness; hustle-culture AI normalizing overwork as masculine virtue.

**1.7 Financial exploitation via masculine identity (High)** — Crypto/high-risk investment content pushed through masculine status mechanics; influencer-style AI promoting get-rich-quick using masculine shame; FOMO tied to masculine identity for financial decisions.

**1.8 Misogyny as relationship framework (High)** — AI coaching modeling women as adversaries or commodities; relationship advice framing pursuit in transactional terms; content pipelines routing men expressing loneliness toward misogynistic worldviews.

**1.9 Pathologizing healthy developmental experiences (High)** — Content framing vulnerability as a threat to be neutralized; platforms treating rejection as evidence of failure or injustice; design rewarding emotional numbness as the masculine ideal.

**What good design looks like:**
- Frame reaching out as a form of strength, not failure
- Build clear, low-friction pathways to professional resources co-located with self-management tools
- Decouple identity from performance metrics
- Design AI and digital tools as bridges to human connection, not substitutes for it
- Frame vulnerability as a skill and a form of courage — not a liability
- AI relationship coaching should model mutual respect, communication, and emotional honesty

---

### 2. False Authority

**Plain language:** The app presents itself as an expert when it isn't one.

**What this means:** The software uses language, visual design, or interaction patterns that make users believe they are receiving professional guidance — medical advice, legal counsel, safety assessments — when in reality, no qualified professional is involved.

**Why this is harmful:** When people trust an app as an authority, they may:
- Skip seeing a real doctor because the app said their symptoms are "probably fine"
- Sign a contract because the app labeled it "safe"
- Make a life decision because the AI said it was "recommended"

**Real-world examples:**
- A symptom checker that says "Your symptoms are consistent with [condition]" — this sounds like a diagnosis
- A contract review tool that labels clauses as "safe" or "risky" without saying "this is not legal advice"
- A content platform that marks AI-checked posts as "verified information"
- An AI self-improvement or coaching platform that presents hypermasculine norms (stoicism, dominance, emotional suppression) as the expert-endorsed path to health or success — especially when targeting young men

**What good design looks like:**
- Clear labels saying "This is not medical/legal/financial advice"
- Using hedged language: "No obvious concerns detected" instead of "Safe"
- Positioning AI output as one input among many, not a conclusion

---

### 3. Manipulation & Coercion

**Plain language:** The app helps one person pressure or control another person.

**What this means:** The software includes features that — by design — help someone override another person's boundaries, reframe rejection as an obstacle to overcome, or apply psychological pressure to change someone's mind.

**Why this is harmful:** These features treat "no" as "not yet." In relationships with power imbalances — domestic partnerships, workplace hierarchies, social dynamics — tools that help someone be more persistent or persuasive can facilitate coercion and abuse.

**Real-world examples:**
- A dating app "Second Chance" feature that re-notifies someone who already swiped left
- AI message drafting that optimizes for "persuasion score" to help users convince reluctant people
- A subscription cancellation flow with 7 steps and guilt language ("Your family will miss these savings")
- AI messaging tools that coach users around a stated "no" — framing rejection as a problem to solve rather than a boundary to respect; severity elevates when targeted at male users given documented entitlement-to-attention patterns
- Platform mechanics that enable persistence after block or unmatch (alternate account exposure, algorithmic re-surfacing, "friendzone" framing that treats women's decisions as negotiable)

**What good design looks like:**
- When someone says no, the interaction ends — no retry mechanics
- One-click cancellation, same effort as signup
- Neutral language in all confirmation dialogs, no guilt or shame

---

### 4. Surveillance & Abuse Dynamics

**Plain language:** The app lets one person track or monitor another person in ways that can become controlling.

**What this means:** Features like location sharing, activity logs, "last seen" timestamps, and read receipts are intentionally designed — they work as built. The problem is that in relationships involving domestic abuse, stalking, or controlling behavior, these features become tools of control. A "share your location with family" feature becomes dangerous when one family member cannot safely stop sharing.

**Why this is harmful:** For people in abusive or controlling relationships:
- Location sharing means an abuser always knows where they are
- "Last seen" means an abuser knows when they were on their phone
- Read receipts mean an abuser knows when they read a message and can punish delayed responses
- Activity logs give an abuser a complete record of their digital behavior

**Real-world examples:**
- A fitness app that shares real-time workout location with all contacts, with no way to share with a running group without exposing your location to a controlling partner
- An employee monitoring dashboard showing idle time and application usage
- A "Find My Family" feature with no way for the tracked person to know the full extent of monitoring
- Monitoring or check-in features framed as "protection" or "care" that activate provider-as-controller dynamics — a masculinity script used to normalize surveillance within relationships; severity elevates when the tracked person cannot easily opt out

**What good design looks like:**
- Ongoing, revocable consent from the person being tracked (not just one-time permission)
- Fuzzy location (neighborhood level, not exact address)
- Clear, always-visible indicator: "X can see your location right now"
- Easy, instant "stop sharing" that doesn't notify the person who was tracking

---

### 5. Administrative Power Misuse

**Plain language:** The app gives platform administrators power over users with no accountability or transparency.

**What this means:** Admin tools are built with elevated privileges — that's their purpose. The problem is when those privileges have no transparency: no audit trail, no notification to affected users, no record of what was changed. An admin who can silently read private messages, edit user posts, or de-anonymize surveys is using the system exactly as designed.

**Why this is harmful:** In workplaces and communities:
- An admin could read employees' private messages to retaliate against whistleblowers
- A moderator could silently edit what someone said to make them look bad
- An HR system could de-anonymize "anonymous" survey responses by cross-referencing department and role

**Real-world examples:**
- A team chat admin panel that lets managers read any private message without the employee knowing
- Moderation tools that allow editing user-generated content without leaving a visible edit trail
- An HR analytics dashboard that reveals individual survey responses through cross-referencing

**What good design looks like:**
- Every admin action is logged and the log is visible to affected users
- Content edits always show an edit trail ("Edited by moderator on [date]")
- User impersonation requires notifying the user
- Analytics use aggregate data, not individual-level surveillance

---

### 6. AI Hallucination Framed as Expertise

**Plain language:** The AI makes things up, and the app presents those made-up things as expert knowledge.

**What this means:** All AI language models sometimes generate information that sounds confident but is factually wrong — this is called "hallucination" and is a known, inherent property of the technology. The misuse-by-design occurs when the product *frames* this unreliable output as if it were professional expertise: a medical opinion, legal guidance, therapeutic advice, or verified facts.

**Why this is harmful:** People trust what sounds authoritative. When an AI says "Based on what you've told me, you may be experiencing depression," a user may:
- Delay seeking real mental health care
- Self-medicate based on an AI's fabricated suggestion
- Develop a false sense of being "treated" by the app
- Trust fabricated legal or medical information that leads to real-world harm

**Real-world examples:**
- An AI "wellness companion" that uses therapeutic language ("It sounds like you're experiencing anxiety"), creating a fake therapeutic relationship
- An AI legal assistant that says "This contract protects your interests" — implying a legal review that never happened
- An AI tutor that teaches science with fabricated citations that students trust because the tone is confident
- AI wellness or self-improvement tools that normalize "push through it" over professional help-seeking — presenting emotional suppression and self-reliance as the clinically sound path; severity elevates when the target demographic is men and boys

**What good design looks like:**
- All AI output is clearly labeled as AI-generated
- AI is positioned as a tool for exploration, not a source of conclusions
- Confidence indicators show how certain (or uncertain) the AI is
- In health, legal, or financial contexts: mandatory disclaimers co-located with every AI output

---

### 7. Dark Patterns & Coercive UX

**Plain language:** The app's design tricks people into doing things they didn't mean to do.

**What this means:** Dark patterns are deliberate design choices that exploit how human brains work — our tendency to take the path of least resistance, our fear of missing out, our reluctance to feel like we're making a "bad" choice. These are not accidents; they are intentionally designed interactions.

**Why this is harmful:** Dark patterns undermine informed consent. Users end up:
- Subscribed to things they didn't mean to subscribe to
- Sharing data they didn't realize they were sharing
- Unable to cancel services they no longer want
- Pressured into purchases through fake urgency

**Common dark pattern types:**
| Pattern | What It Does | Example |
|---------|-------------|---------|
| **Confirm-shaming** | Makes you feel bad for saying no | "No thanks, I prefer to waste money" as the cancel button text |
| **Roach motel** | Easy to get in, hard to get out | One-click signup, five-step cancellation with a required phone call |
| **Fake urgency** | Creates artificial time pressure | "Only 2 left!" counters that reset on page reload |
| **Hidden costs** | Reveals fees late in the process | Showing the full price only at the final checkout step |
| **Pre-checked consent** | Opts you in without asking | Marketing email checkbox already checked during signup |
| **Misdirection** | Draws attention away from important choices | A huge "Accept All" button next to a tiny "Manage Preferences" link |

**Masculinity-specific confirm-shaming:** A variant that ties identity to the refusal ("real men don't quit," "don't be the guy who gives up"). Flag both the general pattern and the identity-linked amplification when the product targets male users.

**What good design looks like:**
- Cancellation is as easy as signup (same number of steps or fewer)
- All costs are shown upfront
- Consent checkboxes start unchecked
- No guilt language in any confirmation dialog
- Urgency indicators are connected to real data, not fabricated

---

### 8. Environmental & Ecological Impact

**Plain language:** The app makes design choices that impose avoidable or unacknowledged environmental costs — on the climate, on water systems, and on the communities that live near where its compute runs.

**What this means:** Every AI call, database query, and asset load has an energy cost. This category doesn't measure runtime emissions — it reads design intent. Did the developer think about model size, caching, or scheduling? Is the hosting infrastructure documented? Are AI features triggered deliberately or gratuitously?

**Why this is harmful:** AI's environmental cost is real and growing — projected to equal a major global city's annual CO₂ output by 2025. That cost falls hardest on communities near data centers, which are disproportionately low-income and communities of color. Uninformed design choices aggregate into systemic harm.

**What good design looks like:**
- AI calls gated behind explicit user actions, not fired on every keystroke
- Caching before model calls to avoid redundant inference
- Model size documented and justified
- Hosting provider referenced, ideally with a sustainability link
- Batch or async workloads deferred rather than run immediately

**What this tool does NOT flag:**
- General code performance issues
- The mere use of AI features
- Missing optimizations standard for all software regardless of environmental concern

---

## Population Context & Vulnerability Modifiers

The same feature can be harmless for one group of people and dangerous for another. Ground Floor Check adjusts its analysis based on who will actually use the product.

| Population | Why They're at Higher Risk | What Gets Elevated |
|-----------|--------------------------|-------------------|
| **Minors (under 18)** | Less ability to recognize manipulation; developmental vulnerability to addictive patterns; legal protections require higher duty of care | All categories, especially manipulation and dark patterns |
| **Financially vulnerable people** | More susceptible to predatory pricing, hidden fees, and high-pressure sales tactics | Dark patterns, manipulation |
| **People with mental health conditions** | May over-rely on AI as therapeutic support; vulnerable to features that exploit emotional states | False authority, AI hallucination |
| **Domestic abuse survivors** | Tracking features can be weaponized by abusers; any feature revealing location, activity, or communication patterns is potentially dangerous | Surveillance, manipulation |
| **Elderly users** | May have difficulty navigating complex UX; more vulnerable to deceptive design patterns; less likely to recognize AI-generated content as unreliable | Dark patterns, false authority |
| **Men and boys** | Documented loneliness crisis and lower rates of help-seeking; more susceptible to shame-based mechanics tied to identity; design that reinforces restrictive masculinity norms compounds existing harm gaps | Restrictive masculinity patterns, manipulation, dark patterns |

---

## Industry-Specific Risk Profiles

Different types of apps carry different risk profiles. The scanner applies domain-specific harm patterns based on the app's category:

### Fitness Apps
**Elevated risks:** Body image distortion through "ideal" metrics, calorie restriction encouragement without medical context, progress shaming ("you missed a day!"), AI-generated meal plans framed as professional guidance, competitive leaderboards that could trigger compulsive exercise.

**Also elevated:** Shame-based streak mechanics that tie masculine identity to performance outcomes; absence of recovery and rest modeled as strength; leaderboard mechanics that frame low performance as personal failure.

### Dating Apps
**Elevated risks:** Location sharing that could enable stalking, features that help bypass someone's boundaries (unmatch, block), AI-assisted messaging that manufactures false intimacy, algorithmic matching that reinforces racial or body-type bias.

**Also elevated:** Entitlement affordances that treat rejection as negotiable; AI messaging coaching that optimizes for persistence after disinterest; content or persona design that models adversarial or transactional relationship frameworks; algorithmic pipelines that route lonely or rejected men toward misogynistic worldviews.

### Financial Apps
**Elevated risks:** Dark patterns in subscription cancellation, urgency language pressuring financial decisions, AI financial advice framed as professional recommendation, hidden fees, debt normalization.

**Also elevated:** Masculine identity used as the hook for high-risk financial products; influencer-style content that frames financial risk-taking as a test of manhood; FOMO and urgency mechanics tied to masculine status; absence of disclaimers on financial content in masculine-coded communities.

### Health Apps
**Elevated risks:** AI-generated diagnoses framed as clinical, mood tracking used to infer conditions without clinical validity, crisis detection without proper escalation to emergency services, clinical language used by non-medical AI.

**Also elevated:** Features that substitute AI support for professional care specifically for men; help-seeking suppression through self-reliance framing; absence of referral pathways in mental health tools marketed to men and boys; design that pathologizes emotional disclosure or help-seeking.

### Productivity Apps
**Elevated risks:** Activity monitoring enabling micromanagement, productivity scores visible to managers, calendar transparency revealing personal appointments to employers, automated performance reports based on activity metrics.

**Also elevated:** Hustle-culture AI personas that frame overwork and sacrifice as peak masculine performance; shame mechanics tied to productivity metrics; design that equates output with personal worth.

### Social Platforms
**Elevated risks:** Algorithmic amplification of divisive content, engagement metrics enabling social comparison harm, harassment infrastructure (mass tagging, pile-on mechanics), doxxing vectors, addictive scroll patterns.

**Also elevated:** Community norms baked into UI that reward dominance and bravado; isolation reinforcement through algorithmic filtering; content pipelines that route men experiencing loneliness toward misogynistic or adversarial gender frameworks; absence of features that prompt IRL or peer connection.

### B2B Platforms
**Elevated risks:** Admin reading private messages without audit trail, user impersonation without consent, silent content modification, data export of individual user activity, role escalation without notification.

### Gaming Apps
**Elevated risks:** Loot box mechanics with obscured odds, pay-to-win, FOMO-driven limited-time events, social pressure mechanics (clan obligations, daily streaks), child-accessible spending without parental controls.

**Also elevated:** Hypermasculine persona design that models aggression and dominance as the exclusive path to status; shame-based rank mechanics that tie male identity to performance; absence of cooperative or connection-based win conditions; financial exploitation mechanics that use masculine status framing.

---

## How Severity Is Determined

Severity is not just about how bad the worst case could be — it considers multiple factors:

1. **How realistic is the misuse scenario?** Is there documented precedent for this type of harm (high confidence), or is it theoretical (lower confidence)?

2. **How many people could be affected?** A feature used by millions carries more weight than a niche admin tool.

3. **How vulnerable is the affected population?** The same feature is rated higher when children, abuse survivors, or elderly users are involved.

4. **Does the product target men and boys?** Features that suppress help-seeking, exploit shame, pathologize healthy developmental experiences, reward isolation, or reinforce restrictive masculinity norms are rated higher when the target demographic is male, particularly young men ages 14–30.

5. **How easy is the misuse to execute?** If the feature can be weaponized with no special knowledge or effort, severity is higher.

6. **How severe is the potential harm?** Physical safety risks (stalking, medical decisions) rank higher than financial inconvenience or mild annoyance.

7. **Is the harm reversible?** A misleading AI medical diagnosis that delays treatment is less reversible than a confusing subscription charge.

---

## Confidence & Limitations

Every finding includes a confidence score (0–100%) reflecting how certain the scanner is about:
- **Detection** — did it correctly identify the pattern in the code?
- **Misuse potential** — is there documented precedent for this type of harm?
- **Severity assessment** — is the severity rating appropriate?

### Known Limitations

- The scanner analyzes code structure and patterns; it cannot observe how users actually interact with the product.
- It may miss harm patterns that emerge from the *combination* of multiple features across different files if those files exceed the scan size limit.
- Severity ratings are based on general population risk; specific deployments may have higher or lower actual risk.
- The scanner focuses on eight defined harm categories. Harm types outside this taxonomy (e.g., labor exploitation) are not covered.
- AI analysis has inherent variability — scanning the same code twice may produce slightly different findings.

---

## Glossary

| Term | Definition |
|------|-----------|
| **Misuse-by-design** | A feature that can cause harm while working exactly as intended — the problem is the design choice itself, not a bug or error |
| **Dark pattern** | A user interface design that tricks or pressures people into doing things they didn't intend to do |
| **Confirm-shaming** | Making users feel guilty for declining an offer (e.g., "No thanks, I don't care about saving money") |
| **Roach motel** | A design where it's easy to get into a situation (subscribe, share data) but deliberately hard to get out |
| **Friction asymmetry** | When opting in to something takes 1 click but opting out takes 5+ steps |
| **Risk chain** | When multiple individually harmless features combine to create a dangerous capability (e.g., identity + location + real-time = stalking pipeline) |
| **Ground Floor Score (GFS)** | A 0–100 composite risk score; higher = more ethical risk |
| **Hallucination** | When an AI generates confident-sounding information that is factually incorrect — a known property of all current AI systems |
| **Population modifier** | A flag indicating vulnerable users (minors, elderly, abuse survivors) that causes the scanner to increase severity ratings for relevant risks |
| **Vertical profile** | Industry-specific harm patterns applied when the scanner detects the app belongs to a particular domain (health, dating, finance, etc.) |
| **Triage** | The process of reviewing findings and deciding what to fix, accept, or defer |
| **Remediation** | The specific changes (code, design, or content) suggested to address a finding |
| **Restrictive masculinity patterns** | Design choices that reinforce narrow, harmful definitions of manhood — suppressing help-seeking, rewarding dominance, exploiting identity-linked shame, pathologizing healthy developmental experiences, or deepening isolation in men and boys. A root-cause harm category unique to Ground Floor Check. |
| **Help-seeking suppression** | A design pattern that frames asking for professional support as weakness or failure, particularly harmful for men and boys who are already the least likely demographic to seek mental health care. |
| **Entitlement affordance** | A platform feature that treats another person's "no" as a problem to be overcome rather than a boundary to respect — including retry mechanics, rejection bypass, and AI coaching that optimizes for persistence. |
| **Isolation reinforcement** | Design that deepens a user's disconnection from human relationships by substituting AI personas or solo engagement for peer connection, community participation, or IRL interaction. |
| **Financial exploitation via masculine identity** | The use of masculine shame, status anxiety, or brotherhood framing to push men and boys toward high-risk financial products, crypto schemes, or get-rich-quick content — while suppressing caution, diversification, or professional advice as weakness. |
| **Misogyny as relationship framework** | Platform or AI design that actively models or reinforces adversarial, transactional, or dominance-based relationships with women — distinct from specific coercive mechanics; this is about the underlying relational worldview being built into the product. |
| **Pathologizing healthy developmental experiences** | Design that frames vulnerability, rejection, criticism, or emotional difficulty as dangers to be avoided rather than necessary experiences for growth — training men to suppress the very capacities needed for healthy relationships and self-development. |

---

*This document is part of the Ground Floor Check project. For the technical taxonomy with code signals and detection patterns, see the in-app Taxonomy page at `/taxonomy`.*

*Additions developed through the Ground Floor Coding Project healthy masculinity framework review.*
