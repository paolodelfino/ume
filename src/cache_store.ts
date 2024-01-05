import { ustore } from "pustore";

export class Cache_Store<T> {
  private _store!: ustore.Async<{
    key: string;
    data: T;
    interacts: number;
  }>;

  private _expiry_offset!: number;
  private _max_entries!: number;
  private _refresh?: (entry: T) => Promise<T>;

  async init(
    identifier: string,
    {
      expiry_offset,
      max_entries,
      refresh,
      migrate,
      version,
    }: Omit<
      NonNullable<Parameters<typeof this._store.init>["1"]>,
      "middlewares"
    > & {
      expiry_offset: number;
      max_entries: number;
      refresh?: (entry: T) => Promise<T>;
    }
  ) {
    this._expiry_offset = expiry_offset;
    this._max_entries = max_entries;
    this._refresh = refresh;

    this._store = new ustore.Async();
    await this._store.init(identifier, {
      middlewares: {
        get: async (store, key) => {
          await this.renew(key, false);

          return key;
        },
      },
      migrate,
      version,
    });
  }

  import(set: Awaited<ReturnType<typeof this.export>>, merge?: boolean) {
    return this._store.import(set, merge);
  }

  export() {
    return this._store.export();
  }

  has(key: string) {
    return this._store.has(key);
  }

  async get(key: string) {
    return (await this._store.get(key))?.data;
  }

  async set(key: string, value: T) {
    const store_len = await this._store.length();
    if (store_len >= this._max_entries) {
      const byLess = (await this._store.values()).sort(
        (a, b) => a.interacts - b.interacts
      );

      for (let i = 0; i < store_len - this._max_entries + 1; ++i) {
        await this._store.rm(byLess[i].key);
      }
    }

    return this._store.set(
      key,
      { key, data: value, interacts: 0 },
      {
        expiry: Date.now() + this._expiry_offset,
      }
    );
  }

  async values() {
    return (await this._store.values()).map((e) => e.data);
  }

  async renew(key: string, data: boolean = true) {
    const entry = await this._store.get(key);
    if (entry) {
      await this._store.update(
        key,
        {
          interacts: ++entry.interacts,
        },
        {
          expiry: Date.now() + this._expiry_offset,
        }
      );

      if (data && this._refresh) {
        await this._store.update(key, {
          data: await this._refresh(entry.data),
        });
      }
    }
  }
}
