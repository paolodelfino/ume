import { Ume } from ".";

export class SC {
  private _ume;
  private _url!: string;
  image_endpoint!: string;

  constructor({ ume }: { ume: Ume }) {
    this._ume = ume;
    this.url = "https://streamingcommunity.care";
  }

  get url() {
    return this._url;
  }

  set url(updated_url) {
    this._url = updated_url;
    this.image_endpoint = `${updated_url.replace(
      "https://",
      "https://cdn."
    )}/images`;
  }
}
