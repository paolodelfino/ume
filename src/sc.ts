import { Ume } from ".";
import { conn_exists } from "./utils";

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
    this.url = await this._ume.pastebin.getRawPasteByKey({
      pasteKey: "GciNrQJJ",
      userKey: this._ume.pastebin_token,
    });
  }

  get url() {
    return this._url;
  }

  set url(tld) {
    this._url = `https://streamingcommunity.${tld}`;
    this.image_endpoint = `${this.url.replace(
      "https://",
      "https://cdn."
    )}/images`;
  }

  async check_url() {
    return await conn_exists(`${this.url}/api/search`);
  }
}
