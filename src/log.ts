let debugEnabled = false;

export function setDebug(on: boolean): void {
  debugEnabled = on;
}

const ts = () => new Date().toISOString().slice(11, 19);

export const log = {
  info(msg: string): void {
    console.error(`[${ts()}] ${msg}`);
  },
  warn(msg: string): void {
    console.error(`[${ts()}] WARN: ${msg}`);
  },
  error(msg: string): void {
    console.error(`[${ts()}] ERROR: ${msg}`);
  },
  debug(msg: string): void {
    if (debugEnabled) console.error(`[${ts()}] DEBUG: ${msg}`);
  },
};
