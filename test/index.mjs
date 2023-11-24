import "dotenv/config";
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
 * @type import("../dist/index.mjs").Title_Search
 */
let movie;
await time("search", async () => {
  const movies = await ume.title.search({ name: "rick" });
  console.assert(movies.length > 0);
  movie = movies[0];
});

/**
 * @type import("../dist/index.mjs").Title_Details
 */
let details;
await time("details", async () => {
  details = await ume.title.details({ id: movie.id, slug: movie.slug });
});

await time("seasons (fetch)", async () => {
  const episodes = await details.seasons.get(4);
  console.assert(episodes.length > 0);
});

await time("seasons (cache)", async () => {
  const episodes = await details.seasons.get(4);
  console.assert(episodes.length > 0);
});

await time("misc", async () => {
  const image = ume.title.image.url({
    filename: details.images[0].filename,
  });
  const trailer = ume.title.trailer.url({
    key: details.trailers[0].youtube_id,
  });
  const iframe = ume.title.trailer.iframe({
    url: trailer,
    className: "w-full h-full",
  });
  console.log(image);
  console.log(trailer);
  console.log(iframe);
});

await time("playlist", async () => {
  const playlist = await ume.title.playlist({
    title_id: details.id,
    episode_id: (await details.seasons.get(2))[5].id,
  });
  console.log(playlist);
});

await time("next episode", async () => {
  const next = await ume.title.utils.nextEpisode({
    title_id: details.id,
    episode_id: (await details.seasons.get(4))[3].id,
  });
  console.assert(next.number == 5);
});

await time("next episode (not available)", async () => {
  const episodes = await details.seasons.get(details.seasons_count - 1);
  const next = await ume.title.utils.nextEpisode({
    title_id: details.id,
    episode_id: episodes[episodes.length - 1].id,
  });
  console.assert(next === null);
});
