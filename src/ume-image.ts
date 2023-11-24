import { Ume } from ".";

export class Ume_Image {
  private _ume;

  constructor({ ume }: { ume: Ume }) {
    this._ume = ume;
  }

  url({ filename }: { filename: string }) {
    return `${this._ume.sc.image_endpoint}/${filename}`;
  }
}
