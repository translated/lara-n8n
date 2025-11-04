<div align="center">

# 🌐 Lara Translate for n8n

Official n8n community node for [Lara Translate](https://laratranslate.com), enabling powerful translation capabilities with support for language detection, context-aware translations, translation memories and glossaries.

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/translated/lara-n8n)
[![n8n Community Node](https://img.shields.io/badge/n8n-Community%20Node-blueviolet.svg)](https://www.npmjs.com/package/n8n-nodes-lara-translate)

</div>

---

## 📑 Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Resources](#resources)

## Requirements

- **Node.js** version 22.20.0 or higher
- **pnpm** - Package manager (install with `npm install -g pnpm`)
- **n8n** - Installed globally (`npm install -g n8n`)
- **nvm** (optional) - Node version manager for easy Node.js version switching 
- **Lara Translate API credentials** (Access Key ID and Access Key Secret)

## Installation

### Install via n8n Community Nodes

> **💡 Tip:** For detailed installation instructions and troubleshooting, see the official [n8n community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/)

### Local Development

> **📖 For setup instructions, see [Getting Started](docs/config/getting-started.md)**

## Quick Start

### 1. Configure Credentials

Before using the node, you need to configure your Lara Translate API credentials:

1. In your n8n workflow, add the **Lara Translate** node
2. Click on **Credentials** and create new credentials
3. Enter your **Access Key ID** and **Access Key Secret**

💡 **Don't have API keys?** For details on creating API keys, see [API Credentials Guide](docs/config/api-credentials.md)

> **📖 For detailed configuration, see [Configuration Guide](docs/config/configuration.md)**

### 2. Choose Your Operation

The node supports two main operations:

#### Translate Text
Translate plain text or XLIFF content with full control over style, caching, and advanced options.

> **📖 Learn more: [Text Translation Guide](docs/config/translate-text.md)**

#### Translate Document
Translate documents in various formats (PDF, DOCX, PPTX, XLSX, etc.) while preserving formatting.

> **📖 Learn more: [Document Translation Guide](docs/config/translate-document.md)**

## Documentation

### 📖 Documentation Flow

Follow this recommended reading path:

1. **[Getting Started](docs/config/getting-started.md)** → Install the node (locally or via n8n)
2. **[Configuration](docs/config/configuration.md)** → Set up API credentials and basic settings
3. **Choose your operation:**
   - **[Translate Text](docs/config/translate-text.md)** → For text content translation
   - **[Translate Document](docs/config/translate-document.md)** → For document translation

**Reference Guides:**
- [API Credentials Setup](docs/config/api-credentials.md) - Detailed guide for obtaining API keys
- [Supported Languages](docs/config/supported-languages.md) - 150+ supported languages
- [Supported File Formats](docs/config/supported-formats.md) - Document format specifications

## Resources

- [Lara](https://laratranslate.com)
- [Lara API Documentation](https://developers.laratranslate.com)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

<div align="center">

Made with ❤️ by [Translated](https://translated.com) for the n8n community

</div>
