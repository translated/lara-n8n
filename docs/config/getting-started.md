---
title: Getting Started
sidebar_position: 1
---

# Getting Started

This guide will help you install and set up the Lara Translate node for n8n.

## Requirements

Before you begin, ensure you have the following:

- **Node.js** version 22.20.0 or higher
- **pnpm** - Package manager (install with `npm install -g pnpm`)
- **n8n** - Installed globally (`npm install -g n8n`)
- **nvm** (optional) - Node version manager for easy Node.js version switching 
- **Lara Translate API credentials** (Access Key ID and Access Key Secret)

💡 **Don't have API keys?** For details on creating API keys, see [API Credentials Guide](api-credentials.md)

## Installation Methods

### Install verified community nodes

**Recommended for most users** - Install directly from the n8n interface:

1. **Open the nodes panel**
   Go to the Canvas and click the `+` button (or press `Tab`)

2. **Search for Lara Translate**
   Type "Lara Translate" in the search bar. You'll see a "More from the community" section at the bottom

3. **View node details**
   Click on the Lara Translate node to see all supported operations and actions

4. **Install the node**  
   Click the **Install** button. The node will be installed for your entire instance and available to all team members

5. **Start using it**  
   Add the Lara Translate node to your workflows and [configure Lara for n8n](configuration.md)

> **💡 Tip:** For detailed installation instructions and troubleshooting, see the official [n8n community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/)

### Local Development Installation

#### Step-by-Step Installation

1. **Install NVM (Node Version Manager)**

If you don't have NVM installed, follow the installation guide for your operating system:
[NVM Installation Guide](https://github.com/nvm-sh/nvm)

2. **Install pnpm**

```bash
npm install -g pnpm
```

3. **Install n8n Globally**

```bash
npm install n8n -g
```

4. **Clone the Repository**

```bash
git clone https://github.com/translated/lara-n8n.git
cd lara-n8n
```

5. **Install and Use Correct Node Version**

If you have nvm installed:

```bash
nvm install
nvm use
```

Otherwise, ensure you have Node.js 22.20.0+ installed:

```bash
node --version  # Should be 22.20.0 or higher
```

6. **Install Dependencies**

```bash
pnpm install
```

7. **Build the Project**

```bash
pnpm build
```

8. **Link the Package Globally**

```bash
pnpm link
```

9. **Link to n8n Custom Nodes**

Create the custom nodes directory if it doesn't exist:

```bash
mkdir -p ~/.n8n/custom
cd ~/.n8n/custom
pnpm init
```

Link the package:

```bash
pnpm link n8n-nodes-lara-translate
```

10. **Start n8n**

```bash
n8n start
```

11. **Verify Installation**

- Open n8n in your browser (usually `http://localhost:5678`)
- Create a new workflow
- Search for "Lara Translate" in the node search
- The node should appear with the Lara logo

#### Development Workflow

When making changes to the source code:

```bash
pnpm build
```

After rebuilding, restart n8n to see the changes:

```bash
# Stop n8n (Ctrl+C in the terminal)
# Start again
n8n start
```

## Next Steps

**[Configure the Lara Translate node](configuration.md)** - Set up authentication and basic node configuration.
