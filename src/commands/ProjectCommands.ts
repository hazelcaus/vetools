import fs from "fs-extra"
import path from "path"
import { Uri, workspace } from "vscode"
import { Constants } from "../Constants"
import { required, outputCommandHelper, getWorkspaceRoot } from "../helpers"
import { copy_folders, showIgnorableNotification, showOpenFolderDialog } from "../utils/utils"
import IoHelpers from "../utils/ioHelpers"

export namespace ProjectCommands {
    export async function newProject() {
        await required.installDependencies()

        const project_path = await chooseNewProjectDir()

        await createProject(project_path)
    }

    export async function createWallet() {
        const walletName = await IoHelpers.enterString("Wallet name")
        if (!walletName) {
            return
        }
    }
}

async function chooseNewProjectDir(): Promise<string> {
    const project_path = await showOpenFolderDialog()

    await fs.ensureDir(project_path)
    const files = await fs.readdir(project_path)

    // Temporarily disable for Gitpod
    // if(files.length) {
    //     const answer = await window.showErrorMessage(
    //         Constants.errorMessageStrings.DirectoryIsNotEmpty,
    //         Constants.informationMessage.openButton,
    //         Constants.informationMessage.cancelButton
    //     );

    //     if(answer === Constants.informationMessage.openButton) {
    //         return chooseNewProjectDir();
    //     } else {
    //         throw new CancellationEvent();
    //     }
    // }

    return project_path
}

async function createProject(project_path: string) {
    await showIgnorableNotification("Creating new VeTools project", async () => {
        try {
            const from = path.join(Constants.templates_directory, "hardhat")
            copy_folders(from, project_path)

            console.debug("workspace.workspaceFolder:", workspace.workspaceFolders)
            workspace.updateWorkspaceFolders(0, workspace.workspaceFolders ? workspace.workspaceFolders.length : null, {
                uri: Uri.file(project_path),
            })
            console.debug("workspace.workspaceFolder:", workspace.workspaceFolders)
        } catch (error) {
            fs.emptyDirSync(project_path)
            throw new Error(`Could not create project. 'createProject' failed: ${(error as Error).message}`)
        }
    })

    await showIgnorableNotification("Installing dependencies", async () => {
        try {
            // npm install
            await outputCommandHelper.execute(project_path, "npm", "install -f")
        } catch (err) {
            throw new Error(
                `Failed to set up dependencies. Do you have npm configured correctly? ${(err as Error).message}`
            )
        }
    })

    await required.installDependencies()
}
