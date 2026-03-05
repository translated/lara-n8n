# Translate Document

> **← Back to [Configuration Guide](configuration.md)** for installation and configuration instructions.

## Overview

Translates a document from a source language to a target language while preserving the original formatting. The node handles the entire workflow automatically: uploading the file, polling for completion, and downloading the translated document.

## How Document Translation Works

Document translation is a multi-step process that the node handles transparently:

1. **Upload** — The document is uploaded to Lara's translation API
2. **Translate** — Lara processes the document server-side
3. **Poll** — The node checks the translation status at regular intervals
4. **Download** — Once complete, the translated document is downloaded and returned as binary data

Large documents may take several minutes to process. The node will wait up to **15 minutes** for translation to complete before timing out.

## Required Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **target** | string | — | Target language code (e.g., `en` for English, `it` for Italian). |
| **binaryPropertyName** | string | `data` | The name of the binary property containing the file to translate. Use the "Read Binary File" node or an HTTP Request node to load the file first. |
| **documentName** | string | — | The name of the document including its extension (e.g., `report.docx`, `invoice.pdf`). The extension tells Lara what file format to expect. |

## Optional Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **source** | string | Autodetect | Source language code. When omitted, Lara automatically detects the source language. |

## Additional Options

These options are available under the **Additional Options** and **Additional Options For Translate Document** sections in the node editor.

### Output Format

**Type**: options

This option is only relevant when translating PDF files. By default, PDF files are translated and returned as DOCX. To receive a PDF back, add this option from Additional Options and select `pdf`.

For all other file formats (DOCX, XLSX, PPTX, HTML, etc.), the translated document is returned in the same format as the source.

### Translation Style

Controls the translation approach. Choose the style that best matches your content type.

| Style | Description | Best For |
|-------|-------------|----------|
| `faithful` (default) | Precise, literal translation that closely preserves the original structure and wording. | Legal documents, technical manuals, regulatory content, contracts. |
| `fluid` | Natural, flowing translation that reads smoothly in the target language. | General content, emails, articles, blog posts. |
| `creative` | Adapted, creative translation that may restructure content for impact. | Marketing copy, slogans, creative writing, advertising. |

### No Trace (Incognito Mode)

**Type**: boolean — **Default**: `false`

When enabled, neither the source document nor the translation will be stored on Lara's servers. Useful for sensitive or confidential documents such as contracts, personal data, or proprietary materials.

### Glossaries

**Type**: multi-select (dynamically loaded)

Select one or more glossaries to apply during translation. Glossaries are loaded dynamically from your Lara Translate account — any glossary you have created in [Lara's dashboard](https://laratranslate.com) will appear in the dropdown.

Glossaries enforce specific term translations, ensuring consistency across your documents.

### Translation Memories

**Type**: multi-select (dynamically loaded)

Select one or more translation memories to adapt the translation. These are loaded dynamically from your Lara account.

Translation memories store previously approved translations. When Lara finds a match, it adapts the new translation to maintain a uniform voice across all your content.

## Response Fields

A successful document translation returns both JSON data and binary output.

### JSON Output

| Field | Type | Description |
|-------|------|-------------|
| `documentName` | string | The original document name that was provided. |
| `source` | string | The source language code used for translation. |
| `target` | string | The target language code. |

### Binary Output

The translated document is returned as binary data under the `data` property:

| Field | Type | Description |
|-------|------|-------------|
| `data` | string (base64) | The translated document file content as a base64-encoded string. |
| `mimeType` | string | The MIME type of the translated document (e.g., `application/vnd.openxmlformats-officedocument.wordprocessingml.document`). |
| `fileName` | string | The filename of the translated document. |
| `fileExtension` | string | The file extension (e.g., `docx`, `pdf`). |

## Usage Example

To translate a document, you need to first load the file as binary data using another node:

1. Add a **Read Binary File** node (or HTTP Request, Google Drive, etc.) to load the document
2. Connect it to the **Lara Translate** node
3. Select **Translate Document** as the operation
4. Set **Target Language** to your desired language
5. Set **Input Binary Field** to `data` (or whatever binary property your source node uses)
6. Set **Document Name** to the file name with extension (e.g., `report.docx`)

```
[Read Binary File] → [Lara Translate (Translate Document)] → [Write Binary File]
```

The translated document will be available in the output's binary `data` property, ready to be saved with a **Write Binary File** node, uploaded to cloud storage, or sent via email.

For more details on supported languages see [supported-languages.md](supported-languages.md)

For more details on supported formats see [supported-formats.md](supported-formats.md)

For more information about these fields, refer to the [official documentation](https://developers.laratranslate.com/docs/translate-document).
