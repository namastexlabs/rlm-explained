#!/usr/bin/env python3
"""Interactive setup script for RLM Explained."""

import os
import subprocess
import sys
from getpass import getpass
from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.prompt import Confirm, Prompt
from rich.table import Table

console = Console()

# Project root directory
ROOT_DIR = Path(__file__).parent.parent

# Provider configurations
PROVIDERS = {
    "1": {
        "name": "OpenAI",
        "description": "GPT-4, GPT-4o, GPT-3.5 models",
        "env_vars": [
            {"name": "OPENAI_API_KEY", "description": "OpenAI API Key", "secret": True},
        ],
        "docs_url": "https://platform.openai.com/api-keys",
    },
    "2": {
        "name": "Anthropic",
        "description": "Claude 3.5, Claude 3 models",
        "env_vars": [
            {"name": "ANTHROPIC_API_KEY", "description": "Anthropic API Key", "secret": True},
        ],
        "docs_url": "https://console.anthropic.com/settings/keys",
    },
    "3": {
        "name": "Google Gemini",
        "description": "Gemini Pro, Gemini Flash models",
        "env_vars": [
            {"name": "GEMINI_API_KEY", "description": "Google AI Studio API Key", "secret": True},
        ],
        "docs_url": "https://aistudio.google.com/apikey",
    },
    "4": {
        "name": "Cerebras",
        "description": "Llama-based models with fast inference",
        "env_vars": [
            {"name": "CEREBRAS_API_KEY", "description": "Cerebras API Key", "secret": True},
        ],
        "docs_url": "https://cloud.cerebras.ai/",
    },
    "5": {
        "name": "OpenRouter",
        "description": "Access to multiple providers through one API",
        "env_vars": [
            {"name": "OPENROUTER_API_KEY", "description": "OpenRouter API Key", "secret": True},
        ],
        "docs_url": "https://openrouter.ai/keys",
    },
    "6": {
        "name": "Portkey",
        "description": "AI gateway with observability and routing",
        "env_vars": [
            {"name": "PORTKEY_API_KEY", "description": "Portkey API Key", "secret": True},
        ],
        "docs_url": "https://app.portkey.ai/",
    },
    "7": {
        "name": "Azure OpenAI",
        "description": "OpenAI models on Azure infrastructure",
        "env_vars": [
            {"name": "AZURE_OPENAI_API_KEY", "description": "Azure OpenAI API Key", "secret": True},
            {
                "name": "AZURE_OPENAI_ENDPOINT",
                "description": "Azure endpoint (e.g., https://your-resource.openai.azure.com)",
                "secret": False,
            },
            {
                "name": "AZURE_OPENAI_DEPLOYMENT",
                "description": "Deployment name",
                "secret": False,
            },
        ],
        "docs_url": "https://portal.azure.com/",
    },
    "8": {
        "name": "LiteLLM",
        "description": "Unified interface for 100+ LLMs (uses underlying provider keys)",
        "env_vars": [],
        "docs_url": "https://docs.litellm.ai/",
        "note": "LiteLLM uses the API keys of the underlying providers. Configure the provider you want to use.",
    },
    "9": {
        "name": "vLLM",
        "description": "Self-hosted inference server (no API key required)",
        "env_vars": [
            {
                "name": "VLLM_BASE_URL",
                "description": "vLLM server URL (e.g., http://localhost:8000/v1)",
                "secret": False,
            },
        ],
        "docs_url": "https://docs.vllm.ai/",
    },
}


def display_welcome():
    """Display welcome message."""
    console.print()
    console.print(
        Panel.fit(
            "[bold blue]RLM Explained[/bold blue]\n"
            "[dim]Interactive Setup Wizard[/dim]",
            border_style="blue",
        )
    )
    console.print()


def display_provider_menu():
    """Display the provider selection menu."""
    table = Table(title="LLM Providers", show_header=True, header_style="bold cyan")
    table.add_column("#", style="dim", width=3)
    table.add_column("Provider", style="bold")
    table.add_column("Description")

    for key, provider in PROVIDERS.items():
        table.add_row(key, provider["name"], provider["description"])

    console.print(table)
    console.print()


def select_provider() -> dict:
    """Prompt user to select a provider."""
    display_provider_menu()

    while True:
        choice = Prompt.ask(
            "Select a provider",
            choices=list(PROVIDERS.keys()),
            default="1",
        )
        provider = PROVIDERS[choice]
        console.print(f"\nSelected: [bold green]{provider['name']}[/bold green]")

        if "note" in provider:
            console.print(f"[yellow]Note:[/yellow] {provider['note']}")

        console.print(f"[dim]Documentation: {provider['docs_url']}[/dim]\n")
        return provider


