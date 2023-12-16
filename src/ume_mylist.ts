import { UStore } from "pustore";
import str_compare from "string-comparison";
import { Title_Mylist } from "./types";

export class Ume_Mylist {
  private _store;
  private __cache_all: Title_Mylist[] = [];
  private _need_recache = false;

  constructor() {
    this._store = new UStore<Title_Mylist>({
      identifier: "mylist",
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

  add(entry: Title_Mylist) {
    this._store.set({ key: `${entry.id}`, value: entry });
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

  search({
    query,
    max_results = 10,
  }: {
    query: string;
    max_results?: number;
  }): Title_Mylist[] {
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
