import { UStore } from "pustore";
import str_compare from "string-comparison";
import { Title_Continue_Watching } from "./types";

type Import_Export = {
  store: string;
};

export class Ume_Continue_Watching {
  private _store;
  private __cache_all: Title_Continue_Watching[] = [];
  private _need_recache = false;

  constructor() {
    this._store = new UStore<Title_Continue_Watching>();
  }

  async init() {
    await this._store.init({
      identifier: "continue_watching",
      kind: "indexeddb",
    });
  }

  async import_store(stores: Import_Export) {
    for (const key in stores) {
      // @ts-ignore
      await this[`_${key}`].import(stores[key]);
    }
  }

  async export_store(): Promise<Import_Export> {
    return {
      store: await this._store.export(),
    };
  }

  async length() {
    return await this._store.length();
  }

  private async _cache_all() {
    if (this._need_recache) {
      this._need_recache = false;
      this.__cache_all = await this._store.all();
    }
    return this.__cache_all;
  }

  async time({
    id,
    season_number,
    episode_number,
  }: {
    id: number;
    season_number?: number;
    episode_number?: number;
  }) {
    const entry = await this._store.get(`${id}`);
    if (!entry) {
      return null;
    }

    if (
      (!season_number && !episode_number) ||
      (entry.season_number == season_number &&
        entry.episode_number == episode_number)
    ) {
      return entry.time;
    }

    return null;
  }

  async update(entry: Title_Continue_Watching) {
    await this._store.set(`${entry.id}`, entry);
    this._need_recache = true;
  }

  async rm(id: number) {
    await this._store.rm(`${id}`);
    this._need_recache = true;
  }

  async some(quantity: number) {
    return (await this._cache_all()).slice(0, quantity);
  }

  async pages() {
    return Math.ceil((await this.length()) / 10);
  }

  async next(page: number) {
    return (await this._cache_all()).slice(page * 10, ++page * 10);
  }

  async search({
    query,
    max_results = 10,
  }: {
    query: string;
    max_results?: number;
  }): Promise<Title_Continue_Watching[]> {
    const all = await this._cache_all();
    return str_compare.levenshtein
      .sortMatch(
        query,
        all.map(({ slug }) => slug)
      )
      .filter(({ rating }) => rating >= 0.1)
      .reverse()
      .map(({ index }) => all[index])
      .slice(0, max_results);
  }
}
