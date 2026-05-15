# opencode-antigravity-auth

An OpenCode plugin that provides OAuth authentication against Google's Antigravity IDE, enabling access to Antigravity models and quotas using your Google credentials.

## Supported Models

### Real Models
- `antigravity-claude-opus-4-6-thinking`
- `antigravity-gemini-3.1-pro`
- `antigravity-claude-sonnet-4-6`
- `antigravity-gemini-3-flash`

### Auto Models
Auto models automatically select the best available model based on rate limit availability, falling back to the next tier if needed.

- `antigravity-auto` — Uses the best available model (configurable via `auto_mode_stage`)
- `antigravity-auto-best` — Starts at Opus 4.6 Thinking, falls back down
- `antigravity-auto-high` — Starts at Gemini 3.1 Pro, falls back down
- `antigravity-auto-balanced` — Starts at Sonnet 4.6, falls back down
- `antigravity-auto-fastest` — Gemini 3 Flash only

When auto mode is active, the toast notification shows which model was actually selected and at which tier, e.g. `Using account@gmail.com (1/2) (Auto: Best - antigravity-claude-opus-4-6-thinking)`.

## Installation

### Option A: Using Plugin Updater (Recommended)

1. Install `opencode-plugin-updater`.
2. Use the updater to install `opencode-antigravity-auth`.

### Option B: Manual Installation

Copy the plugin file into your OpenCode plugins directory:

```bash
cp opencode-antigravity-auth.js ~/.config/opencode/plugin/
```

Restart OpenCode to load the plugin.

## Configuration

Create `~/.config/opencode/config/antigravity.json` (or `.opencode/antigravity.json` for per-project):

```json
{
  "auto_mode": true,
  "auto_mode_stage": "best",
  "fallback_enabled": false,
  "account_selection_strategy": "hybrid"
}
```

### Key Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `auto_mode` | bool | `false` | Enable automatic model selection |
| `auto_mode_stage` | `"best"` \| `"high"` \| `"balanced"` \| `"fastest"` | `"best"` | Starting tier for `antigravity-auto` |
| `fallback_enabled` | bool | `false` | Walk down the ranking on rate limit |
| `model_ranking` | string[] | *hardcoded 4-tier list* | Override the fallback order |
| `account_selection_strategy` | `"hybrid"` \| `"sticky"` \| `"round-robin"` | `"hybrid"` | How accounts are rotated |

## Disclaimer

**Warning**: Using this plugin (and any proxy for Antigravity) violates Google's Terms of Service. Your account may be suspended or permanently banned. Use at your own risk.
