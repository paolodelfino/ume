import { assert } from "chai";
import { ustore } from "pustore";
import { Ume } from ".";
import {
  Movie_Following_Update,
  Person_Details,
  Person_Following_Update,
  Title_Details,
  Tv_Following_Update,
} from "./types";
import { time } from "./utils";

export class Ume_Following {
  private _ume!: Ume;

  private _store!: ustore.Async<{ last_checked: number }>;
  private _people!: ustore.Async<Person_Details>;
  private _movies!: ustore.Async<Title_Details>;
  private _tvs!: ustore.Async<Title_Details>;

  private static _sz2 = 6;
  private static _sz3 = 4;
  private static _batch_sz = 120;
  private static _batch2_sz = this._batch_sz / this._sz2;
  private static _batch3_sz = this._batch2_sz / this._sz3;

  async init({ ume }: { ume: Ume }) {
    this._ume = ume;

    this._store = new ustore.Async();
    await this._store.init("following_store");

    this._people = new ustore.Async();
    await this._people.init("following_people");

    this._movies = new ustore.Async();
    await this._movies.init("following_movies");

    this._tvs = new ustore.Async();
    await this._tvs.init("following_series");
  }

  async last_checked_people() {
    return (await this._store.get("people"))?.last_checked;
  }

  async last_checked_movies() {
    return (await this._store.get("movies"))?.last_checked;
  }

  async last_checked_tvs() {
    return (await this._store.get("tvs"))?.last_checked;
  }

  async something_new_people(ids: number[]): Promise<Person_Following_Update[]>;
  async something_new_people(): Promise<Person_Following_Update[]>;
  async something_new_people(ids?: number[]) {
    const updates: Person_Following_Update[] = [];

    let people: Person_Details[];
    if (Array.isArray(ids)) {
      people = await this._people.get_some(ids.map((id) => `${id}`));
    } else {
      people = await this._people.values();
    }

    const pages = Math.ceil(people.length / Ume_Following._batch_sz);

    loop: for (let i = 0; i < pages; ++i) {
      const a = i * Ume_Following._batch_sz;

      for (let j = 0; j < Ume_Following._sz2; ++j) {
        const b = a + j * Ume_Following._batch2_sz;

        let k = 0;
        let end = b + (k + 1) * Ume_Following._batch3_sz;

        for (; k < Ume_Following._sz3; ++k) {
          const start = b + k * Ume_Following._batch3_sz;
          if (start >= people.length) {
            break loop;
          }

          end = b + (k + 1) * Ume_Following._batch3_sz;

          await Promise.all(
            people.slice(start, end).map(async (older) => {
              const newer = await this._ume.person.details(older.id, false);

              if (
                !newer ||
                newer.known_for_movies_count < older.known_for_movies_count
              )
                return;

              const update: Person_Following_Update = {
                ...newer,
                new_titles: [],
              };

              for (const key in newer.known_for_movies) {
                if (!older.known_for_movies[key]) {
                  update.new_titles.push(key);
                }
              }

              if (update.new_titles.length > 0) {
                updates.push(update);
              }
              await this._people.set(`${older.id}`, newer);
            })
          );

          await time(100);
        }

        if (end > people.length) {
          break loop;
        }

        await time(1250);
      }
    }

    if (!Array.isArray(ids)) {
      await this._store.set("people", { last_checked: Date.now() });
    }
    return updates;
  }

  async something_new_movies(ids: number[]): Promise<Movie_Following_Update[]>;
  async something_new_movies(): Promise<Movie_Following_Update[]>;
  async something_new_movies(ids?: number[]) {
    const updates: Movie_Following_Update[] = [];

    let movies: Title_Details[];
    if (Array.isArray(ids)) {
      movies = await this._movies.get_some(ids.map((id) => `${id}`));
    } else {
      movies = await this._movies.values();
    }
    const pages = Math.ceil(movies.length / Ume_Following._batch_sz);

    loop: for (let i = 0; i < pages; ++i) {
      const a = i * Ume_Following._batch_sz;

      for (let j = 0; j < Ume_Following._sz2; ++j) {
        const b = a + j * Ume_Following._batch2_sz;

        let k = 0;
        let end = b + (k + 1) * Ume_Following._batch3_sz;

        for (; k < Ume_Following._sz3; ++k) {
          const start = b + k * Ume_Following._batch3_sz;
          if (start >= movies.length) {
            break loop;
          }

          end = b + (k + 1) * Ume_Following._batch3_sz;

          await Promise.all(
            movies.slice(start, end).map(async (older) => {
              const newer = await this._ume.title.details({
                id: older.id,
                slug: older.slug,
                cache: false,
              });
              if (
                !newer.collection ||
                newer.collection_count < older.collection_count
              )
                return;

              const update: Movie_Following_Update = {
                ...newer,
                new_titles: [],
              };

              for (const key in newer.collection) {
                if (!older.collection?.[key]) {
                  update.new_titles.push(key);
                }
              }

              if (update.new_titles.length > 0) {
                updates.push(update);
              }
              await this._movies.set(`${older.id}`, newer);
            })
          );

          await time(100);
        }

        if (end > movies.length) {
          break loop;
        }

        await time(1250);
      }
    }

    if (!Array.isArray(ids)) {
      await this._store.set("movies", { last_checked: Date.now() });
    }
    return updates;
  }

