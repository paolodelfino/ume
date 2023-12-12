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
      this.__cache_all = this._store.all();
    }
    return this.__cache_all;
  }

  time({
    id,
    slug,
    season_number,
    episode_number,
  }: {
    id: number;
    slug: string;
    season_number?: number;
    episode_number?: number;
  }) {
    const entry = this._store.get(id + slug);
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

  update({
    id,
    slug,
    season_number,
    episode_number,
    new_time,
  }: Omit<Title_Continue_Watching, "time" | "images"> & {
    new_time: number;
  }) {
    this._store.set({
      key: id + slug,
      value: {
        id,
        slug,
        season_number,
        episode_number,
        time: new_time,
      },
    });
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

  search({ query }: { query: string }) {
    const all = this._cache_all;
    return str_compare.levenshtein
      .sortMatch(
        query,
        all.map(({ slug }) => slug)
      )
      .reverse()
      .filter(({ rating }) => rating >= 0.1)
      .map(({ index }) => all[index]);
  }
}