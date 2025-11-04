---
title: Translate Document
sidebar_position: 4
---

# Translate Document

> **← Back to [Getting Started Guide](configuration.md)** for installation and configuration instructions.

## Translate Method

The SDK contains a translate method that simplifies the process of translating documents by uploading the file, checking the status at regular intervals, and returning the result of the download function.

## Supported Fields

### Required Parameters

- **target** - Target language code
- **inputSource** - Input source type (path or binary)
- **documentPath** - File path to the document (required when inputSource is "path")
- **binaryPropertyName** - Binary field name (required when inputSource is "binary")
- **documentName** - Name of the document

### Optional Parameters

- **source** - Source language code (auto-detected if not specified)
- **outputFormat** - Output format for the translated document (pdf)
  - **PDF Format Handling:** Lara returns the translated document in the same format as the source file, except for files in `.pdf` format. By default, PDF files are translated and returned in `.docx` format. To obtain a `.pdf` file from a `.pdf` document, you must explicitly set the "output format" parameter to "pdf"
- **password** - PDF file password (if password protected)
- **glossaries** - List of glossary IDs to apply
- **adaptTo** - Translation memory IDs to adapt the translation
- **noTrace** - No trace option (Incognito mode)
- **style** - Translation style preference (faithful, fluid, creative)

For more details on supported languages ​​see [supported-languages.md](supported-languages.md)

For more details on supported formats ​​see [supported-formats.md](supported-formats.md)

For more information about these fields, refer to the [official documentation](https://developers.laratranslate.com/docs/translate-document).

