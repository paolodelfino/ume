import { UStore } from "pustore";
import { Ume } from ".";
import { Title_Details, Title_Entry } from "./types";

export class Ume_Mylist {
  private _ume;
  private _store;

  constructor({ ume }: { ume: Ume }) {
    this._ume = ume;
    this._store = new UStore<Title_Entry>({
      identifier: "mylist",
      kind: "local",
    });
  }

  get length() {
    return this._store.length;
  }

  add(entry: Title_Entry) {
    this._store.set({ key: entry.id + entry.slug, value: entry });
  }

  rm(entry: Title_Entry) {
    this._store.rm(entry.id + entry.slug);
  }

  get(quantity: number) {
    return this._store
      .all()
      .slice(0, quantity)
      .map((entry) => this._ume.title.details(entry));
  }

  data: Title_Details[] = [];

  get pages() {
    return Math.ceil(this.length / 10);
  }

  is_loading = false;

  async next(page: number) {
    this.is_loading = true;

    const entries = this._store.all().slice(page * 10, ++page * 10);
    for (const entry of entries) {
      this.data.push(await this._ume.title.details(entry));
    }

    this.is_loading = false;
  }

  // async search({ name, max_results = 3 }: { name: string; max_results?: number }) {

  // }

  // search_next
}
