import { ustore } from "pustore";

export class Ume_Notify<T extends string | object | any[]> {
  private _store!: ustore.Async<
    {
      data: T;
      checked: boolean;
      pinned: boolean;
    },
    "byChecked" | "byPinned"
  >;

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
        {
          name: "byPinned",
          path: "pinned",
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

  /**
   * @param number Starts from 1
   */
  pinned(page: number) {
    return this._store.index("byPinned", {
      mode: "only",
      value: true,
      page,
      reverse: true,
    });
  }

  /**
   * @param number Starts from 1
   */
  unpinned(page: number) {
    return this._store.index("byPinned", {
      mode: "only",
      value: false,
      page,
      reverse: true,
    });
  }

  /**
   * @param number Starts from 1
   */
  page(number: number) {
    return this._store.page(number, { reverse: true });
  }

  async add(data: T) {
    const c1 = await this._store.length();

    const k = await this._store.set({
      data,
      checked: false,
      pinned: false,
    });

    const c2 = await this._store.length();

    console.log(c1, c2, data, await this._store.values());

    return k;
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
