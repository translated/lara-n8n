<div align="center">

# 🌐 Lara Translate for n8n

Official n8n community node for [Lara Translate](https://laratranslate.com), enabling powerful translation capabilities with support for language detection, context-aware translations, translation memories and glossaries.

[![Version](https://img.shields.io/badge/version-0.1.2-blue.svg)](https://github.com/translated/lara-n8n)
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

- **Node.js** version 20.15 or higher
- **pnpm** - Package manager (install with `npm install -g pnpm`)
- **n8n** - Installed globally (`npm install -g n8n`)
- **nvm** (optional) - Node version manager for easy Node.js version switching 
- **Lara Translate API credentials** (Access Key ID and Access Key Secret)

## Installation

### Install via n8n Community Nodes

> 📖 See the official [n8n community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/)

### Local Development

> 📖 For setup instructions, see [Getting Started](docs/config/getting-started.md)

## Quick Start

### Before You Begin

To use this node you need:

- An account on [Lara Translate](https://laratranslate.com) (you can start for free)
- Your API credentials (Access Key ID and Access Key Secret)

> 💡 **Don't have API credentials yet?** Follow our [API Credentials Guide](docs/config/api-credentials.md)

### Step 1: Add the Node to Your Workflow

1. Open or create a new workflow in n8n
2. Click the **+** button to open the nodes menu
3. Search for **"Lara Translate"** in the search bar
4. Click on the node to add it to the canvas

### Step 2: Configure Credentials

The first time you use the node, you need to configure your credentials:

1. In the Lara Translate node, click **Select Credential** → **Create New**
2. Enter your credentials:
    - **Access Key ID**: your public key
    - **Access Key Secret**: your secret key
3. Click **Save** to save the credentials

### Step 3: Choose What to Translate

The node offers **2 translation modes**:

#### 🔤 **Translate Text** - For texts and short content

Perfect for translating:

- Messages and notifications
- Dynamic content from other nodes
- XLIFF format texts
- Strings from databases or APIs

**Practical example**: Automatically translate customer emails into your language before archiving them.

#### 📄 **Translate Document** - For files and documents

Perfect for translating:

- PDF, Word, Excel, PowerPoint
- HTML and XML files
- Documents while maintaining original formatting

**Practical example**: Automatically translate documents uploaded by users and save them to a specific folder.

### Step 4: Configure the Translation

Basic settings you need to configure:

1. **Source Language**: The language of the original text
    - Use **"Detect language"** if you don't know the source language
2. **Target Language**: The language you want to translate to
    - Choose from over 200 available languages
3. **Input Content**:
    - **For Text Translation**: Enter the text directly or map it from previous nodes
    - **For Document Translation**: Use binary data from previous nodes (e.g., "Read Binary File" node)

### Step 5: Test and Activate

1. Click **Execute Node** (or **Test Step**) to try the translation
2. Check the result in the **OUTPUT** section
3. If everything is OK, connect the node to other steps in your workflow
4. Activate the workflow by clicking the switch in the top right

***

### 🎯 Quick Example

Want to translate text from English to Italian?

1. Add the **Lara Translate** node
2. Select **Translate Text**
3. Set:
    - Source Language: **English**
    - Target Language: **Italian**
    - Text: enter or map the text to translate
4. Click **Execute Node** and get the translation!

***

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
- [Supported Languages](docs/config/supported-languages.md) - 200+ supported languages
- [Supported File Formats](docs/config/supported-formats.md) - Document format specifications

## Resources

- [Lara](https://laratranslate.com)
- [Lara API Documentation](https://developers.laratranslate.com)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

<div align="center">

Made with ❤️ by [Translated](https://translated.com) for the n8n community

</div>
