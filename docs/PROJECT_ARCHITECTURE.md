# Updated AI Layer Architecture

## AI Layer

### OpenRouter API

Use OpenRouter as the centralized AI gateway instead of depending directly on a single AI provider.

Benefits:

* Access multiple LLM providers through one API
* Switch models without changing backend architecture
* Lower operational costs
* Better flexibility during experimentation
* Model fallback support
* Easier scaling

---

# Supported Model Providers Through OpenRouter

Possible models:

* OpenAI GPT models
* Claude models
* Gemini models
* DeepSeek
* Llama models
* Mistral models
* Qwen models

This allows the system to dynamically choose:

* cheaper models for simple tasks
* stronger reasoning models for healthcare conversations

---

# Recommended Initial Models

## Primary Chat Model

DeepSeek V4 Flash (`deepseek/deepseek-v4-flash:free`) or `openrouter/free` router

Purpose:

* conversational guidance
* parenting support
* contextual explanations

Free models on OpenRouter use the `:free` suffix — no credits required. Browse options at [openrouter.ai/collections/free-models](https://openrouter.ai/collections/free-models).

---

## Lightweight Fast Model

`meta-llama/llama-3.2-3b-instruct:free` or `openrouter/free`

Purpose:

* reminders
* quick summaries
* simple scheduling responses

---

# AI Request Flow

## Chat Flow

1. Parent sends message
2. Backend fetches child context
3. Backend injects structured healthcare data
4. Request sent to OpenRouter
5. OpenRouter routes request to selected model
6. AI response returned to parent

---

# AI Context Injection

Before sending requests:
Inject:

* child age
* vaccine history
* allergies
* feeding logs
* sleep history
* growth data
* local vaccine schedule

This ensures contextual and personalized responses.

---

# Important Architecture Principle

The LLM is NOT the source of truth.

The source of truth should always be:

* your database
* healthcare schedules
* deterministic backend rules

The LLM only helps with:

* conversation
* explanation
* personalization
* natural language understanding

---

# OpenRouter Example API Setup

```ts id="h7x3a8"
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "deepseek/deepseek-v4-flash:free",
    messages: [
      {
        role: "system",
        content: "You are an infant healthcare assistant."
      },
      {
        role: "user",
        content: userMessage
      }
    ]
  })
});
```

---

# Suggested Environment Variables

```env id="evnh6e"
OPENROUTER_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ONESIGNAL_API_KEY=
```

---

# Recommended Future Improvement

Later:
implement model routing logic.

Example:

* use cheaper models for simple reminders
* use stronger reasoning models for health-related conversations
* automatically fallback if one provider fails

This creates:

* lower costs
* better uptime
* smarter AI orchestration

---

# Application implementation

The reference app lives in this repository (Next.js + Supabase + OpenRouter).

## Run locally

1. Copy `.env.local.example` → `.env.local` and set keys.
2. Apply `supabase/migrations/001_initial.sql` (hosted SQL editor or `supabase db reset` locally).
3. Enable Supabase **Google** OAuth (and optionally **Email** for magic links). See [README.md](../README.md).
4. Set **Site URL** and **Redirect URLs** to include `/auth/callback`.
5. `npm install && npm run dev` → [http://localhost:3000/login](http://localhost:3000/login)

See [README.md](../README.md) for full setup.

## Folder map

| Path | Role |
|------|------|
| `app/login/page.tsx` | Google OAuth + email sign-in |
| `app/auth/callback/route.ts` | Session exchange after OAuth / magic link |
| `app/api/chat/route.ts` | Streams OpenRouter; injects child context; persists messages |
| `lib/context/buildChildContext.ts` | Loads DB facts into system prompt |
| `lib/openrouter.ts` | OpenRouter streaming client |
| `components/chat/*` | ChatGPT-style UI (sidebar, messages, composer) |
| `supabase/migrations/001_initial.sql` | Schema, RLS, vaccine schedule seed |

## UI

* Light mode default; optional dark (monochrome zinc palette)
* SF Pro system font stack
* Sidebar: child selector, conversations, new chat, theme toggle
* Main: centered thread + sticky composer + suggested prompts

## Environment variables (implemented)

```env
OPENROUTER_API_KEY=
OPENROUTER_MODEL=deepseek/deepseek-v4-flash:free
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
