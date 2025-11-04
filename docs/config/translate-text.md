---
title: Translate Text
sidebar_position: 3
---

# Translate Text

> **← Back to [Getting Started Guide](configuration.md)** for installation and configuration instructions.

## Overview

Translates text from a source language to a target language. It supports single-sentence translations, context-aware translations and adaptation to specific translation memories.

## Supported Fields

### Required Parameters

- **text** - The text to be translated (string or array)
- **target** - Target language code

### Optional Parameters

- **source** - Source language code (auto-detected if not specified)
- **contentType** - Content type (text/plain, application/xliff+xml)
- **instructions** - Custom instructions to guide the translation
- **timeoutMs** - Maximum time to wait for translation response (in milliseconds)
- **useCache** - Whether to use cached translations if available
- **cacheTTL** - Time-to-live for cache entries (in seconds)
- **glossaries** - List of glossary IDs to apply
- **adaptTo** - Translation memory IDs to adapt the translation
- **noTrace** - No trace option (Incognito mode)
- **style** - Translation style preference (faithful, fluid, creative)

For more details on supported languages ​​see [supported-languages.md](supported-languages.md)

For more information about these fields, refer to the [official documentation](https://developers.laratranslate.com/docs/translate-text).
