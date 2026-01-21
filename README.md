
---

<h1 align="center">RLM Explained</h1>

<p align="center">
Educational tool for understanding Recursive Language Models
</p>

<p align="center">
  <a href="https://arxiv.org/abs/2512.24601">Paper</a> |
  <a href="https://namastex.ai">Namastex</a> |
  <a href="https://github.com/namastexlabs">GitHub</a>
</p>

## About

This is an educational fork of [RLM](https://github.com/alexzhang13/rlm) by **Namastex Labs**. It helps developers and researchers understand how Recursive Language Models work through an interactive visualizer with support for English, Portuguese, and Spanish.

## Prerequisites

Install [uv](https://docs.astral.sh/uv/) (Python package manager):
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Install [pnpm](https://pnpm.io/) (Node.js package manager):
```bash
npm install -g pnpm
```

## Installation

```bash
make install
```

## Running

```bash
make start
```

This starts both servers:
- **Backend:** http://localhost:8000
- **Frontend:** http://localhost:3000

## Supported LLM Providers

| Provider | Backend Key |
|----------|-------------|
| OpenAI | `openai` |
| Anthropic | `anthropic` |
| OpenRouter | `openrouter` |
| Portkey | `portkey` |
| LiteLLM | `litellm` |

Set your API key as an environment variable (e.g., `OPENAI_API_KEY`) before running.

## Attribution

Based on [Recursive Language Models](https://arxiv.org/abs/2512.24601) by **Alex L. Zhang**, **Tim Kraska**, and **Omar Khattab** (MIT OASYS Lab).

```bibtex
@misc{zhang2025recursivelanguagemodels,
      title={Recursive Language Models},
      author={Alex L. Zhang and Tim Kraska and Omar Khattab},
      year={2025},
      eprint={2512.24601},
      archivePrefix={arXiv},
      primaryClass={cs.AI},
      url={https://arxiv.org/abs/2512.24601},
}
```

---

<p align="center">
  Educational adaptation by <a href="https://namastex.ai">Namastex Labs</a>
</p>
