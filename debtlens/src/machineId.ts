import * as vscode from 'vscode';
import * as crypto from 'crypto';

const KEY = 'debtlens.machineId';

export async function getMachineId(
  context: vscode.ExtensionContext
): Promise<string> {
  const existing = context.globalState.get<string>(KEY);
  if (existing) { return existing; }

  const id = crypto.randomBytes(16).toString('hex');
  await context.globalState.update(KEY, id);
  return id;
}