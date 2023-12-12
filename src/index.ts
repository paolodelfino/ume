import { TMDBNodeApi } from "tmdb-js-node";
import { SC } from "./sc";
import { Ume_Continue_Watching } from "./ume_continue_watching";
import { Ume_Mylist } from "./ume_mylist";
import { Ume_Title } from "./ume_title";

export class Ume {
  tmdb;
  sc;
  title;
  mylist;
  continue_watching;

  constructor({ tmdb_api_key }: { tmdb_api_key: string }) {
    this.tmdb = new TMDBNodeApi(tmdb_api_key);
    this.sc = new SC();
    this.title = new Ume_Title({ ume: this });
    this.mylist = new Ume_Mylist();
    this.continue_watching = new Ume_Continue_Watching();
  }
}
