import { Ume } from ".";

export class Ume_Store {
  private _ume;

  constructor({ ume }: { ume: Ume }) {
    this._ume = ume;
  }

  import(stores: ReturnType<typeof this.export>) {
    for (const category in stores) {
      // @ts-ignore
      this._ume[category].import_store(stores[category]);
    }
  }

  export() {
    return {
      title: this._ume.title.export_store(),
      mylist: this._ume.mylist.export_store(),
      continue_watching: this._ume.continue_watching.export_store(),
    };
  }
}
