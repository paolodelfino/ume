import { config } from "dotenv";
import "fake-indexeddb/auto";
import path from "path";

config({
  path: path.resolve(process.cwd(), "../", ".env"),
});

class Memory_Storage implements Storage {
  _data: Record<string, string | undefined> = {};
  length: number = 0;

  key(index: number): string | null {
    return Object.keys(this._data)[index] || null;
  }

  getItem(key: string) {
    return this._data[key] ?? null;
  }

  setItem(key: string, value: string) {
    this._data[key] = value;
  }

  removeItem(key: string) {
    delete this._data[key];
  }

  clear() {
    this._data = {};
  }
}

globalThis.localStorage = new Memory_Storage();

export const time = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function conn_exists(url: string) {
  try {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 2000);

    try {
      await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
      });
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }

    return true;
  } catch (error) {
    return false;
  }
}
