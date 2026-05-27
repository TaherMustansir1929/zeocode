```text
███████╗███████╗ ██████╗  ██████╗ ██████╗ ██████╗ ███████╗
╚══███╔╝██╔════╝██╔═══██╗██╔════╝██╔═══██╗██╔══██╗██╔════╝
  ███╔╝ █████╗  ██║   ██║██║     ██║   ██║██║  ██║█████╗  
 ███╔╝  ██╔══╝  ██║   ██║██║     ██║   ██║██║  ██║██╔══╝  
███████╗███████╗╚██████╔╝╚██████╗╚██████╔╝██████╔╝███████╗
╚══════╝╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝
```

# ZeoCode

[![Bun Version](https://img.shields.io/badge/bun-%3E%3D1.0.0-black?logo=bun&logoColor=fbf0df)](https://bun.sh)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=white)](https://react.dev/)

An interactive, terminal-based AI coding agent with batteries-included capabilities right out of the box. 

Built using **TypeScript**, **React**, and **Bun**, ZeoCode features a dynamic Terminal User Interface (TUI) powered by `@opentui` that allows you to pair program with powerful AI models directly in your command line.

### Dual-Mode Architecture

ZeoCode operates in two distinct modes to keep you in control:

| Mode | Type | Purpose | Tool Access |
| :--- | :--- | :--- | :--- |
| **`PLAN`** | Read-Only | Researching, analyzing, and designing solutions without modifying files. | Directory listing, glob matching, regex grep, file reading. |
| **`BUILD`** | Read-Write | Complete implementation, file edits, package building, and execution. | All `PLAN` tools + file writing, surgical text replacing, and shell execution. |

## Installation

### System Requirements
ZeoCode supports the following environments:
*   **Operating Systems**: Linux, macOS
*   **Architectures**: x64 (Intel/AMD), arm64 (Apple Silicon / ARM)

### One-Command Installer
To install ZeoCode, run the following command in your terminal:

```bash
curl -fsSL https://raw.githubusercontent.com/TaherMustansir1929/zeocode/main/scripts/install.sh | bash
```

### Post-Installation Setup
To activate `zeocode` immediately in your current terminal session, reload your shell configuration:

*   **Zsh**: `source ~/.zshrc`
*   **Bash**: `source ~/.bashrc`
*   **Fish**: `source ~/.config/fish/config.fish`

### Verifying the Installation
To confirm ZeoCode is installed and working correctly:
1. Navigate to any project directory in your terminal.
2. Launch the agent:
   ```bash
   zeocode
   ```
3. Ask a simple question like:
   ```text
   What is this project about?
   ```

## Usage

### 1. Configuration & API Keys
Before starting, you must expose the API keys for the model providers you intend to use. Export them in your terminal profile or create a `.env` file in your workspace:

```bash
# Export the keys directly in your shell:
export GOOGLE_GENERATIVE_AI_API_KEY="your-google-api-key"
export ANTHROPIC_API_KEY="your-anthropic-api-key"
export OPENAI_API_KEY="your-openai-api-key"

# Additional providers (compatible via OpenRouter, Groq, etc.):
export GROQ_API_KEY="your-groq-api-key"
export OPENROUTER_API_KEY="your-openrouter-api-key"
```

### 2. Launching ZeoCode
Navigate to your workspace directory and launch the application:
```bash
zeocode
```

### 3. Authentication
Once inside the Terminal User Interface (TUI), run the following command to sign in to your Clerk account:
```text
/login
```
This will open your default browser to safely authenticate you.

### 4. Interactive Commands (Slash Commands)
ZeoCode supports a set of slash commands directly within the chat prompt:

*   `/login` - Sign in using your browser.
*   `/logout` - Sign out of your account.
*   `/new` - Start a new, clean conversation session.
*   `/sessions` - Open the session manager dialog to view, search, and reload past sessions.
*   `/agents` - Toggle or select between the active agents.
*   `/models` - Select the AI model for generation (e.g. Gemini, Claude, GPT).
*   `/theme` - Change the terminal TUI color theme.
*   `/exit` - Quit the application.

### 5. Switching Modes
To quickly switch between **`PLAN`** (read-only analysis) and **`BUILD`** (read-write implementation) modes, simply press the **`TAB`** key while typing in the input box. The TUI border color and status indicators will change to reflect the active mode.

## Development

### Prerequisites
To build and run ZeoCode locally, you need the following installed:
*   [Bun](https://bun.sh) (>= 1.0.0)
*   [Git](https://git-scm.com)
*   [PostgreSQL](https://www.postgresql.org) database (local or hosted)

### Step 1: Clone the Repository
```bash
git clone https://github.com/TaherMustansir1929/zeocode.git
cd zeocode
```

### Step 2: Install Dependencies
Install all workspace dependencies using Bun:
```bash
bun install
```
*Note: This will automatically generate the Prisma client for `@zeocode/database` via a postinstall hook.*

### Step 3: Configure Environment Variables
Copy the template `.env` file to the root of the project:
```bash
cp .env.example .env
```
Open `.env` and fill in the required configuration options.

#### Local Backend vs. Hosted CLI
*   **Installed Binary**: The CLI binary downloaded via `curl` connects to the hosted ZeoCode API service out of the box.
*   **Development / Compiled Binary**: When compiling or running the code locally, the CLI defaults to connecting to `http://localhost:3000` (meaning your local Hono API server must be running).

#### Required Environment Keys
Ensure the following keys are populated in your `.env` file:
*   **Database**: `DATABASE_URL` (PostgreSQL connection string).
*   **Clerk Authentication**: Generate keys by creating a developer application at [Clerk](https://clerk.com):
    *   `CLERK_FRONTEND_API`
    *   `CLERK_SECRET_KEY`
    *   `CLERK_OAUTH_CLIENT_ID`
    *   `CLERK_OAUTH_CLIENT_SECRET`
    *   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
    *   `JWT_SECRET` (used for signing local tokens, defaults to `jwt-secret` for dev)
*   **LLM Provider API Keys**: Add credentials for providers you intend to use:
    *   `GOOGLE_GENERATIVE_AI_API_KEY`
    *   `ANTHROPIC_API_KEY`
    *   `OPENAI_API_KEY`

### Step 4: Setup the Database
Synchronize the Prisma schema with your PostgreSQL database:
```bash
bunx prisma db push
```

### Step 5: Start the Development Servers
ZeoCode requires running both the backend server and the TUI CLI concurrently. Open two terminal sessions:

*   **Terminal 1 (Backend Server)**: Runs at `http://localhost:3000`
    ```bash
    bun run dev:server
    ```
*   **Terminal 2 (Interactive TUI CLI)**:
    ```bash
    bun run dev:cli
    ```

### Code Standards & Formatting
We use [Ultracite](https://github.com/TaherMustansir1929/zeocode/blob/main/AGENTS.md) (built on top of Biome) to enforce strict code quality guidelines. Before committing code, please make sure your changes are clean and formatted:

*   **Check for errors**:
    ```bash
    bun run check
    ```
*   **Auto-fix formatting/linting issues**:
    ```bash
    bun run fix
    ```

### Compiling Standalone Binaries
To package the CLI into single compiled executables:

*   **Compile for your host platform**:
    ```bash
    ./scripts/build-cli.sh
    ```
*   **Cross-compile for all supported platforms** (Linux/macOS x64/arm64):
    ```bash
    ./scripts/build-cli.sh --all
    ```
The compiled binaries will be outputted to the `dist/` directory.

## Monorepo Architecture & Contributing

### Directory Structure
ZeoCode is structured as a monorepo using Bun workspaces:

```text
zeocode/
├── packages/
│   ├── cli/          # React-based interactive TUI client (using @opentui)
│   ├── server/       # Hono backend server for LLM streaming & agent tool orchestration
│   ├── database/     # Prisma ORM setup, models, and PostgreSQL client
│   └── shared/       # Shared type definitions, Zod schemas, and model configs
├── scripts/          # Bash scripts for building the CLI and installer configurations
├── package.json      # Workspace root configuration
└── tsconfig.base.json # Global compiler parameters
```

---

### How to Contribute

We welcome contributions from the community! To help us keep the code high-quality, please follow these steps:

#### 1. Discuss First
For any major features, refactoring, or architectural changes, please [open an issue](https://github.com/TaherMustansir1929/zeocode/issues) first to discuss your proposal with the maintainers.

#### 2. Standard Workflow
1. **Fork** the repository on GitHub.
2. **Clone** your fork locally and set up the development environment (see the [Development](#development) section).
3. Create a descriptive **feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. Implement your changes.

#### 3. Formatting & Linting Check
Ensure your code complies with our standards by running the formatting checks:
```bash
bun run check
```
If there are any style or formatting issues, run:
```bash
bun run fix
```
*Pull Requests with failing checks or unresolved formatting warnings will not be merged.*

#### 4. Submit a Pull Request
Push your branch to your GitHub fork and open a Pull Request against our `main` branch. Provide a clear description of:
*   What was added/fixed.
*   Which issues are addressed (e.g. `Closes #12`).
*   Any testing steps you performed.

---

### License
This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.