import semver from "semver"
import { Constants, RequiredApps } from "../Constants"
import { get_workspace_root } from "./workspace"
import { Output } from "../Output"
import { execute, try_execute } from "./command"
import { show_ignorable_notification } from "../utils/utils"

export namespace required {
    export interface IRequiredVersion {
        app: string
        isValid: boolean
        version: string
        required_version: string | { min: string; max: string }
    }

    const currentState: { [key: string]: IRequiredVersion } = {}

    const requiredApps = [RequiredApps.node, RequiredApps.npm, RequiredApps.ganache, RequiredApps.truffle]

    export function is_version_valid(version: string, minVersion: string, maxVersion?: string): boolean {
        return (
            !!semver.valid(version) &&
            semver.gte(version, minVersion) &&
            (maxVersion ? semver.lt(version, maxVersion) : true)
        )
    }

    export async function check_apps(...apps: RequiredApps[]): Promise<boolean> {
        // Check required versions
        const versions = await getExactlyVersions(...apps)
        const invalid = versions
            .filter((version) => apps.includes(version.app as RequiredApps))
            .some((version) => !version.isValid)

        Output.output_line("check_apps", `Current state for versions: ${JSON.stringify(versions)} Invalid: ${invalid}`)
        return !invalid
    }

    export async function install_dependencies(should_check_hardhat: boolean = false) {
        await show_ignorable_notification("Setting up a few things. One moment...", async () => {
            if (!(await check_apps(RequiredApps.npm))) {
                throw new Error(`You don't have npm installed. Please install before continuing`)
            }

            if (!(await check_apps(RequiredApps.node))) {
                throw new Error("You don't have node.js installed. Please install it before continuing")
            }

            // if (!(await check_apps(RequiredApps.truffle))) {
            //     await install_truffle()
            // }

            if (!(await check_apps(RequiredApps.ganache))) {
                await install_ganache()
            }

            if (should_check_hardhat) {
                if (!(await check_apps(RequiredApps.hardhat))) {
                    throw new Error("hardhat not available. Did you `npm install`?")
                }
            }
        })
    }

    export async function getAllVersions(): Promise<IRequiredVersion[]> {
        return getExactlyVersions(...requiredApps)
    }

    export async function getExactlyVersions(...apps: RequiredApps[]): Promise<IRequiredVersion[]> {
        if (apps.includes(RequiredApps.node)) {
            currentState.node = currentState.node || (await create_version_object(RequiredApps.node, get_node_version))
        }
        if (apps.includes(RequiredApps.npm)) {
            currentState.npm = currentState.npm || (await create_version_object(RequiredApps.npm, get_npm_version))
        }
        if (apps.includes(RequiredApps.truffle)) {
            currentState.truffle =
                currentState.truffle || (await create_version_object(RequiredApps.truffle, get_truffle_version))
        }
        if (apps.includes(RequiredApps.ganache)) {
            currentState.ganache =
                currentState.ganache || (await create_version_object(RequiredApps.ganache, getGanacheVersion))
        }
        if (apps.includes(RequiredApps.hardhat)) {
            currentState.hardhat =
                currentState.hardhat || (await create_version_object(RequiredApps.hardhat, getHardhatVersion))
        }

        return Object.values(currentState)
    }

    export async function get_node_version(): Promise<string> {
        return await get_version(RequiredApps.node, "--version", /v(\d+.\d+.\d+)/)
    }

    export async function get_npm_version(): Promise<string> {
        return await get_version(RequiredApps.npm, "--version", /(\d+.\d+.\d+)/)
    }

    export async function get_truffle_version(): Promise<string> {
        const required_version = Constants.requiredVersions[RequiredApps.truffle]
        const min_required_version = required_version.min
        const majorVersion = min_required_version.split(".")[0]

        const global_version = (
            await try_execute(get_workspace_root(true), `npm list -g --depth 0 truffle`)
        ).cmdOutput.match(/truffle@(\d+.\d+.\d+)/)

        return (
            (global_version && global_version[1]) ||
            (await get_version("truffle", "version", /(?<=Truffle v)(\d+.\d+.\d+)/))
        )
    }

