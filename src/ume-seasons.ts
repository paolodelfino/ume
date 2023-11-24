import { Ume } from ".";
import { Episode } from "./types";
import { take_match_groups } from "./utils";

export class Ume_Seasons {
  private _ume;
  private _fetchers: (
    | {
        number: number;
        episodes: () => Promise<Episode[]>;
      }
    | undefined
  )[] = [];
  private _cached: Episode[][] = [];

  constructor({
    ume,
    seasons,
  }: {
    ume: Ume;
    seasons: { number: number; episodesUrl: string }[];
  }) {
    this._ume = ume;

    for (const season of seasons) {
      this._fetchers[season.number] = {
        number: season.number,
        episodes: async () => {
          const episodes = await take_match_groups(
            season.episodesUrl,
            new RegExp('<div id="app" data-page="(.+)"><!--', "s"),
            [1]
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
