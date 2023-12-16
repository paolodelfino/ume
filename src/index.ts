import _sendgrid from "@sendgrid/mail";
import PasteClient from "pastebin-api";
import { TMDBNodeApi } from "tmdb-js-node";
import { SC } from "./sc";
import { Ume_Continue_Watching } from "./ume_continue_watching";
import { Ume_Mylist } from "./ume_mylist";
import { Ume_Report } from "./ume_report";
import { Ume_Title } from "./ume_title";

export class Ume {
  tmdb!: TMDBNodeApi;
  pastebin!: PasteClient;
  pastebin_token!: string;
  sendgrid!: typeof _sendgrid;
  report!: Ume_Report;
  sc!: SC;
  title!: Ume_Title;
  mylist!: Ume_Mylist;
  continue_watching!: Ume_Continue_Watching;

  async init({
    tmdb_api_key,
    pastebin_api_key,
    pastebin_name,
    pastebin_password,
    sendgrid_api_key,
  }: {
    tmdb_api_key: string;
    pastebin_api_key: string;
    pastebin_name: string;
    pastebin_password: string;
    sendgrid_api_key: string;
  }) {
    this.tmdb = new TMDBNodeApi(tmdb_api_key);

    this.pastebin = new PasteClient(pastebin_api_key);
    this.pastebin_token = await this.pastebin.login({
      name: pastebin_name,
      password: pastebin_password,
    });

    this.sendgrid = _sendgrid;
    this.sendgrid.setApiKey(sendgrid_api_key);

    this.report = new Ume_Report({ ume: this });

    this.sc = new SC({ ume: this });
    await this.sc.init();

    this.title = new Ume_Title({ ume: this });
    this.mylist = new Ume_Mylist();
    this.continue_watching = new Ume_Continue_Watching();
  }
}
