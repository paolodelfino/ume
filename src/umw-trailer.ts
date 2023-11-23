import { UMW } from ".";
import { ProviderKind } from "./types";

export class UMW_Trailer {
  private _umw;

  constructor({ umw }: { umw: UMW }) {
    this._umw = umw;
  }

  url({ provider, key }: { provider: ProviderKind; key: string }) {
    return this._umw.sc.trailer(key);
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
