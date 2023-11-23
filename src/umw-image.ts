import { UMW } from ".";

export class UMW_Image {
  private _umw;

  constructor({ umw }: { umw: UMW }) {
    this._umw = umw;
  }

  url({ filename }: { filename: string }) {
    return this._umw.sc.image(filename);
  }
}
