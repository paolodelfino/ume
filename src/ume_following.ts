import { ustore } from "pustore";
import { Ume } from ".";
import {
  Movie_Following_Update,
  Person_Details,
  Person_Following_Update,
  Title_Details,
  Tv_Following_Update,
} from "./types";

export class Ume_Following {
  private _ume!: Ume;

  private _people!: ustore.Async<Person_Details>;
  private _movies!: ustore.Async<Title_Details>;
  private _tvs!: ustore.Async<Title_Details>;

  async init({ ume }: { ume: Ume }) {
    this._ume = ume;

    this._people = new ustore.Async();
    await this._people.init("following_people");

    this._movies = new ustore.Async();
    await this._movies.init("following_movies");

    this._tvs = new ustore.Async();
    await this._tvs.init("following_series");
  }

  async something_new_people() {
    const updates: Person_Following_Update[] = [];

    for (const older of await this._people.values()) {
      const newer = await this._ume.person.details(older.id, false);
      if (
        !newer ||
        !(newer.known_for_movies.length > older.known_for_movies.length)
      )
        continue;

      const update: Person_Following_Update = {
        ...newer,
        new_titles: [],
      };

      let diff = newer.known_for_movies.length - older.known_for_movies.length;
      for (
        let i = 0;
        diff > 0 && i < newer.known_for_movies.length;
        --diff, ++i
      ) {
        if (
          !older.known_for_movies.find(
            (older) => older.name == newer.known_for_movies[i].name
          )
        ) {
          update.new_titles.push(i);
        }
      }

      updates.push(update);
      await this._people.set(`${older.id}`, newer);
    }

    return updates;
  }

  async something_new_movies() {
    const updates: Movie_Following_Update[] = [];

    for (const older of await this._movies.values()) {
      const newer = await this._ume.title.details({
        id: older.id,
        slug: older.slug,
        cache: false,
      });
      if (
        !newer.collection ||
        !(newer.collection.length > (older.collection?.length ?? 0))
      )
        continue;

      const update: Movie_Following_Update = {
        ...newer,
        new_titles: [],
      };

      let diff = newer.collection.length - (older.collection?.length ?? 0);
      for (let i = 0; diff > 0 && i < newer.collection.length; --diff, ++i) {
        if (
          !older.collection?.find(
            (older) => older.name == newer.collection?.[i].name
          )
        ) {
          update.new_titles.push(i);
        }
      }

      updates.push(update);
      await this._movies.set(`${older.id}`, newer);
    }

    return updates;
  }

  async something_new_tvs() {
    const updates: Tv_Following_Update[] = [];

    for (const older of await this._tvs.values()) {
      const newer = await this._ume.title.details({
        id: older.id,
        slug: older.slug,
        cache: false,
      });
      newer.seasons = newer.seasons.filter(Boolean);

      const update: Tv_Following_Update = {
        ...newer,
        new_episodes: [],
      };

      for (let i = 0; i < newer.seasons.length; ++i) {
        const older_eq = older.seasons.find(
          (older) => older.number == newer.seasons[i].number
        );

        if (!older_eq) {
          update.new_episodes.push({
            i,
            is_new_season: true,
            new_episodes_count: newer.seasons[i].episodes_count,
          });
          continue;
        }

        update.new_episodes.push({
          i,
          is_new_season: false,
          new_episodes_count:
            newer.seasons[i].episodes_count - older_eq.episodes_count,
        });
      }

      updates.push(update);
      await this._tvs.update(`${older.id}`, newer);
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

  add_movie(movie: Title_Details) {
    return this._movies.set(`${movie.id}`, movie);
  }

  add_tv(tv: Title_Details) {
    tv.seasons = tv.seasons.filter(Boolean);
    return this._tvs.set(`${tv.id}`, tv);
  }

  add_person(person: Person_Details) {
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
    };
  }
}
