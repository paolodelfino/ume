import str_compare from "string-comparison";

export class Search_Suggestion {
  private _queries;
  private _renew;

  constructor({
    get_queries,
    renew_query,
  }: {
    get_queries: () => Promise<string[]>;
    renew_query: (query: string) => Promise<void>;
  }) {
    this._queries = get_queries;
    this._renew = renew_query;
  }

  /**
   *
   * @param max_results Defaults to 5
   */
  async get({
    query,
    max_results = 5,
  }: {
    query: string;
    max_results?: number;
  }) {
    return str_compare.levenshtein
      .sortMatch(query, await this._queries())
      .filter(({ rating }) => rating >= 0.1)
      .reverse()
      .map(({ member }) => member)
      .slice(0, max_results);
  }

  // Hope it's a temporary solution to renew used queries
  async consume(query: string) {
    await this._renew(query);
  }
}
