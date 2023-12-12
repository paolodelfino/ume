import { Episode, Seek_Episode } from "./types";
import {
  DATA_PAGE_GROUP_INDEX,
  DATA_PAGE_REGEX,
  take_match_groups,
} from "./utils";

export class Ume_Seasons {
  private _fetchers: (
    | {
        number: number;
        episodes: () => Promise<Episode[]>;
      }
    | undefined
  )[] = [];
  private _cached: (Episode[] | undefined)[] = [];

  constructor({
    seasons,
  }: {
    seasons: { number: number; episodesUrl: string }[];
  }) {
    for (const season of seasons) {
      this._fetchers[season.number] = {
        number: season.number,
        episodes: async () => {
          return await take_match_groups(
            season.episodesUrl,
            DATA_PAGE_REGEX,
            DATA_PAGE_GROUP_INDEX
          ).then((res) =>
            (JSON.parse(res).props.loadedSeason.episodes as any[]).map(
              ({ id, number, name, plot, duration, images }) =>
                ({
                  id,
                  number,
                  name,
                  plot,
                  duration,
                  images,
                } satisfies Episode)
            )
          );
        },
      };
    }
  }

  async get(number: number) {
    if (!this._cached[number]) {
      this._cached[number] = await this._fetchers[number]?.episodes();
    }

    return this._cached[number];
  }

  async seek_bounds_episode({
    episode_index,
    season_number,
  }: {
    episode_index: number;
    season_number: number;
  }): Promise<[prev: Seek_Episode | null, next: Seek_Episode | null]> {
    let prev: Seek_Episode | null = null;
    let next: Seek_Episode | null = null;

    const curr_season = (await this.get(season_number))!;

    let i = episode_index - 1;
    let s_num = season_number;
    let data: Episode | null = curr_season[i];

    if (episode_index < 1) {
      i = 0;
      s_num = season_number - 1;
      data = (await this.get(s_num))?.[episode_index] ?? null;
    }

    if (data) {
      prev = {
        data,
        episode_index: i,
        season_number: s_num,
      };
    }

    if (episode_index >= curr_season.length - 1) {
      i = 0;
      s_num = season_number + 1;
      data = (await this.get(s_num))?.[i] ?? null;
    } else {
      i = episode_index + 1;
      s_num = season_number;
      data = curr_season[i];
    }

    if (data) {
      next = {
        data,
        episode_index: i,
        season_number: s_num,
      };
    }

    return [prev, next];
  }
}
