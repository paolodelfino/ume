import { TMDBNodeApi } from "tmdb-js-node";
import { Cache_Store } from "./cache_store";
import { SC } from "./sc";
import { Search_Suggestion } from "./search_suggestion";
import { Ume_Continue_Watching } from "./ume_continue_watching";
import { Ume_Following } from "./ume_following";
import { Ume_Mylist } from "./ume_mylist";
import { Ume_Notify } from "./ume_notify";
import { Ume_Pastebin } from "./ume_pastebin";
import { Ume_Person } from "./ume_person";
import { Ume_Report } from "./ume_report";
import { Ume_Seasons } from "./ume_seasons";
import { Ume_Sliders_Queue } from "./ume_sliders_queue";
import { Ume_Store } from "./ume_store";
import { Ume_Title } from "./ume_title";

export class Ume {
  store!: Ume_Store;
  tmdb!: TMDBNodeApi;

  report!: Ume_Report;

  pastebin!: Ume_Pastebin;

  sc!: SC;

  _search_history!: Cache_Store<string>;
  search_suggestion!: Search_Suggestion;

  title!: Ume_Title;
  person!: Ume_Person;
  seasons!: Ume_Seasons;

  mylist!: Ume_Mylist;
  continue_watching!: Ume_Continue_Watching;
  following!: Ume_Following;
  notify!: typeof Ume_Notify;

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

    this.pastebin = new Ume_Pastebin();
    await this.pastebin.init({
      pastebin_api_key,
      pastebin_name,
      pastebin_password,
    });

    this.sc = new SC({ ume: this });
    await this.sc.init();

    this._search_history = new Cache_Store();
    await this._search_history.init("search_history", {
      expiry_offset: 2 * 7 * 24 * 60 * 60 * 1000,
      max_entries: 75,
    });
    this.search_suggestion = new Search_Suggestion({
      get_queries: () => this._search_history.values(),
      renew_query: (key) => this._search_history.renew(key),
    });

    this.title = new Ume_Title();
    await this.title.init({ ume: this });
    this.person = new Ume_Person();
    await this.person.init({ ume: this });
    this.seasons = new Ume_Seasons();
    await this.seasons.init({ ume: this });

    this.mylist = new Ume_Mylist();
    await this.mylist.init({ ume: this });
    this.continue_watching = new Ume_Continue_Watching();
    await this.continue_watching.init({ ume: this });
    this.following = new Ume_Following();
    await this.following.init({
      ume: this,
      check_frequency: 1 * 60 * 60 * 1000,
    });
    this.notify = Ume_Notify;
  }
}

export { Ume_Seasons, Ume_Sliders_Queue };
