<div align="center">
  <img src="nodes/LaraTranslate/LaraLogo.svg" alt="Lara Translate Logo" width="200"/>
  
  # Lara Translate for n8n
  
  **Adaptive AI Translation Node for n8n Workflows**
</div>

## About Lara Translate

[Lara](https://developers.laratranslate.com) is a new adaptive translation AI that combines the fluency, reasoning, context handling and instruct capabilities of LLMs with the low hallucination rate and latency of MT. On top of this, Lara is adaptive which means that Lara does not require training, instead is able to adapt to any domain on the fly leveraging previously translated content or context.

This is an n8n community node that lets you use Lara Translate in your n8n workflows for powerful, context-aware translations.

---

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Credentials](#credentials)
- [Compatibility](#compatibility)
- [Usage](#usage)
- [Development & Testing](#development--testing)
- [Project Structure](#project-structure)
- [Resources](#resources)

---

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Features

This node allows you to translate texts or documents quickly and easily within an n8n workflow.

### Main Capabilities

- **Text Translation**: Translate simple text provided as input or .xliff files
- **Document Translation**: Translate documents from other integrations (e.g. Google Drive, Dropbox, etc.)
  - Supports both **local file paths** and **binary data** as input
- **Flexible Output**: Return the translated content as node output, ready for the next steps in the workflow. Two different output formats, binary or buffer.

## Credentials

To use the node, you only need your Lara API [Credentials](https://app.laratranslate.com/account/credentials). If you don't have them, just [Register](https://app.laratranslate.com/login).

## Compatibility

- **Text translations**: Plain text and .xliff files. [More Info](https://developers.laratranslate.com/docs/translate-text)
- **Document translation**: Full list of supported formats is available [here](https://developers.laratranslate.com/docs/supported-languages)

## Usage

1. Get your API credentials from the [Lara Webapp](https://app.laratranslate.com/login)
2. Add the Lara Translate node to your n8n workflow
3. Configure your translation settings

### Important Notes

- PDF translations return a `.docx` file by default
- To get a `.pdf` output, use the `outputFormat` field in options and set it to "pdf"
- The `outputFormat` parameter is only valid when the input is a `.pdf` file

For more information on node features, check the [Lara SDK](https://developers.laratranslate.com).

---

## Development & Testing

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

## Project Structure

```
lara-n8n/
├── credentials/              # API credentials configuration
│   └── LaraTranslateApi.credentials.ts
├── nodes/
│   └── LaraTranslate/       # Main node implementation
│       ├── LaraLogo.svg     # Lara brand logo
│       ├── LaraTranslate.node.ts        # Core node logic
│       ├── LaraTranslate.services.ts    # API service layer
│       ├── LaraTranslate.types.ts       # TypeScript types
│       ├── LaraTranslate.validators.ts  # Input validation
│       ├── LaraTranslate.constants.ts   # Configuration constants
│       ├── LaraTranslate.enums.ts       # Enumeration types
│       └── LaraTranslateDescription.ts  # Node UI description
├── dist/                    # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md
```

## Resources

- [Lara Webapp](https://app.laratranslate.com/login) - Get your API credentials
- [Lara SDK Documentation](https://developers.laratranslate.com) - Full API reference
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/) - n8n integration docs

---

<div align="center">
  Made with ❤️ for the n8n community
</div>
