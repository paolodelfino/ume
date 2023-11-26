import "dotenv/config";
import fs from "fs";
import { Ume } from "../dist/index.mjs";
const ume = new Ume({ tmdb_api_key: process.env.TMDB_API_KEY });

const time = async (label, func) => {
  console.log(label + " -------------");
  console.time(label);
  await func();
  console.timeEnd(label);
  console.log("-------------");
};

/**
 * @type {Awaited<ReturnType<typeof ume.title.search>>[number]}
 */
let movie;
await time("search", async () => {
  const movies = await ume.title.search({ name: "enola holmes 2" });
  console.assert(movies.length > 0);
  movie = movies[0];
});

/**
 * @type {Awaited<ReturnType<typeof ume.title.details>>}
 */
let details;
await time("details", async () => {
  details = await ume.title.details({ id: movie.id, slug: movie.slug });
});

await time("misc", async () => {
  const image = ume.title.image_url({
    filename: details.images[0].filename,
  });
  const trailer = ume.title.trailer_url({
    key: details.trailers[0].youtube_id,
  });
  const iframe = ume.title.trailer_iframe({
    url: trailer,
    className: "w-full h-full",
  });
  console.log(image);
  console.log(trailer);
  console.log(iframe);
});

/**
 * @type {string}
 */
let master_playlist;
await time("master playlist", async () => {
  master_playlist = await ume.title.master_playlist({
    title_id: details.id,
    episode_id:
      details.type == "tv" ? (await details.seasons.get(2))[5].id : undefined,
  });
  console.log(master_playlist);
});

if (details.type == "tv") {
  await time("seasons (fetch)", async () => {
    const episodes = await details.seasons.get(4);
    console.assert(episodes.length > 0);
  });

  await time("seasons (cache)", async () => {
    const episodes = await details.seasons.get(4);
    console.assert(episodes.length > 0);
  });

  await time("episode seek bounds", async () => {
    const [prev, next] = await details.seasons.seek_bounds_episode({
      season_number: 6,
      episode_index: 4,
    });
    console.assert(
      !!prev && !!next && prev.data.number == 4 && next.data.number == 6
    );
  });

  await time("episode seek bounds (next not available)", async () => {
    const [prev, next] = await details.seasons.seek_bounds_episode({
      season_number: 6,
      episode_index: 9,
    });
    console.assert(!!prev && !next && prev.data.number == 9);
  });

  await time("episode seek bounds (prev not available)", async () => {
    const [prev, next] = await details.seasons.seek_bounds_episode({
      season_number: 1,
      episode_index: 0,
    });
    console.assert(!prev && !!next && next.data.number == 2);
  });

  await time("double episode seek bounds", async () => {
    const [prev, next] = await details.seasons.seek_bounds_episode({
      season_number: 4,
      episode_index: 3,
    });
    console.assert(
      !!prev && !!next && prev.data.number == 3 && next.data.number == 5
    );

    const [prev2, next2] = await details.seasons.seek_bounds_episode({
      episode_index: next.episode_index,
      season_number: next.season_number,
    });
    console.assert(
      !!prev2 && !!next2 && prev2.data.number == 4 && next2.data.number == 6
    );
  });
}

await time("sliders", async () => {
  const queue = ume.title.sliders_queue([
    { genre: "Action & Adventure", name: "genre" },
    { genre: "Animazione", name: "genre" },
    { genre: "Commedia", name: "genre" },
    { genre: "Crime", name: "genre" },
    { name: "latest" },
    { name: "top10" },
    { name: "trending" },
    { name: "upcoming" },
  ]);
  console.assert(queue.data.length == 0);
  console.assert((await queue.next()).has_next);
  console.assert(queue.data.length == 6);
  console.assert(!(await queue.next()).has_next);
  console.assert(queue.data.length == 8);
});

/**
 * @type {Awaited<ReturnType<typeof ume.title.parse_master_playlist>>}
 */
let download_objs;
await time("parse master playlist", async () => {
  download_objs = await ume.title.parse_master_playlist(master_playlist);
  console.assert(download_objs.length > 0);
});

const video_playlist = download_objs.find((obj) => obj.kind == "video");
console.assert(!!video_playlist);

/**
 * @type {Buffer}
 */
let buffer;
await time("download video", async () => {
  // console.log("skipped");
  buffer = await ume.title.download(video_playlist);
  console.assert(buffer.byteLength > 0);
});

console.log("writing the downloaded content");
const batch_sz = 2147483647;
const batch_count = Math.ceil(buffer.buffer.byteLength / batch_sz);
for (let i = 0; i < batch_count; ) {
  fs.appendFileSync(
    "test/output.mp4",
    new Uint8Array(buffer.buffer.slice(batch_sz * i, batch_sz * ++i))
  );
}

const subtitle_playlist = download_objs.find((obj) => obj.kind == "subtitle");
console.assert(!!subtitle_playlist);

await time("download subtitle", async () => {
  buffer = await ume.title.download(subtitle_playlist);
  console.assert(buffer.byteLength > 0);
});

console.log("writing the downloaded content");
fs.appendFileSync("test/output.vtt", buffer);
