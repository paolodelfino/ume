import { Ume } from ".";

export class Ume_Store {
  private _ume;

  constructor({ ume }: { ume: Ume }) {
    this._ume = ume;
  }

  async import(
    stores: Awaited<ReturnType<typeof this.export>>,
    merge?: boolean
  ) {
    for (const category in stores) {
      // @ts-ignore
      await this._ume[category].import(stores[category], merge);
    }
  }

  async export() {
    return {
      title: await this._ume.title.export(),
      mylist: await this._ume.mylist.export(),
      continue_watching: await this._ume.continue_watching.export(),
      person: await this._ume.person.export(),
      _search_history: await this._ume._search_history.export(),
    };
  }
}
