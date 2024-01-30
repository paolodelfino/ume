import { ustore } from "pustore";

type Notify<T> = {
  data: T;
  checked: boolean;
  pinned: boolean;
};

export class Ume_Notify<T extends string | object | any[]> {
  private _store!: ustore.Async<Notify<T>, "byChecked">;
  private _extra_space: number = 0;

  get last_modified() {
    return this._store.last_modified;
  }

  /**
   * @param page_sz Defaults to 20
   */
  async init(
    identifier: string,
    options?: {
      page_sz?: number;
    }
  ) {
    this._store = new ustore.Async();
    await this._store.init(`notify-${identifier}`, {
      indexes: [
        {
          name: "byChecked",
          path: "checked",
        },
      ],
      autoincrement: true,
      page_sz: options?.page_sz ?? 20,
    });
  }

  /**
   * @param page Starts from 1
   */
  checked(page: number) {
    return this._store.index("byChecked", {
      mode: "only",
      value: true,
      page,
      reverse: true,
    });
  }

  /**
   * @param page Starts from 1
   */
  unchecked(page: number) {
    return this._store.index("byChecked", {
      mode: "only",
      value: false,
      page,
      reverse: true,
    });
  }

  add(data: T) {
    return this._store.set({
      data,
      checked: false,
      pinned: false,
    });
  }

  rm(id: ustore.Key) {
    return this._store.rm(id);
  }

  check(id: ustore.Key) {
    return this._store.update(id, { value: { checked: true } });
  }

  uncheck(id: ustore.Key) {
    return this._store.update(id, { value: { checked: false } });
  }

  pin(id: ustore.Key) {
    return this._store.update(id, { value: { pinned: true } });
  }

  unpin(id: ustore.Key) {
    return this._store.update(id, { value: { pinned: false } });
  }

  /**
   * @param page Starts from 1
   */
  async page(page: number) {
    const all = await this._store.values(true);
    const checked = [];
    const unchecked = [];
    let count = this._store.pagejn;

    return {
      has_next: checked.has_next || unchecked.has_next,
      results: [...checked.results, ...unchecked.results],
    };
  }

  async import(
    stores: Awaited<ReturnType<typeof this.export>>,
    merge?: boolean
  ) {
    for (const key in stores) {
      // @ts-ignore
      await this[key].import(stores[key], merge);
    }
  }

  async export() {
    return {
      _store: await this._store.export(),
    };
  }
}
