import { Ume } from ".";

export class Ume_Mylist {
  private _ume;

  constructor({ ume }: { ume: Ume }) {
    this._ume = ume;
  }

  add({ id, slug }: { id: number; slug: string }) {
    const mylist = JSON.parse(this._ume.db.getItem("mylist") ?? "{}");
    delete mylist[id + slug];

    this._ume.db.setItem("mylist", JSON.stringify(mylist));
  }

  remove({ id, slug }: { id: number; slug: string }) {
    const mylist = JSON.parse(this._ume.db.getItem("mylist") ?? "{}");
    delete mylist[id + slug];

    this._ume.db.setItem("mylist", JSON.stringify(mylist));
  }

  get({ id, slug }: { id: number; slug: string }) {
    const as_str = this._ume.db.getItem(id + slug)!;
    if (as_str) {
    }

    return null;
  }
}
