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

  private _store!: Cache_Store<{
    number: number;
    title_id: number;
    slug: string;
    episodes: Episode[];
  }>;

  async init({ ume }: { ume: Ume }) {
    this._ume = ume;

    const fetch_season = this._fetch_season;
    const season_url = this._season_url;

    this._store = new Cache_Store();
    await this._store.init(`seasons`, {
      expiry_offset: 7 * 24 * 60 * 60 * 1000,
      max_entries: 6,
      refresh: async (entry) => {
        return {
          number: entry.number,
          slug: entry.slug,
          title_id: entry.title_id,
          episodes: await fetch_season(
            season_url(this._ume.sc.url, {
              number: entry.number,
              slug: entry.slug,
              title_id: entry.title_id,
            })
          ),
        };
      },
    });
  }

  async import(
    stores: Awaited<ReturnType<typeof this.export>>,
    merge?: boolean
  ) {
    for (const key in stores) {
      // @ts-ignore
      await this[key].import(stores[key], merge);
    }
  }

  async export() {
    return {
      _store: await this._store.export(),
    };
  }

  async get(number: number, title: { id: number; slug: string }) {
    const cache_key = `${title.id}`;
    const cached = await this._store.get(cache_key);
    if (cached) return cached.episodes;

    const episodes = await this._fetch_season(
      this._season_url(this._ume.sc.url, {
        number,
        title_id: title.id,
        slug: title.slug,
      })
    );

    await this._store.set(cache_key, {
      number,
      slug: title.slug,
      title_id: title.id,
      episodes,
    });
    return episodes;
  }

  async seek_bounds_episode(
    {
      episode_index,
      season_number,
    }: {
      episode_index: number;
      season_number: number;
    },
    title: {
      id: number;
      slug: string;
      seasons: (Title_Data_Page["title"]["seasons"][number] | undefined)[];
    }
  ): Promise<[prev: Seek_Episode | null, next: Seek_Episode | null]> {
    let prev: Seek_Episode | null = null;
    let next: Seek_Episode | null = null;

    const curr_season = await this.get(season_number, {
      slug: title.slug,
      id: title.id,
    });

    let i = episode_index - 1;
    let s_num = season_number;
    let data: Episode | null = curr_season[i];

    if (episode_index < 1) {
      i = 0;
      s_num = season_number - 1;
      data = title.seasons[s_num]
        ? (
            await this.get(s_num, {
              slug: title.slug,
              id: title.id,
            })
          )[episode_index]
        : null;
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
      data = title.seasons[s_num]
        ? (
            await this.get(s_num, {
              slug: title.slug,
              id: title.id,
            })
          )[i]
        : null;
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

  private _season_url(
    sc: string,
    {
      number,
      slug,
      title_id,
    }: {
      number: number;
      title_id: number;
      slug: string;
    }
  ) {
    return `${sc}/titles/${title_id}-${slug}/stagione-${number}`;
  }
}
