# Configuration

This guide covers how to configure the Lara Translate node in your n8n workflows, including credential setup, basic node configuration, AI agent integration, and error handling.

## API Credentials Setup

Before using the Lara Translate node, you need to configure your API credentials in n8n.

### Creating New Credentials

1. **Add the Node to Your Workflow**
   - Open or create a workflow in n8n
   - Search for "Lara Translate" in the node search
   - Add the node to your workflow canvas

2. **Open Credentials Configuration**
   - Click on the Lara Translate node
   - In the node panel, find the **Credential to connect with** field
   - Click on the dropdown and select **Create New**

3. **Enter Your API Credentials**
   - **Access Key ID**: Enter your Lara API access key ID
   - **Access Key Secret**: Enter your Lara API access key secret

4. **Save the Credentials**
   - Click **Save** to store your credentials securely
   - The credentials are now available for use in this and other workflows

### Getting API Credentials

If you don't have API credentials: see [API Credentials Guide](api-credentials.md)

## Node Configuration

Once credentials are configured, you can set up the node's operational parameters.

### Basic Configuration

Every translation requires these basic settings:

#### 1. Resource
- **Value**: Translation (default and only option)
- **Description**: Specifies the resource type you're working with

#### 2. Operation
Choose the type of translation:

- **Translate Text**: For translating plain text or XLIFF content
- **Translate Document**: For translating files (PDF, DOCX, etc.)

#### 3. Source Language
- **Default**: Autodetect
- **Options**: 200+ language codes (en, es, fr, de, it, etc.)
- **Description**: The source language of your content
- **Tip**: Use "Autodetect" if you're unsure or processing content in multiple languages

#### 4. Target Language
- **Required**: Yes
- **Options**: 200+ language codes (en, es, fr, de, it, etc.)
- **Description**: The language you want to translate to
- **Note**: Cannot be empty; must specify a target

### Operation-Specific Configuration

Depending on your chosen operation, additional fields will appear:

- [Translate Text](translate-text.md)
- [Translate Document](translate-document.md)

## Glossaries and Translation Memories

Glossaries and translation memories are powerful features that improve translation consistency across your content.

### Glossaries

A glossary is a list of terms with their approved translations. When Lara encounters a glossary term in your source text, it uses the specified translation instead of generating one freely. This is essential for:

- Brand names and product terminology
- Industry-specific jargon
- Company-specific vocabulary

### Translation Memories

A translation memory is a database of previously translated segments (sentences or phrases). When Lara finds a match between your source text and a stored segment, it adapts the translation to be consistent with past translations. This ensures:

- Consistent voice and style across documents
- Faster translations for repetitive content
- Reuse of previously approved translations

### Managing Glossaries and Translation Memories

Glossaries and translation memories are created and managed in your [Lara Translate dashboard](https://laratranslate.com). Once created, they appear dynamically in the node's **Additional Options** dropdowns — no configuration is needed in n8n beyond selecting them.

## AI Agent Workflows

The Lara Translate node has `usableAsTool` enabled, which means it can be used as a tool in [n8n AI Agent workflows](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/). This allows AI agents to autonomously decide when and how to translate content as part of a larger automated process.

To use Lara Translate as an AI Agent tool:

1. Add an **AI Agent** node to your workflow
2. In the Agent's **Tools** section, add the **Lara Translate** node
3. The agent can now invoke translations as needed based on the conversation or task context

This is useful for building multilingual chatbots, automated customer support pipelines, or any workflow where an AI agent needs to translate content dynamically.

## Error Handling

### Continue on Fail

When **Continue on Fail** is enabled on the Lara Translate node (via the node's **Settings** tab), errors will not stop the workflow. Instead, items that fail will produce an output with the following JSON structure:

```json
{
  "error": "Error message describing what went wrong"
}
```

This is useful for batch processing scenarios where you want to translate many items and handle failures gracefully — for example, logging failed translations separately while allowing successful ones to proceed.

When **Continue on Fail** is disabled (the default), any translation error will stop the entire workflow execution.
