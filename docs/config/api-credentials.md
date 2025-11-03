# How to Obtain Lara API Credentials

This guide walks you through step-by-step how to obtain your API credentials (Access Key ID and Access Key Secret) needed to use the Lara Translate node in n8n.

## Prerequisites

Before you begin, make sure you have:
- An active Lara account (if you don't have one, follow the registration procedure described below)

## Complete Procedure

### 1. Access the Lara Portal

Visit the Lara login page:

**🔗 [https://app.laratranslate.com/login](https://app.laratranslate.com/login)**

### 2. Sign In or Register

You have two options:

#### If you already have an account:
- Enter your credentials (email and password)
- Or use one of the quick login options:
  - Sign in with Google
  - Sign in with Apple
  - Use Single Sign-On

#### If you don't have an account yet:
- Click on "**No account? Create one**"
- Follow the guided registration process
- Complete the registration and verify your email if required

### 3. Access Settings

Once you're logged in:

1. Look in the **top right corner** of the page
2. Click on the **profile icon** (or user menu icon) to open the dropdown menu

### 4. Open the API Credentials Section

From the dropdown menu that opened:

1. Find and click on the **"API Credentials"** option
2. You'll be redirected to the API keys management page

### 5. Create a New API Key

On the API credentials page:

1. Click the button to **create a new API key**
2. The system will automatically generate:
   - **Access Key ID**: your public identifier
   - **Access Key Secret**: your private secret key

> **⚠️ IMPORTANT**: When you create a new API key, the **Access Key Secret** will be shown **only once**. Make sure to copy it and save it in a secure location immediately!

### 6. Save Your Credentials

After creating the API key:

1. **Copy** the **Access Key ID**
2. **Copy** the **Access Key Secret** (remember: you won't see it again!)
3. Store them in a secure location (e.g., a password manager)
4. Use these credentials to configure the Lara Translate node in n8n

## Lost Credentials Recovery

### I Lost My Access Key Secret

If you've already created an API key in the past but no longer remember your **Access Key Secret**:

1. **It's not possible to recover** the original Access Key Secret for security reasons
2. You have two options:
   - **Option A**: Create a new API key following the steps above (recommended)
   - **Option B**: Contact Lara customer support for assistance

### How to Contact Support

For assistance with API credentials:

- 📧 Visit: [https://support.laratranslate.com](https://support.laratranslate.com)

## Credentials Security

> **🔒 Security Recommendations**
> 
> - Never share your Access Key Secret with anyone
> - Don't save credentials in unprotected text files
> - Don't publish credentials on public repositories (GitHub, GitLab, etc.)
> - Periodically rotate your API keys for better security
> - Use password managers or vault systems to store credentials

## API Keys Management

### View Existing API Keys

You can always return to the "API Credentials" section to:
- View all your active API keys
- See the Access Key ID of each key
- Check the creation date
- Manage (delete or disable) keys that are no longer used

### Revoke an API Key

If you suspect your API key has been compromised:

1. Access the "API Credentials" section
2. Find the API key to revoke
3. Click the delete or revoke button
4. Immediately create a new API key
5. Update the credentials in all your n8n workflows

---

**Next Steps**: After obtaining the credentials, see the [Getting Started Guide](getting-started.md) to configure the Lara Translate node in your n8n workflow.

