import "dotenv/config";
import { TitleDetails, TitleSearch, UMW } from "../dist/index.mjs";
const umw = new UMW({ tmdb_api_key: process.env.TMDB_API_KEY });

const time = async (label, func) => {
  console.time(label);
  await func();
  console.timeEnd(label);
};

/**
 * @type TitleSearch
 */
let movie;
await time("search", async () => {
  const movies = await umw.title.search({ name: "fallimento" });
  console.assert(movies.length > 0);
  movie = movies[0];
});

/**
 * @type TitleDetails
 */
let details;
await time("details", async () => {
  details = await umw.title.details({ id: movie.id, slug: movie.slug });
  // console.log(details);
  console.log(details.id);
});

await time("playlist", async () => {
  const playlist = await umw.title.playlist({
    title_id: details.id,
    //   episode_id: (await details.seasons[4].episodes)[5].id,
  });
  console.log(playlist);
});