  async something_new_tvs(ids: number[]): Promise<Tv_Following_Update[]>;
  async something_new_tvs(): Promise<Tv_Following_Update[]>;
  async something_new_tvs(ids?: number[]) {
    const updates: Tv_Following_Update[] = [];

    let tvs: Title_Details[];
    if (Array.isArray(ids)) {
      tvs = await this._tvs.get_some(ids.map((id) => `${id}`));
    } else {
      tvs = await this._tvs.values();
    }

    const pages = Math.ceil(tvs.length / Ume_Following._batch_sz);

    loop: for (let i = 0; i < pages; ++i) {
      const a = i * Ume_Following._batch_sz;

      for (let j = 0; j < Ume_Following._sz2; ++j) {
        const b = a + j * Ume_Following._batch2_sz;

        let k = 0;
        let end = b + (k + 1) * Ume_Following._batch3_sz;

        for (; k < Ume_Following._sz3; ++k) {
          const start = b + k * Ume_Following._batch3_sz;
          if (start >= tvs.length) {
            break loop;
          }

          end = b + (k + 1) * Ume_Following._batch3_sz;

          await Promise.all(
            tvs.slice(start, end).map(async (older) => {
              const newer = await this._ume.title.details({
                id: older.id,
                slug: older.slug,
                cache: false,
              });

              const update: Tv_Following_Update = {
                ...newer,
                new_episodes: [],
              };

              for (const season in newer.seasons) {
                const older_eq = older.seasons[season];

                if (!older_eq) {
                  update.new_episodes.push({
                    number: season,
                    is_new_season: true,
                    new_episodes_count: newer.seasons[season].episodes_count,
                  });
                  continue;
                }

                if (
                  newer.seasons[season].episodes_count ==
                  older_eq.episodes_count
                ) {
                  continue;
                }

                update.new_episodes.push({
                  number: season,
                  is_new_season: older_eq.episodes_count == 0,
                  new_episodes_count:
                    newer.seasons[season].episodes_count -
                    older_eq.episodes_count,
                });
              }

              if (update.new_episodes.length > 0) {
                updates.push(update);
              }
              await this._tvs.set(`${older.id}`, newer);
            })
          );

          await time(100);
        }

        if (end > tvs.length) {
          break loop;
        }

        await time(1250);
      }
    }

    if (!Array.isArray(ids)) {
      await this._store.set("tvs", { last_checked: Date.now() });
    }
    return updates;
  }

  rm_movie(id: number) {
    return this._movies.rm(`${id}`);
  }

  rm_tv(id: number) {
    return this._tvs.rm(`${id}`);
  }

  rm_person(id: number) {
    return this._people.rm(`${id}`);
  }

  movies_length() {
    return this._movies.length();
  }

  tvs_length() {
    return this._tvs.length();
  }

  people_length() {
    return this._people.length();
  }

  movies_all() {
    return this._movies.values();
  }

  tvs_all() {
    return this._tvs.values();
  }

  people_all() {
    return this._people.values();
  }

  /**
   * @description Max 500 entries
   */
  async add_movie(movie: Title_Details) {
    assert.isAtMost(await this._movies.length(), 500);

    return this._movies.set(`${movie.id}`, movie);
  }

  /**
   * @description Max 500 entries
   */
  async add_tv(tv: Title_Details) {
    assert.isAtMost(await this._tvs.length(), 500);

    return this._tvs.set(`${tv.id}`, tv);
  }

  /**
   * @description Max 500 entries
   */
  async add_person(person: Person_Details) {
    assert.isAtMost(await this._people.length(), 500);

    return this._people.set(`${person.id}`, person);
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
      _people: await this._people.export(),
      _movies: await this._movies.export(),
      _tvs: await this._tvs.export(),
      _store: await this._store.export(),
    };
  }
}
