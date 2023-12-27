import PasteClient from "pastebin-api";
import { TMDBNodeApi } from "tmdb-js-node";
import { Cache_Store } from "./cache_store";
import { SC } from "./sc";
import { Search_Suggestion } from "./search_suggestion";
import { Ume_Continue_Watching } from "./ume_continue_watching";
import { Ume_Mylist } from "./ume_mylist";
import { Ume_Person } from "./ume_person";
import { Ume_Report } from "./ume_report";
import { Ume_Store } from "./ume_store";
import { Ume_Title } from "./ume_title";

export class Ume {
  store!: Ume_Store;
  tmdb!: TMDBNodeApi;

  report!: Ume_Report;

  pastebin!: PasteClient;
  pastebin_token!: string;

  sc!: SC;

  _search_history!: Cache_Store<string>;
  search_suggestion!: Search_Suggestion;

  mylist!: Ume_Mylist;
  continue_watching!: Ume_Continue_Watching;

  title!: Ume_Title;
  person!: Ume_Person;

  async init({
    tmdb_api_key,
    pastebin_api_key,
    pastebin_name,
    pastebin_password,
    discord_webhook_url,
  }: {
    tmdb_api_key: string;
    pastebin_api_key: string;
    pastebin_name: string;
    pastebin_password: string;
    discord_webhook_url: string;
  }) {
    this.store = new Ume_Store({ ume: this });
    this.tmdb = new TMDBNodeApi(tmdb_api_key);

    this.report = new Ume_Report({
      webhook_url: discord_webhook_url,
    });

    this.pastebin = new PasteClient(pastebin_api_key);
    this.pastebin_token = await this.pastebin.login({
      name: pastebin_name,
      password: pastebin_password,
    });

    this.sc = new SC({ ume: this });
    await this.sc.init();

    this._search_history = new Cache_Store();
    await this._search_history.init({
      identifier: "search_history",
      kind: "indexeddb",
      expiry_offset: 2 * 7 * 24 * 60 * 60 * 1000,
      max_entries: 75,
    });
    this.search_suggestion = new Search_Suggestion({
      get_queries: () => this._search_history.all(),
      renew_query: (key) => this._search_history.renew(key),
    });

    this.mylist = new Ume_Mylist();
    await this.mylist.init({ ume: this });
    this.continue_watching = new Ume_Continue_Watching();
    await this.continue_watching.init({ ume: this });

    this.title = new Ume_Title();
    await this.title.init({ ume: this });
    this.person = new Ume_Person();
    await this.person.init({ ume: this });
  }
}
