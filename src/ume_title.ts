import crypto from "node:crypto";
import { MoviesGetDetailsResponse, TVGetDetailsResponse } from "tmdb-js-node";
import { Ume } from ".";
import { Cache_Store } from "./cache_store";
import { Search_Suggestion } from "./search_suggestion";
import {
  Dl_Res,
  Movie_Collection,
  Slider_Fetch,
  Title_Data_Page,
  Title_Details,
  Title_Preview,
  Title_Search,
} from "./types";
import { Ume_Seasons } from "./ume_seasons";
import { Ume_Sliders_Queue } from "./ume_sliders_queue";
import {
  DATA_PAGE_GROUP_INDEX,
  DATA_PAGE_REGEX,
  get,
  get_buffer,
  parse_subtitle_playlist,
  parse_video_playlist,
  post,
  take_match_groups,
} from "./utils";

export class Ume_Title {
  private _ume!: Ume;

  private _details!: Cache_Store<Title_Details>;
  private _search_history!: Cache_Store<string>;
  private _search!: Cache_Store<Title_Search[]>;
  private _preview!: Cache_Store<Title_Preview>;

  sliders_queue!: (sliders: Slider_Fetch[]) => Ume_Sliders_Queue;
  search_suggestion!: Search_Suggestion;

  async init({ ume }: { ume: Ume }) {
    this._ume = ume;

    this._details = new Cache_Store();
    await this._details.init({
      identifier: "details",
      kind: "indexeddb",
      expiry_offset: 7 * 24 * 60 * 60 * 1000,
      max_entries: 5,
    });

    this._search_history = new Cache_Store();
    await this._search_history.init({
      identifier: "search_history",
      kind: "indexeddb",
      expiry_offset: 7 * 24 * 60 * 60 * 1000,
      max_entries: 50,
    });

    this._search = new Cache_Store();
    await this._search.init({
      identifier: "search",
      kind: "indexeddb",
      expiry_offset: 7 * 24 * 60 * 60 * 1000,
      max_entries: 5,
    });

    this._preview = new Cache_Store();
    await this._preview.init({
      identifier: "preview",
      kind: "indexeddb",
      expiry_offset: 4 * 24 * 60 * 60 * 1000,
      max_entries: 15,
    });

    this.sliders_queue = (sliders: Slider_Fetch[]) =>
      new Ume_Sliders_Queue({ ume: this._ume, sliders });
    this.search_suggestion = new Search_Suggestion(() =>
      this._search_history.all()
    );
  }

  async import_store(stores: Awaited<ReturnType<typeof this.export_store>>) {
    for (const key in stores) {
      // @ts-ignore
      await this[`_${key}`].import(stores[key]);
    }
  }

  async export_store() {
    return {
      details: await this._details.export(),
      search_history: await this._search_history.export(),
      search: await this._search.export(),
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
  }): Promise<Title_Search[]> {
    query = query.trim();
    if (query.length > 256) {
      throw new Error("query exceeds 256 chars limit");
    }

    if (await this._search.has(query)) {
      return (await this._search.get(query))!;
    }

    const res = JSON.parse(
      await get(`${this._ume.sc.url}/api/search?q=${query}`)
    ) as {
      data: any[];
    };

    await this._search_history.set(query, query);

    const search_results = res.data.slice(0, max_results).map((entry) => {
      return {
        id: entry.id,
        slug: entry.slug,
        name: entry.name,
        score: entry.score,
        images: entry.images,
        seasons_count: entry.seasons_count,
        type: entry.type,
      };
    });

    await this._search.set(query, search_results);
    return search_results;
  }

