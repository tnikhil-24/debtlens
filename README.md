# DebtLens

**Visualize tech debt as a heatmap in your VS Code file tree — with AI-powered fix plans.**

## The problem

Tech debt is invisible. You open your project, pick a random file to edit, and discover it hasn't been touched in 14 months, has 12 `FIXME` comments, and uses three deprecated APIs. You had no idea. Neither did anyone else on your team.

**DebtLens makes it visible — before you open the file.**

---

## What it does

DebtLens scans your workspace and paints every file and folder in your Explorer with a colored debt badge — from clean green to critical red. Folders roll up the worst score of their children, so a red folder means a red file inside it.

Click any file with a badge and get a streamed, prioritised fix plan from Groq's Llama 3.3 70B — explaining exactly what the debt is and how to fix it, in order of impact.

**Everything works on install. No configuration. No account. No API key needed for the first 10 uses per day.**

---

## Features

- **File tree heatmap** — colored badges (clean → minor → moderate → high → critical) on every `.ts`, `.tsx`, `.js`, `.jsx` file
- **Folder rollup** — parent folders show the worst debt score among their children
- **Three-signal debt formula** — Git age + TODO/FIXME density + deprecated API detection combined into a single 0–100 score
- **AI fix plans** — open any file, run `DebtLens: Explain Debt (AI)`, and get a streamed prioritised refactoring plan powered by Groq (Llama 3.3 70B)
- **10 free AI explanations per day** — no API key or signup needed, works immediately on install
- **Bring your own key** — add your own Groq, OpenAI, or Anthropic key for unlimited AI use
- **Auto re-scan on save** — heatmap updates 2 seconds after any file is saved
- **Status bar** — workspace average debt score always visible at the bottom of VS Code
- **Secure by design** — AI calls are proxied through a Cloudflare Worker; your key is never bundled in the extension

---

## How the debt score works

Every file gets a score from 0–100 computed from three weighted signals:

| Signal | Weight | How it's measured |
|--------|--------|-------------------|
| **Git age** | 35% | Days since last commit, normalized to 1 year |
| **TODO density** | 40% | `TODO` / `FIXME` / `HACK` / `BUG` / `XXX` count per line |
| **Deprecated APIs** | 25% | Known deprecated pattern hits detected via AST |

Scores map to five levels:

| Score | Level | Badge color |
|-------|-------|-------------|
| 0–19 | Clean | Teal |
| 20–39 | Minor | Green |
| 40–59 | Moderate | Amber |
| 60–79 | High | Orange |
| 80–100 | Critical | Red |

---

## Getting started

**Install from the Marketplace:**

```
ext install tnikhil-24.debtlens
```

Or search **DebtLens** in the VS Code Extensions panel (`Ctrl+Shift+X`).

**That's it.** Open any project folder and DebtLens scans automatically. Badges appear in the file explorer within seconds.

**To get an AI fix plan:**
1. Open any file that has a debt badge
2. Press `Ctrl+Shift+P` → `DebtLens: Explain Debt (AI)`
3. A panel opens beside your code and streams a prioritised fix plan in real time

**To unlock unlimited AI explanations:**

Press `Ctrl+Shift+P` → `DebtLens: Set API Key (Unlimited)` → select your provider → paste your key. Your key is stored in VS Code's encrypted `SecretStorage` — never in any settings file.

---

## Commands

| Command | Description |
|---------|-------------|
| `DebtLens: Scan Workspace` | Manually trigger a full workspace scan |
| `DebtLens: Explain Debt (AI)` | Stream an AI fix plan for the active file |
| `DebtLens: Set API Key (Unlimited)` | Add your own key for unlimited AI use |
| `DebtLens: Remove API Key` | Switch back to the free tier |
| `DebtLens: Clear Heatmap` | Remove all badges from the file explorer |

---

## Privacy

- **No telemetry.** DebtLens never collects usage data or sends your code anywhere without your action.
- **Anonymous rate limiting.** A random machine ID (no personal data) is used to enforce the 10 free explanations/day limit. It is never stored or shared.
- **Secure AI proxy.** When you use the free tier, file debt signals (not your full code) are sent to a Cloudflare Worker that calls Groq. The Groq API key lives encrypted in Cloudflare — it is never shipped in the extension.
- **Your own key.** If you add your own API key, it goes directly from VS Code's encrypted `SecretStorage` to the AI provider. It never touches any third-party server.

---

## Roadmap

- [ ] Python, Go, and Rust language support
- [ ] Workspace debt trend chart — is your codebase getting better or worse over time?
- [ ] Git blame integration — see which files haven't been touched by anyone in months
- [ ] Custom scoring rules via `.debtlens.json` config
- [ ] GitHub Action — fail PRs that introduce too much debt
- [ ] `debtlens.dev` — scan any public GitHub repo from the browser

---

## Contributing

Contributions are welcome. If you find a bug, have a feature idea, or want to improve the debt formula — open an issue or a PR.

```
git clone https://github.com/tnikhil-24/debtlens.git
cd debtlens
npm install
```

Press `F5` in VS Code to launch the Extension Development Host and start hacking.

Please open an issue before submitting a large PR so we can discuss the approach first.

---

## Built with

- [TypeScript](https://www.typescriptlang.org/)
- [simple-git](https://github.com/steveukx/git-js)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Groq](https://groq.com/) — Llama 3.3 70B

---

## Author

**Nikhil** — [LinkedIn](https://www.linkedin.com/in/tnikhil24/) · [GitHub](https://github.com/tnikhil-24)

---

## License

MIT — see [LICENSE.md](LICENSE.md)
