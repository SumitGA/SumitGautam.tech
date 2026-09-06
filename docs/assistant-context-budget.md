# Context budget for the site assistant

How the AI assistant on sumitgautam.tech is given knowledge of the blog, why it
is shaped this way, and the measurement that decides when the shape has to
change.

## The problem

The assistant answers visitor questions from a system prompt built out of live
Supabase data. That prompt is:

- **rebuilt every 10 minutes** (module-scope cache, `PROMPT_TTL_MS`), and
- **sent with every single message**.

The cache saves database queries. It does not save tokens: every turn still
carries the whole prompt to the model. So anything added to the prompt is paid
for on every message, forever.

That is fine for a résumé, which is bounded. It is not fine for a blog, which
is unbounded by design — the whole point is to keep publishing.

## Measurements

Taken 2026-09-06, ~4 characters per token.

Prompt before any blog content:

| Source | Tokens |
|---|---:|
| Projects (full case-study text) | 4,506 |
| Résumé jobs | 1,205 |
| Skills, summary, header, bio, education | ~725 |
| **Base total** | **~6,400** |

Blog, per post:

| Shape | Tokens/post |
|---|---:|
| Full markdown body | ~2,337 |
| Title + excerpt + section headings | ~145 |

The ratio is about **16:1**. That ratio is the entire design.

## Options considered

**1. Every post in full.** Simplest, and the model has everything. Cost grows at
~2,337 tokens per post with no ceiling.

**2. Title, excerpt and headings for every post.** Cheap and bounded in
practice, but the model can only describe and link — it cannot quote a specific
number from a post it was never shown.

**3. Retrieval (embed posts, fetch the relevant few per question).** Cost is
genuinely independent of corpus size. It also introduces an embedding store,
an indexing job on publish, a similarity query in the request path, and a new
failure mode where the right passage is not retrieved and the model answers
from nothing.

## What was built: option 2, plus option 1 for the newest few

Every post contributes title, excerpt and **section headings**. The newest
`FULL_POSTS_IN_PROMPT` (currently 3) also contribute their full body.

Headings are the load-bearing part. "Act III: The Execution", "A Database
Designed to Survive the Firehose", "Five Public Domains. Zero Open Ports."
describe the territory precisely enough for the model to say *"yes, he wrote
about killing Postgres under load — /blog/9964-readings-a-second…"* and be
right, at about a hundred tokens.

Recency is the split because recent work is what gets asked about, and the
newest posts are the ones a visitor is most likely to have arrived from.

## Projected cost

| Posts | This design | Every post in full |
|---:|---:|---:|
| 2 | 11,362 | 11,073 |
| 5 | 14,132 | 18,083 |
| 10 | 14,855 | 29,765 |
| 20 | 16,300 | 53,130 |
| 50 | 20,635 | 123,225 |
| 100 | 27,860 | 240,050 |

Two honest observations:

**At 2 posts this design is slightly worse** — 11,362 against 11,073 — because
both posts are already carried in full *and* pay for headings on top. It only
starts paying off at about four posts. Optimising before that point would have
been premature; it was built now because the crossover is close and the cost of
retrofitting later is higher than the cost of a few hundred wasted tokens now.

**It is not flat, it is linear with a smaller slope.** ~145 tokens per post
still accumulates: at 100 posts the index alone is ~14,500 tokens. The claim
worth making is 16× cheaper growth, not constant cost.

## When to change approach

Switch to retrieval when the **index alone** passes roughly 15–20k tokens —
about 100 posts at current lengths. Before that, retrieval is a store, an
indexing job and a new failure mode bought to solve a problem that does not
exist yet.

Two cheaper moves come first, in this order:

1. **Trim the projects section.** It is 4,506 tokens — 70% of the base prompt,
   and larger than the entire blog index will be for a long time. Full
   `problem`/`approach`/`outcome` for every case study is sent on every
   message. Summarising all but the featured ones would free more than the blog
   costs.
2. **Drop `FULL_POSTS_IN_PROMPT` to 1 or 0.** Each full post is ~2,337 tokens,
   so this recovers ~4,700 tokens instantly at the cost of quoting precision.

## Why the free tier is not the constraint

Gemini's free tier is capped on **requests** — per minute and per day — not on
tokens per day. A larger prompt does not consume more of the daily request
quota; a 30,000-token request and a 3,000-token one both cost one request.

Prompt size shows up instead in:

- **tokens per minute**, which binds only under concurrent traffic this site
  does not have,
- **latency**, since more input means a slower first token on a streamed reply,
- **money**, on the day this stops being free.

Quotas change. Check the current published limits rather than trusting a number
written here.

## Failure modes

- **A post is unpublished or scheduled.** RLS filters it out of the query, so it
  never reaches the prompt. Correct by construction rather than by remembering.
- **Supabase is unreachable.** `getPostsForPrompt()` logs and returns `[]`; the
  assistant loses the writing section and keeps working.
- **The model cites a post that does not exist.** The prompt instructs it to
  cite only slugs listed, and every listed slug is a real published post, so a
  hallucinated path cannot come from this section.
- **A post is summarised, and the model invents detail.** The section header
  states explicitly that a post without full text is described by headings only
  and must not be elaborated on. This is mitigation, not a guarantee — it is the
  main reason the newest posts are sent in full.