    export async function getGanacheVersion(): Promise<string> {
        const required_version = Constants.requiredVersions[RequiredApps.ganache]
        const min_required_version = required_version.min
        const majorVersion = min_required_version.split(".")[0]

        const global_version = (
            await try_execute(get_workspace_root(true), `npm list -g --depth 0 ganache-cli`)
        ).cmdOutput.match(/ganache-cli@(\d+.\d+.\d+)/)

        return (
            (global_version && global_version[1]) ||
            (await get_version(RequiredApps.ganache, "--version", /v(\d+.\d+.\d+)/))
        )
    }

    export async function getHardhatVersion(): Promise<string> {
        const required_version = Constants.requiredVersions[RequiredApps.ganache]
        const min_required_version = required_version.min
        const majorVersion = min_required_version.split(".")[0]

        const localVersion = (
            await try_execute(get_workspace_root(true), `npm list --depth 0 hardhat`)
        ).cmdOutput.match(/hardhat@(\d+.\d+.\d+)/)

        return (
            (localVersion && localVersion[1]) ||
            (await get_version(RequiredApps.ganache, "--version", /v(\d+.\d+.\d+)/))
        )
    }

    export async function install_npm(): Promise<void> {
        try {
            await install_via_npm(RequiredApps.npm, Constants.requiredVersions[RequiredApps.npm])
        } catch (error) {
            Output.output_line(Constants.outputChannel.requirements, (error as Error).message)
        }

        currentState.npm = await create_version_object(RequiredApps.npm, get_npm_version)
    }

    export async function install_truffle(): Promise<void> {
        try {
            await install_via_npm(RequiredApps.truffle, Constants.requiredVersions[RequiredApps.truffle], true)
        } catch (error) {
            Output.output_line(Constants.outputChannel.requirements, (error as Error).message)
        }

        currentState.truffle = await create_version_object(RequiredApps.truffle, get_truffle_version)
    }

    export async function install_ganache(): Promise<void> {
        try {
            await install_via_npm(RequiredApps.ganache, Constants.requiredVersions[RequiredApps.ganache], true)
        } catch (error) {
            Output.output_line(Constants.outputChannel.requirements, (error as Error).message)
        }

        currentState.ganache = await create_version_object(RequiredApps.ganache, getGanacheVersion)
    }

    async function create_version_object(
        app_name: string,
        versionFunc: () => Promise<string>
    ): Promise<IRequiredVersion> {
        const version = await versionFunc()
        const required_version = Constants.requiredVersions[app_name]
        const min_required_version = required_version.min
        const max_required_version = required_version.max
        const is_valid = is_version_valid(version, min_required_version, max_required_version)

        return {
            app: app_name,
            isValid: is_valid,
            required_version,
            version,
        }
    }

    async function install_via_npm(
        package_name: string,
        package_version: string | { min: string; max: string },
        is_global: boolean = true
    ): Promise<void> {
        const versionString =
            typeof package_version === "string"
                ? `^${package_version}`
                : `>=${package_version.min} <${package_version.max}`

        const workspaceRoot = get_workspace_root(true)

        if (workspaceRoot === undefined && !is_global) {
            throw new Error(Constants.errorMessageStrings.WorkspaceShouldBeOpened)
        }

        await execute(workspaceRoot, "npm", "i", is_global ? "-g" : "", `${package_name}@"${versionString}"`)
    }

    async function get_version(program: string, command: string, matcher: RegExp): Promise<string> {
        try {
            const result = await try_execute(undefined, program, command)
            if (result.code === 0) {
                const output = result.cmdOutput || result.cmdOutputIncludingStderr
                const installedVersion = output.match(matcher)
                const version = semver.clean(installedVersion ? installedVersion[1] : "")

                return version || ""
            }
        } catch (error) {}

        return ""
    }
}
