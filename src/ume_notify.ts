import { ustore } from "pustore";

export class Ume_Notify<T extends string | object | any[]> {
  private _store!: ustore.Async<
    {
      checked: boolean;
      data: T;
    },
    "byChecked"
  >;

  async init(identifier: string) {
    this._store = new ustore.Async();
    await this._store.init(`notify-${identifier}`, {
      indexes: [
        {
          name: "byChecked",
          path: "checked",
        },
      ],
    });
  }

  checked() {
    return this._store.index_only("byChecked", true);
  }

  unchecked() {
    return this._store.index_only("byChecked", false);
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
