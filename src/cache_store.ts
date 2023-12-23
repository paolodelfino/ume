import { UStore } from "pustore";

export class Cache_Store<T> {
  private _expiry_offset!: number;
  private _max_entries!: number;
  private readonly _store;

  constructor() {
    this._store = new UStore<{
      key: string;
      data: T;
      interacts: number;
    }>();
  }

  async init({
    identifier,
    kind,
    expiry_offset,
    max_entries,
  }: Omit<Parameters<typeof this._store.init>["0"], "middlewares"> & {
    expiry_offset: number;
    max_entries: number;
  }) {
    this._expiry_offset = expiry_offset;
    this._max_entries = max_entries;
    await this._store.init({
      identifier,
      kind,
      middlewares: {
        async get(store, key) {
          await store.update(key, {
            interacts: ++(await store.get(key))!.interacts,
          });
          return key;
        },
      },
    });
  }

  import(store: string) {
    return this._store.import(store);
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
    if ((await this._store.length()) >= this._max_entries) {
      const less = (await this._store.all()).sort(
        (a, b) => a.interacts - b.interacts
      )[0];
      await this._store.rm(less.key);
    }

    return this._store.set(
      key,
      { key, data: value, interacts: 0 },
      {
        expiry: Date.now() + this._expiry_offset,
      }
    );
  }

  async all() {
    return (await this._store.all()).map((e) => e.data);
  }
}
