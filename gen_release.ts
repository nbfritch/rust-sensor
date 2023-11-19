import { cp, exists, mkdir, rm } from "fs/promises";
import { exec } from "child_process";
import { join } from "path";
import { promisify } from "util";
import process from "process";

const execAsync = promisify(exec);

const relpath = join(import.meta.dir, 'release');

if (await exists(relpath)) {
  await rm(relpath, { recursive: true, force: true });
}

await mkdir(relpath);

const outputExecutablePath = 'target/release/rust_sensor';

if (!(await exists(outputExecutablePath))) {
  const buildResult = await execAsync('cargo build --release');
  if (buildResult.stderr != null) {
    throw new Error(`Got stdout ${buildResult.stderr}`);
  }
}

await cp(outputExecutablePath, join(relpath, 'rust_sensor'));
await cp('templates', relpath, { recursive: true });
await execAsync(`tar -czvf rust_sensor.tar.gz ${relpath}`);

process.exit(0);
