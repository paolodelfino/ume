import str_compare from "string-comparison";

export class Search_Suggestion {
  private _queries;

  constructor(all_queries: () => Promise<string[]>) {
    this._queries = all_queries;
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
}
