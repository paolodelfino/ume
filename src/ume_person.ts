import { Ume } from ".";
import { Person_Details, Person_Search } from "./types";

export class Ume_Person {
  private _ume;

  constructor({ ume }: { ume: Ume }) {
    this._ume = ume;
  }

  async search({
    query,
    max_results = 3,
  }: {
    query: string;
    max_results?: number;
  }): Promise<Person_Search[]> {
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

    return people;
  }

  async details(id: number): Promise<Person_Details | null> {
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

    return {
      known_for_department: data.known_for_department,
      name: data.name,
      profile_path: data.profile_path,
      known_for_movies: movies,
    };
  }
}
