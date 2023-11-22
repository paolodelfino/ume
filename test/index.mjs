import "dotenv/config";
import { UMW } from "../dist/index.mjs";

console.time();

const umw = new UMW({ tmdb_api_key: process.env.TMDB_API_KEY });
const movies = await umw.title.search({ name: "rick" });
console.assert(movies.length > 0);
const movie = movies[0];
const details = await umw.title.details({ id: movie.id, slug: movie.slug });
console.timeEnd();

console.log(details);
