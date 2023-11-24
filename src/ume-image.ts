import { Ume } from ".";
import { ProviderKind } from "./types";

export class Ume_Image {
  private _ume;

  constructor({ ume }: { ume: Ume }) {
    this._ume = ume;
  }

  url({ provider, filename }: { provider: ProviderKind; filename: string }) {
    return this._ume.sc.image(filename);
  }
}
