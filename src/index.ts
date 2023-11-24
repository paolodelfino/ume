import { TMDBNodeApi } from "tmdb-js-node";
import { SC_Provider } from "./sc-provider";
import { TitleDetails, TitleSearch } from "./types";
import { Ume_Title } from "./ume-title";

export class Ume {
  sc;
  tmdb;
  title;

  constructor({ tmdb_api_key }: { tmdb_api_key: string }) {
    this.tmdb = new TMDBNodeApi(tmdb_api_key);
    this.sc = new SC_Provider();
    this.title = new Ume_Title({ ume: this });
  }
}

export type { TitleDetails, TitleSearch };
