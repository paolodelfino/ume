import crypto from "crypto";
import { MoviesGetDetailsResponse, TVGetDetailsResponse } from "tmdb-js-node";
import { Ume } from ".";
import {
  Dl_Res,
  Slider_Fetch,
  Title_Data_Page,
  Title_Details,
  Title_Search,
} from "./types";
import { Ume_Seasons } from "./ume-seasons";
import { Ume_Sliders_Queue } from "./ume-sliders-queue";
import {
  DATA_PAGE_GROUP_INDEX,
  DATA_PAGE_REGEX,
  get,
  get_buffer,
  parse_subtitle_playlist,
  parse_video_playlist,
  take_match_groups,
} from "./utils";

export class Ume_Title {
  private _ume;
  sliders_queue;

  constructor({ ume }: { ume: Ume }) {
    this._ume = ume;
    this.sliders_queue = (sliders: Slider_Fetch[]) =>
      new Ume_Sliders_Queue({ ume: this._ume, sliders });
  }

  /**
   *
   * @param max_results Defaults to 3
   */
  async search({
    name,
    max_results = 3,
  }: {
    name: string;
    max_results?: number;
  }): Promise<Title_Search[]> {
    const res = JSON.parse(
      await get(`${this._ume.sc.url}/api/search?q=${name}`)
    ) as {
      data: Title_Search[];
    };
    return res.data.slice(0, max_results);
  }

  async details({
    id,
    slug,
  }: {
    id: number;
    slug: string;
  }): Promise<Title_Details> {
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
      trailers,
      images,
      runtime,
      score,
      genres,
    } = data.title;

    const sliders = data.sliders;
    const related =
      sliders.find((slider) => slider.name == "related")?.titles ?? null;

    const seasons_handler = new Ume_Seasons({
      seasons: seasons.map((season) => ({
        number: season.number,
        episodesUrl: `${this._ume.sc.url}/titles/${season.title_id}-${slug}/stagione-${season.number}`,
      })),
    });

    let fromTmdb:
      | (
          | Promise<MoviesGetDetailsResponse<"credits"[]>>
          | Promise<TVGetDetailsResponse<"credits"[]>>
        )
      | null = null;
    if (tmdb_id) {
      if (type == "movie") {
        fromTmdb = this._ume.tmdb.v3.movies.getDetails(tmdb_id, {
          append_to_response: ["credits"],
          language: "it-IT",
        });
      } else {
        fromTmdb = this._ume.tmdb.v3.tv.getDetails(tmdb_id, {
          append_to_response: ["credits"],
          language: "it-IT",
        });
      }
    }

    return {
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
      trailers,
      images,
      cast: fromTmdb?.then((res) => res.credits.cast) ?? null,
      genres,
      related,
    };
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

  trailer_url({ key }: { key: string }) {
    return `${this._ume.sc.trailer_endpoint}/${key}`;
  }

  trailer_iframe({ url, className }: { url: string; className: string }) {
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
  }: {
    release_date: Title_Details["release_date"];
    status: Title_Details["status"];
  }) {
    return (
      new Date(release_date).getTime() <= Date.now() &&
      status != "Post Production"
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
