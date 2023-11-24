import { Episode } from "./types";
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
  private _cached: Episode[][] = [];

  constructor({
    seasons,
  }: {
    seasons: { number: number; episodesUrl: string }[];
  }) {
    for (const season of seasons) {
      this._fetchers[season.number] = {
        number: season.number,
        episodes: async () => {
          const episodes = await take_match_groups(
            season.episodesUrl,
            DATA_PAGE_REGEX,
            [DATA_PAGE_GROUP_INDEX]
          ).then(
            (res) => JSON.parse(res[0]).props.loadedSeason.episodes as Episode[]
          );

          return episodes;
        },
      };
    }
  }

  async get(number: number) {
    if (!this._cached[number]) {
      this._cached[number] = await this._fetchers[number]!.episodes();
    }

    return this._cached[number];
  }
}
