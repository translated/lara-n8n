# Lara Translate for n8n
Official n8n community node for [Lara Translate](https://laratranslate.com), enabling powerful translation capabilities with support for language detection, context-aware translations, translation memories and glossaries.

## Table of Contents

- [Installation](#installation)
- [Local Installation](#local-installation)
- [Resources](#resources)

---

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Local Installation

To test the node in development mode:

```bash
# Install n8n globally
npm install n8n -g

# Navigate to the project directory
cd /path/to/lara-n8n

# Install and use the correct Node version
nvm install
nvm use

# Install dependencies
pnpm install

# Build the project
pnpm build

# Link the package
pnpm link

# Link to n8n custom nodes
cd ~/.n8n/custom/
pnpm link lara-n8n

# Start n8n
n8n start
```

## Resources

- [Lara](https://laratranslate.com)
- [Lara API Documentation](https://developers.laratranslate.com)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

\
Made with ❤️ for the n8n community.
