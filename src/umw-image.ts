import { UMW } from ".";
import { ProviderKind } from "./types";

export class UMW_Image {
  private _umw;

  constructor({ umw }: { umw: UMW }) {
    this._umw = umw;
  }

  url({ provider, filename }: { provider: ProviderKind; filename: string }) {
    return this._umw.sc.image(filename);
  }
}
