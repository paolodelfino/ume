import { UStore } from "pustore";
import str_compare from "string-comparison";
import { Title_Continue_Watching } from "./types";

export class Ume_Continue_Watching {
  private _store;
  private __cache_all: Title_Continue_Watching[] = [];
  private _need_recache = false;

  constructor() {
    this._store = new UStore<Title_Continue_Watching>({
      identifier: "continue_watching",
      kind: "local",
    });
  }

  get length() {
    return this._store.length;
  }

  private get _cache_all() {
    if (this._need_recache) {
      this._need_recache = false;
      this.__cache_all = this._store.all;
    }
    return this.__cache_all;
  }

  time({
    id,
    season_number,
    episode_number,
  }: {
    id: number;
    season_number?: number;
    episode_number?: number;
  }) {
    const entry = this._store.get(`${id}`);
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

  update(entry: Title_Continue_Watching) {
    this._store.set(`${entry.id}`, entry);
    this._need_recache = true;
  }

  rm(id: number) {
    this._store.rm(`${id}`);
    this._need_recache = true;
  }

  some(quantity: number) {
    return this._cache_all.slice(0, quantity);
  }

  get pages() {
    return Math.ceil(this.length / 10);
  }

  next(page: number) {
    return this._cache_all.slice(page * 10, ++page * 10);
  }

  search({ query, max_results = 10 }: { query: string; max_results?: number }) {
    const all = this._cache_all;
    return str_compare.levenshtein
      .sortMatch(
        query,
        all.map(({ slug }) => slug)
      )
      .reverse()
      .filter(({ rating }) => rating >= 0.1)
      .map(({ index }) => all[index])
      .slice(0, max_results);
  }
}
