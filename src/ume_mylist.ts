import { UStore } from "pustore";
import str_compare from "string-comparison";
import { Ume } from ".";
import { Title_Mylist } from "./types";

export class Ume_Mylist {
  private _ume;
  private _store;
  private __cache_all: Title_Mylist[] = [];
  private _need_recache = false;

  constructor({ ume }: { ume: Ume }) {
    this._ume = ume;
    this._store = new UStore<Title_Mylist>({
      identifier: "mylist",
      kind: "local",
    });
  }

  get length() {
    return this._store.length;
  }

  get _cache_all() {
    if (this._need_recache) {
      this._need_recache = false;
      this.__cache_all = this._store.all();
    }
    return this.__cache_all;
  }

  add(entry: Title_Mylist) {
    this._store.set({ key: entry.id + entry.slug, value: entry });
    this._need_recache = true;
  }

  rm(entry: Title_Mylist) {
    this._store.rm(entry.id + entry.slug);
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
      .map(({ index, rating, member }) => all[index]);
  }
}
