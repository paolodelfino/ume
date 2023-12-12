import { Ume } from ".";

export class SC {
  private _ume;
  private _url!: string;
  image_endpoint!: string;
  trailer_endpoint;

  constructor({ ume }: { ume: Ume }) {
    this._ume = ume;
    this.trailer_endpoint = "https://www.youtube-nocookie.com/embed";
  }

  async init() {
    this.url =
      "https://streamingcommunity." +
      (await this._ume.pastebin.getRawPasteByKey({
        pasteKey: "GciNrQJJ",
        userKey: await this._ume.pastebin_token,
      }));
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
