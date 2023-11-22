import {
  ApiResponse,
  TitleDetails,
  TitleSearch,
  SeasonDataPage,
  TitleDataPage,
} from "./types";
import { get, take_match_groups } from "./utils";
import { TMDBNodeApi } from "tmdb-js-node";

class UMWTitle {
  private _umw;

  constructor({ umw }: { umw: UMW }) {
    this._umw = umw;
  }

  async search({
    name,
    max_results = 3,
  }: {
    name: string;
    max_results?: number;
  }): Promise<TitleSearch[]> {
    const res = JSON.parse(
      await get(`${this._umw._SC_URL}/api/search?q=${name}`)
    ) as ApiResponse<TitleSearch>;
    return res.data.slice(0, max_results);
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
          `${this._umw._SC_URL}/titles/${id}-${slug}`,
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

    const detailedSeasons: TitleDetails["seasons"] = [];

    for (const season of seasons) {
      const seasonData = JSON.parse(
        (
          await take_match_groups(
            `${this._umw._SC_URL}/titles/${id}-${slug}/stagione-${season.number}`,
            new RegExp('<div id="app" data-page="(.+)"><!--', "s"),
            [1]
          )
        )[0]
      ).props.loadedSeason as SeasonDataPage;

      detailedSeasons.push({
        number: season.number,
        episodes: seasonData.episodes,
      });
    }

    const fromTmdb = await this._umw.tmdb.v3.movies.getDetails(tmdb_id, {
      append_to_response: ["credits"],
      language: "it-IT",
    });

    return {
      plot,
      tmdb_id,
      name,
      runtime,
      quality,
      type,
      release_date,
      status,
      seasons_count: seasons_count,
      seasons: detailedSeasons,
      trailers,
      images,
      cast: fromTmdb.credits.cast,
      genres: fromTmdb.genres,
      related,
    };
  }

  // add image field: it automatically combines filename and endpoint. it will be very useful wrappers interopability
}

export class UMW {
  /* private  */_SC_URL;
  /* private  */_SC_IMAGE_ENDPOINT;
  tmdb;

  title;

  constructor({ tmdb_api_key }: { tmdb_api_key: string }) {
    this.tmdb = new TMDBNodeApi(tmdb_api_key);

    this._SC_URL = "https://streamingcommunity.care";
    this._SC_IMAGE_ENDPOINT = `${this._SC_URL.replace(
      "streamingcommunity",
      "cdn.streamingcommunity"
    )}/images`;

    this.title = new UMWTitle({ umw: this });
  }
}
