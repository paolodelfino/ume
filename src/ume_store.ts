import { Ume } from ".";

export class Ume_Store {
  private _ume;

  constructor({ ume }: { ume: Ume }) {
    this._ume = ume;
  }

  async import(stores: Awaited<ReturnType<typeof this.export>>) {
    for (const category in stores) {
      // @ts-ignore
      await this._ume[category].import_store(stores[category]);
    }
  }

  async export() {
    return {
      title: await this._ume.title.export_store(),
      mylist: await this._ume.mylist.export_store(),
      continue_watching: await this._ume.continue_watching.export_store(),
    };
  }
}