  async details({
    id,
    slug,
  }: {
    id: number;
    slug: string;
  }): Promise<Title_Details> {
    const cache_key = `${id}`;
    if (await this._details.has(cache_key)) {
      return (await this._details.get(cache_key))!;
    }

    const data = JSON.parse(
      await take_match_groups(
        `${this._ume.sc.url}/titles/${id}-${slug}`,
        DATA_PAGE_REGEX,
        DATA_PAGE_GROUP_INDEX
      )
    ).props as Title_Data_Page;

    const {
      plot,
      tmdb_id,
      name,
      quality,
      type,
      release_date,
      status,
      seasons_count,
      seasons,
      runtime,
      score,
    } = data.title;

    const videos = data.title.trailers.map((video: any) => ({
      name: video.name,
      key: video.youtube_id,
    }));
    const images = data.title.images.map(
      (image) =>
        ({
          filename: image.filename,
          type: image.type,
        } satisfies Title_Details["images"][number])
    );
    const genres = data.title.genres.map(
      (genre) =>
        ({
          name: genre.name,
        } satisfies Title_Details["genres"][number])
    );
    const related =
      data.sliders.find((slider) => slider.name == "related")?.titles ?? null;

    const seasons_handler = new Ume_Seasons({
      seasons: seasons.map((season) => ({
        number: season.number,
        episodesUrl: `${this._ume.sc.url}/titles/${season.title_id}-${slug}/stagione-${season.number}`,
      })),
    });

    let fromTmdb:
      | (
          | Promise<MoviesGetDetailsResponse<("credits" | "videos")[]>>
          | Promise<TVGetDetailsResponse<("credits" | "videos")[]>>
        )
      | null = null;
    if (tmdb_id) {
      if (type == "movie") {
        fromTmdb = this._ume.tmdb.v3.movies.getDetails(tmdb_id, {
          append_to_response: ["credits", "videos"],
        });
      } else {
        fromTmdb = this._ume.tmdb.v3.tv.getDetails(tmdb_id, {
          append_to_response: ["credits", "videos"],
        });
      }

      if (videos.length == 0) {
        videos.push(
          ...(await fromTmdb.then((tmdb_details) =>
            tmdb_details.videos.results
              .filter(
                (video) =>
                  (video.type == "Trailer" || video.type == "Teaser") &&
                  video.site == "YouTube"
              )
              .map(
                (video) =>
                  ({
                    key: video.key,
                    name: video.name,
                  } satisfies Awaited<Title_Details["videos"]>[number])
              )
          ))
        );
      }
    }

    const collection =
      type == "tv"
        ? null
        : async () => {
            const tmdb_details = await (fromTmdb as Promise<
              MoviesGetDetailsResponse<[]>
            >);
            if (tmdb_details.belongs_to_collection) {
              const collection = await this._ume.tmdb.v3.collections.getDetails(
                tmdb_details.belongs_to_collection.id,
                { language: "it-IT" }
              );

              const filtered_parts: Movie_Collection = [];
              for (const part of collection.parts) {
                if (part.poster_path) {
                  filtered_parts.push({
                    name: part.title,
                    poster_path: part.poster_path,
                  });
                }
              }

              if (filtered_parts.length > 1) {
                return filtered_parts;
              }
            }
            return null;
          };

    const title_details = {
      score,
      slug,
      id,
      plot,
      tmdb_id,
      name,
      runtime,
      quality,
      type,
      release_date,
      status,
      seasons_count: seasons_count,
      seasons: seasons_handler,
      videos,
      images,
      cast: fromTmdb?.then((tmdb_details) => tmdb_details.credits.cast) ?? null,
      genres,
      related,
      collection,
    } satisfies Title_Details;

    await this._details.set(cache_key, title_details);
    return title_details;
  }

  async preview({ id }: { id: number }): Promise<Title_Preview> {
    const cache_key = `${id}`;
    if (await this._preview.has(cache_key)) {
      return (await this._preview.get(cache_key))!;
    }

    const res = JSON.parse(
      await post(`${this._ume.sc.url}/api/titles/preview/${id}`, {})
    );

    const data = {
      id: res.id,
      type: res.type,
      runtime: res.runtime,
      release_date: res.release_date,
      plot: res.plot,
      seasons_count: res.seasons_count,
      images: res.images,
      genres: res.genres,
    };

    await this._preview.set(cache_key, data);
    return data;
  }

  async master_playlist({
    title_id,
    episode_id,
  }: {
    title_id: number;
    episode_id?: number;
  }) {
    const embed_url = await take_match_groups(
      `${this._ume.sc.url}/iframe/${title_id}?episode_id=${episode_id ?? ""}`,
      /src="(.+)".+frameborder/s,
      1
    );

    const master_jsized = await take_match_groups(
      embed_url,
      /window[.]masterPlaylist = (.+)window.canPlayFHD/s,
      1
    );

    const master = (0, eval)(`const b = ${master_jsized}; b`);

    return `${master.url}?token=${master.params.token}&token720p=${master.params.token720p}&token360p=${master.params.token360p}&token480p=${master.params.token480p}&token1080p=${master.params.token1080p}&expires=${master.params.expires}`;
  }

