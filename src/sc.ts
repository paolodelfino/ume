import { Publicity } from "pastebin-api";
import { Ume } from ".";
import { conn_exists } from "./utils";

export class SC {
  readonly TG_BOT = "https://t.me/BelloFigoIlRobot";
  private _ume;
  private _url!: string;
  image_endpoint!: string;

  constructor({ ume }: { ume: Ume }) {
    this._ume = ume;
  }

  async init() {
    const paste_tld = (
      await this._ume.pastebin.getPastesByUser({
        userKey: this._ume.pastebin_token,
        limit: 1,
      })
    )[0];
    console.assert(paste_tld.paste_title == "sc_tld");

    this.url = await this._ume.pastebin.getRawPasteByKey({
      pasteKey: paste_tld.paste_key,
      userKey: this._ume.pastebin_token,
    });
  }

  get url() {
    return this._url;
  }

  private set url(tld) {
    this._url = `https://streamingcommunity.${tld}`;
    this.image_endpoint = `${this.url.replace(
      "https://",
      "https://cdn."
    )}/images`;
  }

  async check_url() {
    return await conn_exists(`${this.url}/api/search`);
  }

  async update_url(tld: string) {
    const paste_tld = (
      await this._ume.pastebin.getPastesByUser({
        userKey: this._ume.pastebin_token,
        limit: 1,
      })
    )[0];
    console.assert(paste_tld.paste_title == "sc_tld");

    this._ume.pastebin.deletePasteByKey({
      pasteKey: paste_tld.paste_key,
      userKey: this._ume.pastebin_token,
    });

    this._ume.pastebin.createPaste({
      name: "sc_tld",
      publicity: Publicity.Private,
      apiUserKey: this._ume.pastebin_token,
      code: tld,
    });

    this.url = tld;
    return await this.check_url();
  }

  async report_outdated_url() {
    await this._ume.report.send({
      title: "Url is outdated",
      description: `"${this._ume.sc.url}" needs to be updated`,
    });
  }
}
