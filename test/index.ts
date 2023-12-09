import { assert } from "chai";
import "dotenv/config";
import { Ume } from "../dist/index.mjs";

const time = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const stopwatch = async (label: string, fn: any) => {
  console.log(`${label}:`);
  console.time(label);
  await fn();
  console.timeEnd(label);
};

assert(process.env.TMDB_API_KEY);
const ume = new Ume({ tmdb_api_key: process.env.TMDB_API_KEY });

let movie: Awaited<ReturnType<typeof ume.title.search>>[number];
await stopwatch("search", async () => {
  const movies = await ume.title.search({ name: "enola" });
  assert(movies.length > 0);
  movie = movies[0];
});

// @ts-ignore
let details: Awaited<ReturnType<typeof ume.title.details>> = null;
await stopwatch("details", async () => {
  details = await ume.title.details({ id: movie.id, slug: movie.slug });
});

await stopwatch("details (cache)", async () => {
  assert(
    (await ume.title.details({ id: movie.id, slug: movie.slug })).name ==
      details.name
  );
});

await stopwatch("misc", async () => {
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

let master_playlist: string;
await stopwatch("master playlist", async () => {
  master_playlist = await ume.title.master_playlist({
    title_id: details.id,
    episode_id:
      details.type == "tv" ? (await details.seasons.get(2))![5].id : undefined,
  });
  console.log(master_playlist);
});

if (details.type == "tv") {
  await stopwatch("seasons (fetch)", async () => {
    const episodes = await details.seasons.get(4);
    assert(episodes);
    assert(episodes.length > 0);
  });

  await stopwatch("seasons (cache)", async () => {
    const episodes = await details.seasons.get(4);
    assert(episodes);
    assert(episodes.length > 0);
  });

  await stopwatch("episode seek bounds", async () => {
    const [prev, next] = await details.seasons.seek_bounds_episode({
      season_number: 6,
      episode_index: 4,
    });
    assert(prev);
    assert(next);
    assert(prev.data.number == 4);
    assert(next.data.number == 6);
  });

  await stopwatch("episode seek bounds (next not available)", async () => {
    const [prev, next] = await details.seasons.seek_bounds_episode({
      season_number: 6,
      episode_index: 9,
    });
    assert(prev);
    assert(!next);
    assert(prev.data.number == 9);
  });

  await stopwatch("episode seek bounds (prev not available)", async () => {
    const [prev, next] = await details.seasons.seek_bounds_episode({
      season_number: 1,
      episode_index: 0,
    });
    assert(!prev);
    assert(!!next);
    assert(next.data.number == 2);
  });

  await stopwatch("double episode seek bounds", async () => {
    const [prev, next] = await details.seasons.seek_bounds_episode({
      season_number: 4,
      episode_index: 3,
    });
    assert(!!prev);
    assert(!!next);
    assert(prev.data.number == 3);
    assert(next.data.number == 5);

    const [prev2, next2] = await details.seasons.seek_bounds_episode({
      episode_index: next.episode_index,
      season_number: next.season_number,
    });
    assert(!!prev2);
    assert(!!next2);
    assert(prev2.data.number == 4);
    assert(next2.data.number == 6);
  });
}

await stopwatch("sliders", async () => {
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
  assert(queue.data.length == 0);
  assert((await queue.next()).has_next);
  // @ts-ignore
  assert(queue.data.length == 6);
  assert(!(await queue.next()).has_next);
  assert(queue.data.length == 8);
});

let download_objs: Awaited<ReturnType<typeof ume.title.parse_master_playlist>>;
await stopwatch("parse master playlist", async () => {
  download_objs = await ume.title.parse_master_playlist(master_playlist);
  assert(download_objs.length > 0);
});

/* const video_playlist = download_objs.find((obj) => obj.kind == "video");
assert(video_playlist); */

let buffer: Buffer;
await stopwatch("download video", async () => {
  console.log("skipped");
  /* buffer = await ume.title.download(video_playlist);
  assert(buffer.byteLength > 0); */
});

/* console.log("writing the downloaded content");
const batch_sz = 2147483647;
const batch_count = Math.ceil(buffer.buffer.byteLength / batch_sz);
for (let i = 0; i < batch_count; ) {
  fs.appendFileSync(
    "test/output.mp4",
    new Uint8Array(buffer.buffer.slice(batch_sz * i, batch_sz * ++i))
    );
  } */

/* const subtitle_playlist = download_objs.find((obj) => obj.kind == "subtitle");
  assert(subtitle_playlist); */

await stopwatch("download subtitle", async () => {
  console.log("skipped");
  /* buffer = await ume.title.download(subtitle_playlist);
  assert(buffer.byteLength > 0); */
});

if (details.type == "movie") {
  await stopwatch("movie collection", async () => {
    assert(details.collection);
    console.log((await details.collection())?.length);
  });
}

/* console.log("writing the downloaded content");
fs.appendFileSync("test/output.vtt", buffer); */