  image_url({ filename }: { filename: string }) {
    return `${this._ume.sc.image_endpoint}/${filename}`;
  }

  video_url({ key }: { key: string }) {
    return `${this._ume.sc.trailer_endpoint}/${key}`;
  }

  video_iframe({ url, className }: { url: string; className: string }) {
    return `
<iframe
  className="${className}"
  src="${url}"
  title="YouTube video player"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowfullscreen
></iframe>`;
  }

  is_available({
    release_date,
    status,
    episodes_count,
  }: {
    release_date: Title_Details["release_date"];
    status?: Title_Details["status"];
    episodes_count?: number;
  }) {
    return (
      new Date(release_date).getTime() <= Date.now() &&
      (!status || status != "Post Production") &&
      (!episodes_count || episodes_count > 0)
    );
  }

  async parse_master_playlist(master_url: string): Promise<Dl_Res[]> {
    const dl_resources: Dl_Res[] = [];

    const master = (await get(master_url)).split("\n");
    for (const line of master) {
      if (line.indexOf("type=video") != -1) {
        dl_resources.push({
          kind: "video",
          url: line,
          rendition: line.match(/rendition=([0-9a-zA-z]+)&/)![1],
        });
      } else if (line.indexOf("type=subtitle") != -1) {
        dl_resources.push({
          kind: "subtitle",
          url: line.substring(line.indexOf("https"), line.length - 1),
          rendition: line.match(/rendition=([0-9a-zA-z-]+)&/)![1],
        });
      }
    }

    return dl_resources;
  }

  private async _download_video(url: string): Promise<string | Buffer> {
    let subtle: SubtleCrypto | crypto.webcrypto.SubtleCrypto;

    const is_web =
      typeof window != "undefined" && typeof window.crypto != "undefined";
    if (is_web) {
      subtle = window.crypto.subtle;
    } else {
      subtle = crypto.webcrypto.subtle;
    }

    const [segments_urls, iv, aes_key_buffer] = await parse_video_playlist(url);

    const aes_key = aes_key_buffer
      ? await subtle.importKey(
          "raw",
          aes_key_buffer,
          { name: "AES-CBC" },
          false,
          ["decrypt"]
        )
      : undefined;

    const segments: ArrayBuffer[] = [];

    type Batch = (() => Promise<void>)[];
    const batches: Batch[] = [];
    const batch_sz = 100;
    const batch_count = Math.ceil(segments_urls.length / batch_sz);

    for (let i = 0; i < batch_count; i++) {
      const batch: Batch = [];

      for (
        let j = batch_sz * i;
        j < batch_sz * (i + 1) && j < segments_urls.length;
        j++
      ) {
        batch.push(
          async () =>
            await new Promise(async (resolve) => {
              const file_enc = await get_buffer(segments_urls[j]);

              if (iv) {
                const file_buffer = new Uint8Array(file_enc);

                const file_dec_buffer = await subtle.decrypt(
                  { name: "AES-CBC", iv: iv },
                  aes_key!,
                  file_buffer.buffer
                );

                segments[j] = file_dec_buffer;
              } else {
                segments[j] = file_enc;
              }

              resolve(void 0);
            })
        );
      }

      batches.push(batch);
    }

    for (const batch of batches) {
      await Promise.all(batch.map((callback_array) => callback_array()));
    }

    const blob = new Blob(segments);
    return is_web
      ? URL.createObjectURL(blob)
      : Buffer.from(await blob.arrayBuffer());
  }

  private async _download_subtitle(url: string): Promise<string | Buffer> {
    const subtitle_url = await parse_subtitle_playlist(url);
    const array_buffer = await get_buffer(subtitle_url);
    return typeof window != "undefined" && typeof window.crypto != "undefined"
      ? URL.createObjectURL(new Blob([array_buffer]))
      : Buffer.from(array_buffer);
  }

  async download(dl_res: Dl_Res): Promise<string | Buffer> {
    switch (dl_res.kind) {
      case "video":
        return await this._download_video(dl_res.url);
      case "subtitle":
        return await this._download_subtitle(dl_res.url);
    }
  }
}
