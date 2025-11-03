# Getting Started

This guide will help you install and set up the Lara Translate node for n8n.

## Requirements

Before you begin, ensure you have the following:

- **Node.js** version 22.20.0 or higher
- **pnpm** - Package manager (install with `npm install -g pnpm`)
- **n8n** - Installed globally (`npm install -g n8n`)
- **nvm** (optional) - Node version manager for easy Node.js version switching
- **Lara Translate API credentials** (Access Key ID and Access Key Secret)

💡 **Don't have API keys?** For details on creating API keys, see [Api Credential Guide](docs/api-credentials.md)

## Installation Methods

Local Development Installation

#### Step-by-Step Installation

1. **Clone the Repository**

```bash
git clone https://github.com/translated/lara-n8n.git
cd lara-n8n
```

2. **Install and Use Correct Node Version**

If you have nvm installed:

```bash
nvm install
nvm use
```

Otherwise, ensure you have Node.js 20.15+ installed:

```bash
node --version  # Should be 20.15 or higher
```

3. **Install Dependencies**

```bash
pnpm install
```

4. **Build the Project**

```bash
pnpm build
```

This compiles TypeScript to JavaScript and processes assets.

5. **Link the Package Globally**

```bash
pnpm link --global
```

6. **Link to n8n Custom Nodes**

Create the custom nodes directory if it doesn't exist:

```bash
mkdir -p ~/.n8n/custom
cd ~/.n8n/custom
```

Link the package:

```bash
pnpm link --global n8n-nodes-lara-translate
```

7. **Start n8n**

```bash
n8n start
```

8. **Verify Installation**

- Open n8n in your browser (usually `http://localhost:5678`)
- Create a new workflow
- Search for "Lara Translate" in the node search
- The node should appear with the Lara logo

#### Development Workflow

When making changes to the source code:

```bash
pnpm dev

pnpm build
```

After rebuilding, restart n8n to see the changes:

```bash
# Stop n8n (Ctrl+C in the terminal)
# Start again
n8n start
```

## Next Steps

Now that you have the node installed, you're ready to:

1. **[Configure Lara N8N in your workflow](configuration.md)** - Set up authentication
2. **[Translate text](operations/translate-text.md)** - Learn text translation
3. **[Translate documents](operations/translate-document.md)** - Learn document translation
