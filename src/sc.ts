import { assert } from "chai";
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
    const paste_tld = (await this._ume.pastebin.get("sc_tld"))!;
    assert.isDefined(
      paste_tld,
      "For some reason, we haven't been able to retrieve the paste 'sc_tld'"
    );

    this.url = paste_tld;
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
    await this._ume.pastebin.delete("sc_tld");

    this._ume.pastebin.create({
      name: "sc_tld",
      content: tld,
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
