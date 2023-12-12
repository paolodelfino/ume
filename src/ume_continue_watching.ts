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

  exists({
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
    if (!entry) return false;

    if (
      (!season_number || !episode_number) ||
      (entry.season_number == season_number &&
      entry.episode_number == episode_number)
    ) {
      return true;
    }

    return false;
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
    if (!entry)

    if (
      !season_number ||
      !episode_number ||
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
    time,
    season_number,
    episode_number,
    new_time,
  }: {
    id: number;
    slug: string;
    time: number;
    season_number: number;
    episode_number: number;
    new_time: number;
  }) {
    this._store.get(id + slug);
  }

  // check this logic
  add(entry: Title_Continue_Watching) {
    this._store.set({ key: entry.id + entry.slug, value: entry });
    this._need_recache = true;
  }

  rm({ id, slug }: { id: number; slug: string }) {
    this._store.rm(id + slug);
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
