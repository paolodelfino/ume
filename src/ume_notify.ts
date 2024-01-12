import { ustore } from "pustore";

export class Ume_Notify<T extends string | object | any[]> {
  private _unarchived!: ustore.Async<T>;
  private _archived!: ustore.Async<T>;
  private _store!: ustore.Async<{
    opened: boolean;
    data: T;
  }, "byOpened">;

  archived_updated = false;
  unarchived_updated = false;

  async init() {
    this._unarchived = new ustore.Async();
    await this._unarchived.init("notify_unarchived");

    this._archived = new ustore.Async();
    await this._archived.init("notify_archived");

    this._store = new ustore.Async()
    await this._store.init("notify", {
      indexes: [{
        name:"byOpened",path:"opened",
      }]
    })
  }

  archived() {
    await this._store.index_only("byOpened", true)
    
    this.archived_updated = false;
    return this._archived.values();
  }

  unarchived() {
    this.unarchived_updated = false;
    return this._unarchived.values();
  }

  async notify(key: string, data: T) {
    await this._unarchived.set(key, data);

    this.unarchived_updated = true;
  }

  async unarchive(key: string) {
    const data = await this._archived.consume(key);
    this.archived_updated = true;

    if (data) {
      await this._unarchived.set(key, data);
      this.unarchived_updated = true;
    }
  }

  async archive(key: string) {
    const data = await this._unarchived.consume(key);
    this.unarchived_updated = true;

    if (data) {
      await this._archived.set(key, data);
      this.archived_updated = true;
    }
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
      _archived: await this._archived.export(),
      _unarchived: await this._unarchived.export(),
    };
  }
}
