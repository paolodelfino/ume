import { Ume } from ".";
import { Cache_Store } from "./cache_store";
import { Person_Details, Person_Search } from "./types";

export class Ume_Person {
  private _ume!: Ume;

  private _details!: Cache_Store<
    NonNullable<Awaited<ReturnType<typeof this.details>>>
  >;
  private _search!: Cache_Store<{
    query: string;
    data: Person_Search[];
    max_results: number;
  }>;

  async init({ ume }: { ume: Ume }) {
    this._ume = ume;

    this._details = new Cache_Store();
    await this._details.init("person_details", {
      expiry_offset: 2 * 7 * 24 * 60 * 60 * 1000,
      max_entries: 5,
      refresh: async (entry) => {
        return (await this.details(entry.id))!;
      },
    });

    this._search = new Cache_Store();
    await this._search.init("person_search", {
      expiry_offset: 2 * 7 * 24 * 60 * 60 * 1000,
      max_entries: 5,
      refresh: async (entry) => {
        return {
          data: await this.search({
            query: entry.query,
            max_results: entry.max_results,
          }),
          query: entry.query,
          max_results: entry.max_results,
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
      _details: await this._details.export(),
      _search: await this._search.export(),
    };
  }

  /**
   * @param query Limit 256 chars
   * @param max_results Defaults to 3
   */
  async search({
    query,
    max_results = 3,
  }: {
    query: string;
    max_results?: number;
  }): Promise<Person_Search[]> {
    query = query.trim();
    if (query.length > 256) {
      throw new Error("query exceeds 256 chars limit");
    }

    await this._ume._search_history.set(query, query);

    const cached = await this._search.get(query);
    if (cached && cached.max_results >= max_results) {
      return cached.data.slice(0, max_results);
    }

    const data = await this._ume.tmdb.v3.search.searchPeople({
      query,
      include_adult: true,
    });

    const people: Person_Search[] = [];
    let count = 0;
    for (const person of data.results) {
      if (count >= max_results) {
        break;
      }

      if (person.profile_path) {
        people.push({
          id: person.id,
          name: person.name,
          profile_path: person.profile_path,
        });
        ++count;
      }
    }

    await this._search.set(query, {
      query,
      max_results,
      data: people,
    });
    return people;
  }

  async details(
    id: number,
    cache: boolean = true
  ): Promise<Person_Details | null> {
    let cache_key: string;
    if (cache) {
      cache_key = id.toString();
      const cached = await this._details.get(cache_key);
      if (cached) return cached;
    }

    const data = await this._ume.tmdb.v3.people.getDetails(id, {
      append_to_response: ["combined_credits"],
    });

    if (!data.profile_path) {
      return null;
    }

    const movies: Person_Details["known_for_movies"] = [];

    for (const movie of data.combined_credits.cast) {
      if (!movie.poster_path || !movie.name) {
        continue;
      }

      movies.push({
        name: movie.name,
        poster_path: movie.poster_path,
        popularity: movie.popularity,
      });
    }

    for (const movie of (data.combined_credits as any).crew) {
      if (!movie.poster_path) {
        continue;
      }

      movies.push({
        name: movie.name,
        poster_path: movie.poster_path,
        popularity: movie.popularity,
      });
    }

    movies.sort((a, b) => b.popularity - a.popularity);

    const person_details = {
      id,
      known_for_department: data.known_for_department,
      name: data.name,
      profile_path: data.profile_path,
      known_for_movies: movies,
    } satisfies Person_Details;

    if (cache) {
      await this._details.set(cache_key!, person_details);
    }
    return person_details;
  }
}
