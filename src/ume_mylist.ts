import { ustore } from "pustore";
import str_compare from "string-comparison";
import { Ume } from ".";
import { Title_Mylist } from "./types";

export class Ume_Mylist {
  private _ume!: Ume;

  private _store!: ustore.Async<Title_Mylist>;

  private __cache_all: Title_Mylist[] = [];
  private _need_recache = false;

  async init({ ume }: { ume: Ume }) {
    this._ume = ume;

    this._store = new ustore.Async();
    await this._store.init("mylist");
  }

  async import(
    stores: Awaited<ReturnType<typeof this.export>>,
    merge?: boolean
  ) {
    for (const key in stores) {
      // @ts-ignore
      await this[`_${key}`].import(stores[key], merge);
    }
  }

  async export() {
    return {
      store: await this._store.export(),
    };
  }

  async length() {
    return await this._store.length();
  }

  private async _cached_values() {
    if (this._need_recache) {
      this._need_recache = false;
      this.__cache_all = await this._store.values();
    }
    return this.__cache_all;
  }

  async add(entry: Title_Mylist) {
    await this._store.set(`${entry.id}`, entry);
    this._need_recache = true;
  }

  async rm(id: number) {
    await this._store.rm(`${id}`);
    this._need_recache = true;
  }

  async some(quantity: number) {
    return (await this._cached_values()).slice(0, quantity);
  }

  async pages() {
    return Math.ceil((await this.length()) / 10);
  }

  async next(page: number) {
    return (await this._cached_values()).slice(page * 10, ++page * 10);
  }

  /**
   * @param query Limit 256 chars
   * @param max_results Defaults to 10
   */
  async search({
    query,
    max_results = 10,
  }: {
    query: string;
    max_results?: number;
  }): Promise<Title_Mylist[]> {
    query = query.trim();
    if (query.length > 256) {
      throw new Error("query exceeds 256 chars limit");
    }

    await this._ume._search_history.set(query, query);

    const all = await this._cached_values();
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
