import PasteClient from "pastebin-api";
import { TMDBNodeApi } from "tmdb-js-node";
import { SC } from "./sc";
import { Ume_Continue_Watching } from "./ume_continue_watching";
import { Ume_Mylist } from "./ume_mylist";
import { Ume_Title } from "./ume_title";

export class Ume {
  tmdb;
  pastebin;
  pastebin_token;
  sc;
  title;
  mylist;
  continue_watching;

  constructor({
    tmdb_api_key,
    pastebin_api_key,
    pastebin_name,
    pastebin_password,
  }: {
    tmdb_api_key: string;
    pastebin_api_key: string;
    pastebin_name: string;
    pastebin_password: string;
  }) {
    this.tmdb = new TMDBNodeApi(tmdb_api_key);
    this.pastebin = new PasteClient(pastebin_api_key);
    this.pastebin_token = this.pastebin.login({
      name: pastebin_name,
      password: pastebin_password,
    });
    this.sc = new SC({ ume: this });
    this.title = new Ume_Title({ ume: this });
    this.mylist = new Ume_Mylist();
    this.continue_watching = new Ume_Continue_Watching();
  }

  init(){
    // pastebin_token from Promise<string> to string; call sc's init
  }
}
