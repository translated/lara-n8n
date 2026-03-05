# Translate Text

> **← Back to [Configuration Guide](configuration.md)** for installation and configuration instructions.

## Overview

Translates text from a source language to a target language. It supports single-sentence translations, context-aware translations, adaptation to specific translation memories and glossaries, and customizable translation instructions.

## Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| **text** | string | The text to be translated. Maximum length: 10,000,000 characters. |
| **target** | string | Target language code (e.g., `en` for English, `it` for Italian). |

## Optional Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **source** | string | Autodetect | Source language code. When omitted, Lara automatically detects the source language. |

## Additional Options

These options are available under the **Additional Options** and **Additional Options For Translate Text** sections in the node editor.

### Translation Style

Controls the translation approach. Choose the style that best matches your content type.

| Style | Description | Best For |
|-------|-------------|----------|
| `faithful` (default) | Precise, literal translation that closely preserves the original structure and wording. | Legal documents, technical manuals, regulatory content, contracts. |
| `fluid` | Natural, flowing translation that reads smoothly in the target language. | General content, emails, articles, blog posts. |
| `creative` | Adapted, creative translation that may restructure content for impact. | Marketing copy, slogans, creative writing, advertising. |

### Instructions

**Type**: string (supports multiple values)

Instructions are natural-language directives that guide Lara's translation process. They allow you to control formality, tone, terminology, and other aspects of the translation.

You can add multiple instructions — each one is sent as a separate entry. Click **Add Instruction** in the node editor to add more.

**Examples of useful instructions:**

- `"Use formal register"` — ensures polite/formal phrasing (e.g., "vous" in French, "Lei" in Italian)
- `"Translate 'bank' as financial institution, not river bank"` — disambiguates polysemous terms
- `"Keep brand names untranslated"` — preserves proper nouns like "iPhone", "Google", etc.
- `"Use technical medical terminology"` — ensures domain-specific vocabulary
- `"Address the reader informally"` — uses casual tone (e.g., "tu" in French, "du" in German)

### Content Type

| Value | Description |
|-------|-------------|
| `text/plain` (default) | Normal text. Suitable for most use cases. |
| `application/xliff+xml` | XLIFF localization files. Use this when translating XLIFF-formatted content for software localization workflows. |

### No Trace (Incognito Mode)

**Type**: boolean — **Default**: `false`

When enabled, neither the source text nor the translation will be stored on Lara's servers. Useful for sensitive or confidential content such as personal data, legal documents, or proprietary information.

### Use Cache

**Type**: boolean — **Default**: `false`

When enabled, translations are cached so that identical requests return instantly without re-translating. This is an advanced feature and is not enabled by default.

Caching is useful when:
- You translate the same content repeatedly (e.g., UI strings, template messages)
- You want to reduce API calls and improve response times in high-volume workflows

### Cache TTL (Seconds)

**Type**: number — **Default**: `63,072,000` (2 years) — **Minimum**: `60`

Only visible when **Use Cache** is enabled. Controls how long a cached translation remains valid before being evicted. Set a shorter TTL for content that changes frequently.

### Timeout (Milliseconds)

**Type**: number — **Default**: `30,000` — **Minimum**: `1,000` — **Maximum**: `30,000`

Maximum time to wait for a translation response. If the translation is not completed within this time, the request will fail. The default of 30 seconds is sufficient for most text translations.

### Glossaries

**Type**: multi-select (dynamically loaded)

Select one or more glossaries to apply during translation. Glossaries are loaded dynamically from your Lara Translate account — any glossary you have created in [Lara's dashboard](https://laratranslate.com) will appear in the dropdown.

Glossaries enforce specific term translations (e.g., always translate "cloud" as "nuvola" in Italian), ensuring consistency across your content.

### Translation Memories

**Type**: multi-select (dynamically loaded)

Select one or more translation memories to adapt the translation. Like glossaries, these are loaded dynamically from your Lara account.

Translation memories store previously approved translations. When Lara finds a match, it adapts the new translation to be consistent with your past translations, maintaining a uniform voice across all your content.

## Response Fields

A successful text translation returns the following JSON output:

| Field | Type | Description |
|-------|------|-------------|
| `translation` | string | The translated text. |
| `sourceLanguage` | string | The detected or specified source language code. |
| `contentType` | string | The content type of the response (e.g., `text/plain`). |
| `adaptedTo` | string[] | List of translation memory IDs that were used. Only present when memories are selected. |
| `glossaries` | string[] | List of glossary IDs that were used. Only present when glossaries are selected. |
| `adaptedToMatches` | object[] | Detailed matches from translation memories, including matched sentences and scores. |
| `glossariesMatches` | object[] | Detailed matches from glossaries, including matched terms and their translations. |

## Usage Example

A typical text translation configuration:

1. Add the **Lara Translate** node to your workflow
2. Select **Translate Text** as the operation
3. Set **Source Language** to `Autodetect` (or a specific language)
4. Set **Target Language** to your desired language (e.g., `Italian`)
5. Enter or map the text to translate in the **Text to Translate** field
6. Optionally, expand **Additional Options** to set a translation style, add glossaries, or enable no-trace mode

**Example output:**

```json
{
  "translation": "Benvenuto nella nostra piattaforma!",
  "sourceLanguage": "en",
  "contentType": "text/plain"
}
```

For more details on supported languages see [supported-languages.md](supported-languages.md)

For more information about these fields, refer to the [official documentation](https://developers.laratranslate.com/docs/translate-text).
