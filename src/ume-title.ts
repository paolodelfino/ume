import { MoviesGetDetailsResponse, TVGetDetailsResponse } from "tmdb-js-node";
import { Ume } from ".";
import { Episode, Title_Data_Page, Title_Details, Title_Search } from "./types";
import { Ume_Image } from "./ume-image";
import { Ume_Seasons } from "./ume-seasons";
import { Ume_Trailer } from "./ume-trailer";
import {
  DATA_PAGE_GROUP_INDEX,
  DATA_PAGE_REGEX,
  get,
  take_match_groups,
} from "./utils";

export class Ume_Title {
  private _ume;
  image;
  trailer;

  constructor({ ume }: { ume: Ume }) {
    this._ume = ume;
    this.image = new Ume_Image({ ume });
    this.trailer = new Ume_Trailer();
  }

  /**
   *
   * @param max_results Defaults to 3
   */
  async search({
    name,
    max_results = 3,
  }: {
    name: string;
    max_results?: number;
  }): Promise<Title_Search[]> {
    const res = JSON.parse(
      await get(`${this._ume.sc.url}/api/search?q=${name}`)
    ) as {
      data: Title_Search[];
    };
    return res.data.slice(0, max_results);
  }

  async details({
    id,
    slug,
  }: {
    id: number;
    slug: string;
  }): Promise<Title_Details> {
    const data = JSON.parse(
      (
        await take_match_groups(
          `${this._ume.sc.url}/titles/${id}-${slug}`,
          DATA_PAGE_REGEX,
          [DATA_PAGE_GROUP_INDEX]
        )
      )[0]
    ).props as Title_Data_Page;

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

    const seasons_handler = new Ume_Seasons({
      seasons: seasons.map((season) => ({
        number: season.number,
        episodesUrl: `${this._ume.sc.url}/titles/${season.title_id}-${slug}/stagione-${season.number}`,
      })),
    });

    let fromTmdb:
      | (
          | Promise<MoviesGetDetailsResponse<"credits"[]>>
          | Promise<TVGetDetailsResponse<"credits"[]>>
        )
      | null = null;
    if (tmdb_id) {
      if (type == "movie") {
        fromTmdb = this._ume.tmdb.v3.movies.getDetails(tmdb_id, {
          append_to_response: ["credits"],
          language: "it-IT",
        });
      } else {
        fromTmdb = this._ume.tmdb.v3.tv.getDetails(tmdb_id, {
          append_to_response: ["credits"],
          language: "it-IT",
        });
      }
    }

    return {
      slug,
      id,
      plot,
      tmdb_id,
      name,
      runtime,
      quality,
      type,
      release_date,
      status,
      seasons_count: seasons_count,
      seasons: seasons_handler,
      trailers,
      images,
      cast: fromTmdb?.then((res) => res.credits.cast) ?? null,
      genres: fromTmdb?.then((res) => res.genres) ?? null,
      related,
    };
  }

  async playlist({
    title_id,
    episode_id,
  }: {
    title_id: number;
    episode_id?: number;
  }) {
    const embed_url = (
      await take_match_groups(
        `${this._ume.sc.url}/iframe/${title_id}?episode_id=${episode_id ?? ""}`,
        new RegExp('src="(.+)".+frameborder', "s"),
        [1]
      )
    )[0];

    const master_jsized = (
      await take_match_groups(
        embed_url,
        new RegExp("window[.]masterPlaylist = (.+)window.canPlayFHD", "s"),
        [1]
      )
    )[0];

    const master = (0, eval)(`const b = ${master_jsized}; b`);

    return `${master.url}?token=${master.params.token}&token720p=${master.params.token720p}&token360p=${master.params.token360p}&token480p=${master.params.token480p}&token1080p=${master.params.token1080p}&expires=${master.params.expires}`;
  }

  utils = {
    nextEpisode: async ({
      title_id,
      episode_id,
    }: {
      title_id: number;
      episode_id: number;
    }) => {
      return JSON.parse(
        (
          await take_match_groups(
            `${this._ume.sc.url}/watch/${title_id}?e=${episode_id}`,
            DATA_PAGE_REGEX,
            [DATA_PAGE_GROUP_INDEX]
          )
        )[0]
      ).props.nextEpisode as Omit<Episode, "images"> | null;
    },
  };
}