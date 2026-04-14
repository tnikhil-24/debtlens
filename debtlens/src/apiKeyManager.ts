import * as vscode from 'vscode';

const SECRET_KEY    = 'debtlens.userApiKey';
const PROVIDER_KEY  = 'debtlens.userProvider';

export type UserProvider = 'groq' | 'openai' | 'anthropic';

export class ApiKeyManager {
  constructor(private secrets: vscode.SecretStorage) {}

  async getUserKey(): Promise<string | undefined> {
    return await this.secrets.get(SECRET_KEY);
  }

  async getUserProvider(): Promise<UserProvider> {
    const p = await this.secrets.get(PROVIDER_KEY);
    return (p as UserProvider) ?? 'groq';
  }

  async promptForKey(): Promise<boolean> {
    const provider = await vscode.window.showQuickPick(
      [
        { label: 'Groq',      description: 'Free + fastest (gsk_...)',   value: 'groq'      },
        { label: 'OpenAI',    description: 'GPT-4o mini (sk-...)',        value: 'openai'    },
        { label: 'Anthropic', description: 'Claude Haiku (sk-ant-...)',   value: 'anthropic' },
      ],
      { placeHolder: 'Select AI provider for unlimited use' }
    );
    if (!provider) { return false; }

    const key = await vscode.window.showInputBox({
      prompt: `Paste your ${provider.label} API key`,
      password: true,
      placeHolder:
        provider.value === 'openai'    ? 'sk-...'     :
        provider.value === 'anthropic' ? 'sk-ant-...' : 'gsk_...',
      validateInput: v =>
        v.trim().length > 10 ? null : 'Key seems too short',
    });
    if (!key) { return false; }

    await this.secrets.store(SECRET_KEY,   key.trim());
    await this.secrets.store(PROVIDER_KEY, provider.value);

    vscode.window.showInformationMessage(
      `DebtLens: ${provider.label} key saved — unlimited AI explanations enabled.`
    );
    return true;
  }

  async clearKey(): Promise<void> {
    await this.secrets.delete(SECRET_KEY);
    await this.secrets.delete(PROVIDER_KEY);
    vscode.window.showInformationMessage(
      'DebtLens: API key removed. Back to 10 free explanations/day.'
    );
  }
}