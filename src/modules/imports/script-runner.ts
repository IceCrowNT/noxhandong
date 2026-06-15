import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export function readJsonFromScriptOutput(output: string) {
  const end = output.lastIndexOf("}");
  if (end < 0) {
    throw new Error(`Không đọc được kết quả script: ${output.slice(0, 500)}`);
  }

  const candidateStarts = Array.from(output.matchAll(/\{/g))
    .map((match) => match.index)
    .filter((index): index is number => typeof index === "number");

  for (const start of candidateStarts.reverse()) {
    try {
      return JSON.parse(output.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      // Some CLI dependencies print text containing braces before the JSON result.
    }
  }

  throw new Error(`Không đọc được kết quả script: ${output.slice(0, 500)}`);
}

export async function runProjectScript(scriptPath: string, args: string[]) {
  const { stdout } = await execFileAsync(process.execPath, [scriptPath, ...args], {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  return readJsonFromScriptOutput(stdout);
}
