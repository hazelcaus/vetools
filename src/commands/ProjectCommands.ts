import fs from "fs-extra"
import path from "path"
import { Uri, workspace } from "vscode"
import { Constants } from "../Constants"
import { required, outputCommandHelper, get_workspace_root } from "../helpers"
import { copy_folders, show_ignorable_notification, show_open_folder_dialog } from "../utils/utils"
import { Output } from "../Output"

export namespace ProjectCommands {
    export async function new_project(): Promise<void> {
        await required.install_dependencies()

        const project_path = await choose_new_project_dir()

        await create_project(project_path)
    }
}

async function choose_new_project_dir(): Promise<string> {
    const project_path = await show_open_folder_dialog()

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
    //         return choose_new_project_dir();
    //     } else {
    //         throw new CancellationEvent();
    //     }
    // }

    return project_path
}

async function create_project(project_path: string): Promise<void> {
    await show_ignorable_notification("Creating new Vetools project", async () => {
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
            throw new Error(`Could not create project. 'create_project' failed: ${(error as Error).message}`)
        }
    })

    await show_ignorable_notification("Project created! Installing local dependencies...", async () => {
        try {
            // npm install
            await outputCommandHelper.execute(project_path, "npm", "install")
        } catch (err) {
            Output.output_line("vetools", `'npm install' failed. Skipping.... Error: ${err}`)
            await show_ignorable_notification(
                "Failed to install dependencies. Try manually by running `npm i` or `yarn` in the root of the newly created directory",
                async () => {
                    await new Promise((resolve) => setTimeout(resolve, 5000))
                }
            )
        }
    })

    await required.install_dependencies()
}
