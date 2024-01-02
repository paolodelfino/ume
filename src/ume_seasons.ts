import { Ume } from ".";
import { Cache_Store } from "./cache_store";
import { Episode, Seek_Episode, Title_Data_Page } from "./types";
import {
  DATA_PAGE_GROUP_INDEX,
  DATA_PAGE_REGEX,
  take_match_groups,
} from "./utils";

export class Ume_Seasons {
  private _ume!: Ume;

  private _title_id!: number;
  private _slug!: string;
  private _all!: Parameters<typeof this.init>["0"]["seasons"];

  private _cache!: Cache_Store<{
    number: number;
    episodes: Episode[];
  }>;

  async init({
    ume,
    title_id,
    slug,
    seasons,
  }: {
    ume: Ume;
    title_id: number;
    slug: string;
    seasons: (Title_Data_Page["title"]["seasons"][number] | undefined)[];
  }) {
    this._ume = ume;

    this._title_id = title_id;
    this._slug = slug;
    this._all = seasons;

    const fetch_season = this._fetch_season;
    const season_url = this._season_url;

    this._cache = new Cache_Store();
    await this._cache.init(`${title_id}-seasons`, {
      expiry_offset: 7 * 24 * 60 * 60 * 1000,
      max_entries: 3,
      refresh: async (entry) => {
        return {
          number: entry.number,
          episodes: await fetch_season(season_url(this, entry.number)),
        };
      },
    });
  }

  async import_store(
    stores: Awaited<ReturnType<typeof this.export_store>>,
    merge?: boolean
  ) {
    for (const key in stores) {
      // @ts-ignore
      await this[`_${key}`].import(stores[key], merge);
    }
  }

  async export_store() {
    return {
      cache: await this._cache.export(),
    };
  }

  get all() {
    return this._all.filter(Boolean);
  }

  async get(number: number) {
    const cache_key = `${number}`;
    const cached = await this._cache.get(cache_key);
    if (cached) return cached.episodes;

    const episodes = await this._fetch_season(this._season_url(this, number));

    await this._cache.set(cache_key, {
      number,
      episodes,
    });
    return episodes;
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

    const curr_season = await this.get(season_number);

    let i = episode_index - 1;
    let s_num = season_number;
    let data: Episode | null = curr_season[i];

    if (episode_index < 1) {
      i = 0;
      s_num = season_number - 1;
      data = this._all[s_num] ? (await this.get(s_num))[episode_index] : null;
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
      data = this._all[s_num] ? (await this.get(s_num))[i] : null;
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

  private async _fetch_season(url: string): Promise<Episode[]> {
    const data = await take_match_groups(
      url,
      DATA_PAGE_REGEX,
      DATA_PAGE_GROUP_INDEX
    );
    return (JSON.parse(data).props.loadedSeason.episodes as any[]).map(
      ({ id, number, name, plot, duration, images }) =>
        ({
          id,
          number,
          name,
          plot,
          duration,
          images,
        } satisfies Episode)
    );
  }

  private _season_url(self: Ume_Seasons, number: number) {
    return `${self._ume.sc.url}/titles/${self._title_id}-${self._slug}/stagione-${number}`;
  }
}
