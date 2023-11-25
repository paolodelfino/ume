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
