import { assert } from "chai";
import fs from "fs";
import path from "path";
import { exit } from "process";
import { Test_Set } from "putesting";
import { parseArgs } from "util";
import { Ume } from "../../dist/index.mjs";
import "./utils";

type Tests =
  | "search"
  | "details"
  | "details (cached)"
  | "preview"
  | "preview (cached)"
  | "misc"
  | "master playlist"
  | "sliders"
  | "parse master playlist"
  | "download video"
  | "download subtitle"
  | "mylist"
  | "continue_watching"
  | "person search"
  | "person details";

async function main() {
  assert.isDefined(process.env.TMDB_API_KEY);
  assert.isDefined(process.env.PASTEBIN_API_KEY);
  assert.isDefined(process.env.PASTEBIN_NAME);
  assert.isDefined(process.env.PASTEBIN_PASSWORD);
  assert.isDefined(process.env.DISCORD_WEBHOOK_URL);

  const ume = new Ume();
  await ume.init({
    tmdb_api_key: process.env.TMDB_API_KEY!,
    pastebin_api_key: process.env.PASTEBIN_API_KEY!,
    pastebin_name: process.env.PASTEBIN_NAME!,
    pastebin_password: process.env.PASTEBIN_PASSWORD!,
    discord_webhook_url: process.env.DISCORD_WEBHOOK_URL!,
  });

  if (!(await ume.sc.check_url())) {
    console.log(ume.sc.url, "is outdated. Reporting...");
    await ume.sc.report_outdated_url();
    console.log("Reported!");
    exit(1);
  }

  let movie: Awaited<ReturnType<typeof ume.title.search>>[number];
  let details: Awaited<ReturnType<typeof ume.title.details>>;
  let master_playlist: string;
  let download_objs: Awaited<
    ReturnType<typeof ume.title.parse_master_playlist>
  >;
  let video_playlist: Awaited<
    ReturnType<typeof ume.title.parse_master_playlist>
  >[number];
  let buffer: Buffer;
  let subtitle_playlist: Awaited<
    ReturnType<typeof ume.title.parse_master_playlist>
  >[number];
  let rick: Awaited<ReturnType<typeof ume.title.search>>[number];
  let enola: Awaited<ReturnType<typeof ume.title.search>>[number];

  const tests = new Test_Set<Tests>({
    search: {
      async callback() {
        // Should use "rick" as query or "enola" to test films
        const movies = await ume.title.search({ query: "enola" });
        assert.isAbove(movies.length, 0);
        movie = movies[0];
      },
    },
    details: {
      async callback() {
        details = await ume.title.details({ id: movie.id, slug: movie.slug });
      },
      deps: ["search"],
      async after() {
        if (details.type == "movie") {
          await tests.run("movie collection", {
            async callback() {
              assert.isNotNull(details.collection);
              console.log((await details.collection!())?.length);
            },
            deps: ["details"],
          });
        } else {
          await tests.run("seasons", {
            async callback() {
              const episodes = await details.seasons.get(4);
              assert.isDefined(episodes);
              assert.isAbove(episodes!.length, 0);
            },
            deps: ["details"],
          });

          await tests.run("seasons (cache)", {
            async callback() {
              const episodes = await details.seasons.get(4);
              assert.isDefined(episodes);
              assert.isAbove(episodes!.length, 0);
            },
            deps: ["details"],
          });

          await tests.run("episode seek bounds", {
            async callback() {
              const [prev, next] = await details.seasons.seek_bounds_episode({
                season_number: 6,
                episode_index: 4,
              });
              assert.isNotNull(prev);
              assert.isNotNull(next);
              assert.strictEqual(prev!.data.number, 4);
              assert.strictEqual(next!.data.number, 6);
            },
            deps: ["details"],
          });

          await tests.run("episode seek bounds (next not available)", {
            async callback() {
              const [prev, next] = await details.seasons.seek_bounds_episode({
                season_number: 6,
                episode_index: 9,
              });
              assert.isNotNull(prev);
              assert.isNull(next);
              assert.strictEqual(prev!.data.number, 9);
            },
            deps: ["details"],
          });

          await tests.run("episode seek bounds (prev not available)", {
            async callback() {
              const [prev, next] = await details.seasons.seek_bounds_episode({
                season_number: 1,
                episode_index: 0,
              });
              assert.isNull(prev);
              assert.isNotNull(next);
              assert.strictEqual(next!.data.number, 2);
            },
            deps: ["details"],
          });

          await tests.run("double episode seek bounds", {
            async callback() {
              const [prev, next] = await details.seasons.seek_bounds_episode({
                season_number: 4,
                episode_index: 3,
              });
              assert.isNotNull(prev);
              assert.isNotNull(next);
              assert.strictEqual(prev!.data.number, 3);
              assert.strictEqual(next!.data.number, 5);

              const [prev2, next2] = await details.seasons.seek_bounds_episode({
                episode_index: next!.episode_index,
                season_number: next!.season_number,
              });
              assert.isNotNull(prev2);
              assert.isNotNull(next2);
              assert.strictEqual(prev2!.data.number, 4);
              assert.strictEqual(next2!.data.number, 6);
            },
            deps: ["details"],
          });
        }
      },
    },
    "details (cached)": {
      async callback() {
        assert.strictEqual(
          (await ume.title.details({ id: movie.id, slug: movie.slug })).name,
          details.name
        );
      },
      deps: ["search", "details"],
    },
    preview: {
      async callback() {
        assert.strictEqual(
          (await ume.title.preview({ id: movie.id })).id,
          movie.id
        );
      },
      deps: ["search"],
    },
    "preview (cached)": {
      async callback() {
        assert.strictEqual(
          (await ume.title.preview({ id: movie.id })).id,
          movie.id
        );
      },
      deps: ["search", "preview"],
    },
    misc: {
      async callback() {
        const image = ume.title.image_url({
          filename: details.images[0].filename,
        });
        console.log(image);
        if (details.videos[0]) {
          const video = ume.title.video_url({
            key: details.videos[0].key,
          });
          const iframe = ume.title.video_iframe({
            url: video,
            className: "w-full h-full",
          });
          console.log(video);
          console.log(iframe);
        }
      },
      deps: ["details"],
    },
    "master playlist": {
      async callback() {
        master_playlist = await ume.title.master_playlist({
          title_id: details.id,
          episode_id:
            details.type == "tv"
              ? (await details.seasons.get(2))![5].id
              : undefined,
        });
        console.log(master_playlist);
      },
      deps: ["details"],
    },
    "parse master playlist": {
      async callback() {
        download_objs = await ume.title.parse_master_playlist(master_playlist);
        assert.isAbove(download_objs.length, 0);
      },
      deps: ["master playlist"],
      async after() {
        video_playlist = download_objs.find((obj) => obj.kind == "video")!;
        assert.isDefined(video_playlist);
      },
    },
    "download video": {
      async callback() {
        buffer = (await ume.title.download(video_playlist)) as Buffer;
        assert.isAbove(buffer.byteLength, 0);
      },
      deps: ["parse master playlist"],
      async after() {
        console.log("writing the downloaded content");
        const batch_sz = 2147483647;
        const batch_count = Math.ceil(buffer.buffer.byteLength / batch_sz);

        const output_mp4 = fs.openSync(
          path.resolve(__dirname, "../output.mp4"),
          "w"
        );
        for (let i = 0; i < batch_count; ) {
          fs.appendFileSync(
            output_mp4,
            new Uint8Array(buffer.buffer.slice(batch_sz * i, batch_sz * ++i))
          );
        }
        fs.closeSync(output_mp4);

        subtitle_playlist = download_objs.find(
          (obj) => obj.kind == "subtitle"
        )!;
        assert.isDefined(subtitle_playlist);
      },
    },
    "download subtitle": {
      async callback() {
        buffer = (await ume.title.download(subtitle_playlist!)) as Buffer;
        assert.isAbove(buffer.byteLength, 0);
      },
      deps: ["parse master playlist"],
      async after() {
        fs.writeFileSync(path.resolve(__dirname, "../output.vtt"), buffer);
      },
    },
    sliders: {
      async callback() {
        {
          const queue = ume.title.sliders_queue([
            { genre: "Action & Adventure", name: "genre" },
            { genre: "Animazione", name: "genre" },
            { genre: "Commedia", name: "genre" },
            { genre: "Crime", name: "genre" },
            { name: "latest" },
            { name: "top10" },
            { name: "trending" },
          ]);
          assert.strictEqual(queue.data.length, 0);
          assert.isTrue((await queue.next()).has_next);
          assert.strictEqual(queue.data.length, 6);
          assert.isFalse((await queue.next()).has_next);
          assert.strictEqual(queue.data.length, 7);
        }

        {
          const queue = ume.title.sliders_queue([
            {
              name: "upcoming",
            },
          ]);
          await queue.next();
          console.log(`upcoming (${queue.data.length})`);
        }
      },
    },
    "person search": {
      async callback() {
        const people = await ume.person.search({ query: "millie" });
        assert.isNotEmpty(people);
      },
    },
    "person details": {
      async callback() {
        const tennant = (await ume.person.details(20049))!;
        assert.isNotNull(tennant);
        Object.entries(tennant).forEach(([, value]) => assert.isDefined(value));
        assert.strictEqual(tennant.name, "David Tennant");
        assert.isNotEmpty(tennant.known_for_movies);
      },
    },
    continue_watching: {
      async before() {
        rick = (await ume.title.search({ query: "rick and morty" }))[0];
        enola = (await ume.title.search({ query: "enola" }))[0];
      },
      async callback() {
        assert.strictEqual(ume.continue_watching.length, 0);

        assert.isNull(
          ume.continue_watching.time({
            id: rick.id,
            season_number: 4,
            episode_number: 2,
          })
        );

        ume.continue_watching.update({
          id: rick.id,
          slug: rick.slug,
          season_number: 4,
          episode_number: 2,
          time: 10,
        });
        assert.strictEqual(ume.continue_watching.length, 1);

        let time = ume.continue_watching.time({
          id: rick.id,
          season_number: 4,
          episode_number: 2,
        });
        assert.isNotNull(time);
        assert.strictEqual(time, 10);

        assert.isNull(
          ume.continue_watching.time({
            id: rick.id,
            season_number: 3,
            episode_number: 2,
          })
        );

        ume.continue_watching.update({
          id: rick.id,
          slug: rick.slug,
          season_number: 3,
          episode_number: 2,
          time: 145,
        });
        assert.strictEqual(ume.continue_watching.length, 1);

        time = ume.continue_watching.time({
          id: rick.id,
          season_number: 3,
          episode_number: 2,
        });
        assert.isNotNull(time);
        assert.strictEqual(time, 145);

        ume.continue_watching.update({
          id: enola.id,
          slug: enola.slug,
          time: 15,
        });
        assert.strictEqual(ume.continue_watching.length, 2);

        ume.continue_watching.rm(enola.id);
        assert.strictEqual(ume.continue_watching.length, 1);

        const titles = await ume.title.search({
          max_results: 30,
          query: "enola",
        });
        titles.forEach((title) =>
          ume.continue_watching.update({
            id: title.id,
            slug: title.slug,
            time: 5,
          })
        );
        assert.strictEqual(titles.length, 30);
        assert.strictEqual(ume.continue_watching.length, 31);

        assert.strictEqual(ume.continue_watching.some(10).length, 10);

        assert.strictEqual(ume.continue_watching.pages, 4);

        const page0 = ume.continue_watching.next(0);
        assert.strictEqual(page0.length, 10);

        const page1 = ume.continue_watching.next(1);
        assert.strictEqual(page1.length, 10);

        const page2 = ume.continue_watching.next(2);
        assert.strictEqual(page2.length, 10);

        const page3 = ume.continue_watching.next(3);
        assert.strictEqual(page3.length, 1);

        assert.notEqual(page0[0].id, page1[0].id);
        assert.notEqual(page0[0].id, page2[0].id);
        assert.notEqual(page0[0].id, page3[0].id);
        assert.notEqual(page1[0].id, page2[0].id);
        assert.notEqual(page1[0].id, page3[0].id);
        assert.notEqual(page2[0].id, page3[0].id);

        const result = ume.continue_watching.search({ query: "en lomes" });
        assert.isAtLeast(result.length, 2);
        assert.isDefined(result.find((e) => e.slug == "enola-holmes"));
        assert.isDefined(result.find((e) => e.slug == "enola-holmes-2"));
      },
    },
    mylist: {
      async before() {
        rick = (await ume.title.search({ query: "rick and morty" }))[0];
        enola = (await ume.title.search({ query: "enola" }))[0];
      },
      async callback() {
        assert.strictEqual(ume.mylist.length, 0);

        ume.mylist.add({
          id: rick.id,
          slug: rick.slug,
        });
        assert.strictEqual(ume.mylist.length, 1);

        ume.mylist.add({
          id: enola.id,
          slug: enola.slug,
        });
        assert.strictEqual(ume.mylist.length, 2);

        ume.mylist.rm(rick.id);
        assert.strictEqual(ume.mylist.length, 1);

        ume.mylist.rm(enola.id);
        assert.strictEqual(ume.mylist.length, 0);

        const titles = await ume.title.search({
          max_results: 30,
          query: "enola",
        });
        titles.forEach((title) =>
          ume.mylist.add({
            id: title.id,
            slug: title.slug,
          })
        );
        assert.strictEqual(titles.length, 30);

        ume.mylist.add(rick);
        assert.strictEqual(ume.mylist.length, 31);

        assert.strictEqual(ume.mylist.some(10).length, 10);

        assert.strictEqual(ume.mylist.pages, 4);

        const page0 = ume.mylist.next(0);
        assert.strictEqual(page0.length, 10);

        const page1 = ume.mylist.next(1);
        assert.strictEqual(page1.length, 10);

        const page2 = ume.mylist.next(2);
        assert.strictEqual(page2.length, 10);

        const page3 = ume.mylist.next(3);
        assert.strictEqual(page3.length, 1);

        assert.notEqual(page0[0].id, page1[0].id);
        assert.notEqual(page0[0].id, page2[0].id);
        assert.notEqual(page0[0].id, page3[0].id);
        assert.notEqual(page1[0].id, page2[0].id);
        assert.notEqual(page1[0].id, page3[0].id);
        assert.notEqual(page2[0].id, page3[0].id);

        const result = ume.mylist.search({ query: "en lomes" });
        assert.isAtLeast(result.length, 2);
        assert.isDefined(result.find((e) => e.slug == "enola-holmes"));
        assert.isDefined(result.find((e) => e.slug == "enola-holmes-2"));
      },
    },
  });

  const argc = process.argv.length - 2;
  const argv = process.argv.slice(2);

  if (argc == 0) {
    await tests.run();
  } else {
    const { values, positionals } = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        list: {
          type: "boolean",
        },
      },
    });

    if (values.list) {
      console.log(tests.keys);
      return;
    }

    for (const arg of positionals) {
      if (!tests.has(arg)) {
        throw new Error(`"${arg}" is not a valid test`);
      }
      await tests.run(arg);
    }
  }
}

main();