def get_api_keys(provider: dict) -> dict[str, str]:
    """Prompt user for API keys and configuration."""
    env_values = {}

    if not provider["env_vars"]:
        console.print("[dim]No API keys required for this provider.[/dim]")
        return env_values

    console.print("[bold]Enter your credentials:[/bold]")
    console.print("[dim]Values will be hidden for sensitive fields[/dim]\n")

    for var in provider["env_vars"]:
        if var["secret"]:
            value = getpass(f"{var['description']}: ")
        else:
            value = Prompt.ask(var["description"])

        if value:
            env_values[var["name"]] = value

    return env_values


def load_existing_env() -> dict[str, str]:
    """Load existing .env file if it exists."""
    env_file = ROOT_DIR / ".env"
    env_values = {}

    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, value = line.partition("=")
                    env_values[key.strip()] = value.strip()

    return env_values


def generate_env_file(new_values: dict[str, str], provider_name: str) -> bool:
    """Generate or update the .env file."""
    env_file = ROOT_DIR / ".env"
    existing_values = load_existing_env()

    # Check if file exists and has content
    if env_file.exists() and existing_values:
        console.print("\n[yellow]Existing .env file found with the following keys:[/yellow]")
        for key in existing_values:
            console.print(f"  - {key}")

        action = Prompt.ask(
            "\nHow would you like to proceed?",
            choices=["merge", "overwrite", "cancel"],
            default="merge",
        )

        if action == "cancel":
            console.print("[dim]Setup cancelled. No changes made.[/dim]")
            return False
        elif action == "merge":
            # Merge: new values override existing
            existing_values.update(new_values)
            new_values = existing_values
        # overwrite: just use new_values

    # Write the .env file
    with open(env_file, "w") as f:
        f.write("# RLM Explained - Environment Variables\n")
        f.write(f"# Configured for: {provider_name}\n")
        f.write(f"# Generated by setup script\n\n")

        for key, value in new_values.items():
            f.write(f"{key}={value}\n")

    console.print(f"\n[green]Created/updated:[/green] {env_file}")
    return True


def generate_frontend_env():
    """Generate frontend .env.local file."""
    frontend_env = ROOT_DIR / "visualizer" / ".env.local"

    # Default frontend environment
    content = """# RLM Visualizer - Local Environment
# Generated by setup script

VITE_API_URL=http://localhost:8000
"""

    with open(frontend_env, "w") as f:
        f.write(content)

    console.print(f"[green]Created:[/green] {frontend_env}")


def prompt_start_now() -> bool:
    """Ask if user wants to start the servers now."""
    console.print()
    return Confirm.ask(
        "[bold]Would you like to start the servers now?[/bold]",
        default=True,
    )


def start_servers():
    """Start the backend and frontend servers."""
    console.print("\n[bold blue]Starting RLM servers...[/bold blue]")
    console.print("[dim]Press Ctrl+C to stop[/dim]\n")

    # Change to project root and run make start
    os.chdir(ROOT_DIR)
    subprocess.run(["make", "start"])


def main():
    """Main setup flow."""
    display_welcome()

    # Select provider
    provider = select_provider()

    # Get API keys
    env_values = get_api_keys(provider)

    # For LiteLLM, prompt for underlying provider
    if provider["name"] == "LiteLLM":
        console.print("\n[bold]LiteLLM requires credentials for the underlying provider.[/bold]")
        console.print("Select the provider you want to use with LiteLLM:\n")
        underlying = select_provider()
        env_values = get_api_keys(underlying)

    # Generate .env file
    if env_values:
        if not generate_env_file(env_values, provider["name"]):
            return
    else:
        console.print("\n[yellow]No credentials provided. Skipping .env generation.[/yellow]")

    # Generate frontend .env.local
    generate_frontend_env()

    # Summary
    console.print()
    console.print(
        Panel(
            "[bold green]Setup complete![/bold green]\n\n"
            "Your environment has been configured.\n"
            "You can modify settings in [bold].env[/bold] anytime.",
            border_style="green",
        )
    )

    # Ask to start
    if prompt_start_now():
        start_servers()
    else:
        console.print("\n[dim]To start later, run:[/dim] [bold]make start[/bold]")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n[dim]Setup cancelled.[/dim]")
        sys.exit(0)
