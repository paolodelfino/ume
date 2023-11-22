import { TMDBNodeApi } from "tmdb-js-node";

export class UMW {
  private tmdb;
  SC_URL;
  SC_IMAGE_ENDPOINT;

  constructor({ tmdb_api_key }: { tmdb_api_key: string }) {
    this.tmdb = new TMDBNodeApi(tmdb_api_key);
    this.SC_URL = "https://streamingcommunity.care";
    this.SC_IMAGE_ENDPOINT = `${this.SC_URL.replace(
      "streamingcommunity",
      "cdn.streamingcommunity"
    )}/images`;
  }

  async search({
    name,
    max_results = 3,
  }: {
    name: string;
    max_results?: number;
  }): Promise<MediaSearch[]> {
    const res = JSON.parse(
      await get(`${this.SC_URL}/api/search?q=${name}`)
    ) as ApiResponse<MediaSearch>;
    return res.data.slice(0, max_results);
  }

  title: {
    async details({
      id,
      slug,
    }: {
      id: number;
      slug: string;
    }): Promise<MediaDetails> {
      const data = JSON.parse(
        (
          await take_match_groups(
            `${this.SC_URL}/titles/${id}-${slug}`,
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
  
      const detailedSeasons: MediaDetails["seasons"] = [];
  
      for (const season of seasons) {
        const seasonData = JSON.parse(
          (
            await take_match_groups(
              `${this.SC_URL}/titles/${id}-${slug}/stagione-${season.number}`,
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
  
      const fromTmdb = await this.tmdb.v3.movies.getDetails(tmdb_id, {
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
  }
}

import {
  ApiResponse,
  MediaDetails,
  MediaSearch,
  SeasonDataPage,
  TitleDataPage,
} from "./types";
import { get, take_match_groups } from "./utils";
