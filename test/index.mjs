import "dotenv/config";
import { UMW } from "../dist/index.mjs";

console.time();

const umw = new UMW({ tmdb_api_key: process.env.TMDB_API_KEY });
const movies = await umw.title.search({ name: "fallimento" });
console.assert(movies.length > 0);
const movie = movies[0];
const details = await umw.title.details({ id: movie.id, slug: movie.slug });

console.timeEnd();
// console.log(details);
console.log(details.id)

console.time();

const playlist = await umw.title.playlist({
  title_id: details.id,
//   episode_id: (await details.seasons[4].episodes)[5].id,
});

console.timeEnd();
console.log(playlist);
