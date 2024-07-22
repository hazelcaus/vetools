import { tryExecute } from "./command"

const isWin = process.platform === "win32"

export async function killPort(port: string | number) {
    const pid = await findPid(port)

    return killPid(pid)
}

export async function killPid(pid: number = NaN) {
    if (isNaN(pid)) {
        return
    }

    return tryExecute(undefined, killPidCommand(pid)).then(() => undefined)
}

export async function findPid(port: string | number): Promise<number> {
    const result = await tryExecute(undefined, findPidCommand(port))

    return parsePid(result.cmdOutput)
}

function killPidCommand(pid: number): string {
    return isWin ? `taskkill /PID ${pid} /F` : `kill -TERM ${pid}`
}

function findPidCommand(port: string | number): string {
    return isWin
        ? `netstat -ano -p tcp | find "LISTENING" | findstr /r /c:":${port} *[^ ]*:[^ ]*"`
        : `lsof -i tcp:${port} | grep LISTEN | awk '{print $2}'`
}

function parsePid(stdout: string): number {
    const pid = stdout.match(/\s*\d+\s+$/)

    return pid ? parseInt(pid[0].trim(), 10) : Number.NaN
}
