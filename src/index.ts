import { TMDBNodeApi } from "tmdb-js-node";
import { SC } from "./sc";
import { Title_Details, Title_Search } from "./types";
import { Ume_Title } from "./ume-title";

export class Ume {
  sc;
  tmdb;
  title;

  constructor({ tmdb_api_key }: { tmdb_api_key: string }) {
    this.tmdb = new TMDBNodeApi(tmdb_api_key);
    this.sc = new SC({ ume: this });
    this.title = new Ume_Title({ ume: this });
  }
}

export type { Title_Details, Title_Search };
