import { UME } from ".";
import { ProviderKind } from "./types";

export class UME_Image {
  private _ume;

  constructor({ ume }: { ume: UME }) {
    this._ume = ume;
  }

  url({ provider, filename }: { provider: ProviderKind; filename: string }) {
    return this._ume.sc.image(filename);
  }
}
