import { UMW } from "../dist/index.mjs";
import "dotenv/config";

const umw = new UMW({ tmdb_api_key: process.env.TMDB_API_KEY });
const movies = await umw.title.search({ name: "enola" });
console.assert(movies.length > 0);
const rick = movies[0];
const details = await umw.title.details({ id: rick.id, slug: rick.slug });
console.log(details);
