import vscode from "vscode"

export async function writeToClipboard(text: string) {
    return vscode.env.clipboard.writeText(text)
}
