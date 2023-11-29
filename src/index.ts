import { TMDBNodeApi } from "tmdb-js-node";
import { SC } from "./sc";
import { Ume_Title } from "./ume_title";

export class Ume {
  sc;
  tmdb;
  title;

  constructor({ tmdb_api_key }: { tmdb_api_key: string }) {
    this.tmdb = new TMDBNodeApi(tmdb_api_key);
    this.sc = new SC();
    this.title = new Ume_Title({ ume: this });
  }
}
