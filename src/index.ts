import {
  MoviesGetDetailsResponse,
  TMDBNodeApi,
  TVGetDetailsResponse,
} from "tmdb-js-node";
import {
  ApiResponse,
  Episode,
  TitleDataPage,
  TitleDetails,
  TitleSearch,
} from "./types";
import { get, take_match_groups } from "./utils";

class SC_Provider {
  private _url!: string;
  private _image_endpoint!: string;

  constructor() {
    this.url = "https://streamingcommunity.care";
  }

  get url() {
    return this._url;
  }

  get image_endpoint() {
    return this._image_endpoint;
  }

  set url(updated_url) {
    this._url = updated_url;
    this._image_endpoint = `${updated_url.replace(
      "https://",
      "https://cdn."
    )}/images`;
  }

  image(filename: string) {
    return `${this.image_endpoint}/${filename}`;
  }
}

class UMW_Image {
  private _umw;

  constructor({ umw }: { umw: UMW }) {
    this._umw = umw;
  }

  url({ filename }: { filename: string }) {
    return this._umw.sc.image(filename);
  }
}

class UMW_Title {
  private _umw;
  // For future interopabilities
  image;

  constructor({ umw }: { umw: UMW }) {
    this._umw = umw;
    this.image = new UMW_Image({ umw });
  }

  async search({
    name,
    max_results = 3,
  }: {
    name: string;
    max_results?: number;
  }): Promise<TitleSearch[]> {
    const res = JSON.parse(
      await get(`${this._umw.sc.url}/api/search?q=${name}`)
    ) as ApiResponse<TitleSearch>;
    return res.data
      .slice(0, max_results)
      .map((o) => ({ ...o, provider: "sc" }));
  }

  async details({
    id,
    slug,
  }: {
    id: number;
    slug: string;
  }): Promise<TitleDetails> {
    const data = JSON.parse(
      (
        await take_match_groups(
          `${this._umw.sc.url}/titles/${id}-${slug}`,
          new RegExp('<div id="app" data-page="(.+)"><!--', "s"),
          [1]
        )
      )[0]
    ).props as TitleDataPage;

    const {
      plot,
      tmdb_id,
      name,
      quality,
      type,
      release_date,
      status,
      seasons_count,
      seasons,
      trailers,
      images,
      runtime,
    } = data.title;

    const sliders = data.sliders;
    const related =
      sliders.find((slider) => slider.name == "related")?.titles ?? null;

    const detailed_seasons: TitleDetails["seasons"] = [];

    for (const season of seasons) {
      const episodes = take_match_groups(
        `${this._umw.sc.url}/titles/${id}-${slug}/stagione-${season.number}`,
        new RegExp('<div id="app" data-page="(.+)"><!--', "s"),
        [1]
      ).then(
        (res) => JSON.parse(res[0]).props.loadedSeason.episodes as Episode[]
      );

      detailed_seasons.push({
        number: season.number,
        episodes,
      });
    }

    let fromTmdb:
      | Promise<MoviesGetDetailsResponse<"credits"[]>>
      | Promise<TVGetDetailsResponse<"credits"[]>>;
    if (type == "movie") {
      fromTmdb = this._umw.tmdb.v3.movies.getDetails(tmdb_id, {
        append_to_response: ["credits"],
        language: "it-IT",
      });
    } else {
      fromTmdb = this._umw.tmdb.v3.tv.getDetails(tmdb_id, {
        append_to_response: ["credits"],
        language: "it-IT",
      });
    }

    return {
      provider: "sc",
      plot,
      tmdb_id,
      name,
      runtime,
      quality,
      type,
      release_date,
      status,
      seasons_count: seasons_count,
      seasons: detailed_seasons,
      trailers,
      images,
      cast: fromTmdb.then((res) => res.credits.cast),
      genres: fromTmdb.then((res) => res.genres),
      related,
    };
  }
}

export class UMW {
  sc;
  tmdb;
  title;

  constructor({ tmdb_api_key }: { tmdb_api_key: string }) {
    this.tmdb = new TMDBNodeApi(tmdb_api_key);
    this.sc = new SC_Provider();
    this.title = new UMW_Title({ umw: this });
  }
}
