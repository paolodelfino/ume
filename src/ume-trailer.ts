import { UME } from ".";
import { ProviderKind } from "./types";

export class UME_Trailer {
  private _ume;

  constructor({ ume }: { ume: UME }) {
    this._ume = ume;
  }

  url({ provider, key }: { provider: ProviderKind; key: string }) {
    return this._ume.sc.trailer(key);
  }

  iframe({ url, className }: { url: string; className: string }) {
    return `
<iframe
  className="${className}"
  src="${url}"
  title="YouTube video player"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowfullscreen
></iframe>`;
  }
}
