import { UStore } from "pustore";
import { Ume } from ".";
import { Title_Mylist } from "./types";

export class Ume_Mylist {
  private _ume;
  private _store;

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

  add(entry: Title_Mylist) {
    this._store.set({ key: entry.id + entry.slug, value: entry });
  }

  rm(entry: Title_Mylist) {
    this._store.rm(entry.id + entry.slug);
  }

  get(quantity: number) {
    return this._store.all().slice(0, quantity);
  }

  get pages() {
    return Math.ceil(this.length / 10);
  }

  next(page: number) {
    return this._store.all().slice(page * 10, ++page * 10);
  }

  // async search({ name, max_results = 3 }: { name: string; max_results?: number }) {

  // }

  // search_next
}
