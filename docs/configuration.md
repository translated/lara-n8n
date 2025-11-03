# Configuration

This guide covers how to configure the Lara Translate node in your n8n workflows, including credential setup and basic node configuration.

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

If you don't have API credentials: see [Api Credential Guide](api-credentials.md)

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
- **Options**: 150+ language codes (en, es, fr, de, it, etc.)
- **Description**: The source language of your content
- **Tip**: Use "Autodetect" if you're unsure or processing content in multiple languages

#### 4. Target Language
- **Required**: Yes
- **Options**: 150+ language codes (en, es, fr, de, it, etc.)
- **Description**: The language you want to translate to
- **Note**: Cannot be empty; must specify a target

### Operation-Specific Configuration

Depending on your chosen operation, additional fields will appear:

- [Translate Text](operations/translate-text.md)
- [Translate Document](operations/translate-document.md)
