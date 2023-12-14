export async function get(url: string, headers?: Headers): Promise<string> {
  const response = await fetch(url, {
    headers,
  }).catch((err) => {
    throw new Error(`While trying to get ${url}: ${err}`);
  });
  return response.text();
}

export async function post(url: string, body: object): Promise<string> {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }).catch((err) => {
    throw new Error(`While trying to post: ${body} to ${url}: ${err}`);
  });
  return response.text();
}

export async function conn_exists(url: string) {
  try {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 2000);

    try {
      await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
      });
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }

    return true;
  } catch (error) {
    return false;
  }
}

export async function take_match_groups(
  url: string,
  regex: RegExp,
  groups: number[]
): Promise<string[]>;

export async function take_match_groups(
  url: string,
  regex: RegExp,
  groups: number
): Promise<string>;

export async function take_match_groups(
  url: string,
  regex: RegExp,
  groups: number | number[]
): Promise<string | string[]> {
  const parts: string[] = [];

  const raw = await get(url);
  const match = raw.match(regex);
  if (!match) {
    throw new Error(
      `Expected data from regex match but got null: page(${url}), regex(${regex.source}), groups(${groups})`
    );
  }

  if (Array.isArray(groups)) {
    groups.forEach((group) => {
      if (!match[group]) {
        throw new Error(
          `Expected data from group but got null: page(${url}), regex(${regex.source}), group(${group})`
        );
      }

      parts.push(decode_utf8(decode_html(match[group])));
    });
  } else {
    if (!match[groups]) {
      throw new Error(
        `Expected data from group but got null: page(${url}), regex(${regex.source}), group(${groups})`
      );
    }

    return decode_utf8(decode_html(match[groups as number]));
  }

  return parts;
}

export function decode_utf8(utf8_encoded: string): string {
  return decode_with_table(utf8_encoded, {
    "\u00e8": "è",
    "\u0027": "'",
  });
}

export function decode_html(html_encoded: string): string {
  return decode_with_table(html_encoded, {
    "&quot;": '"',
    "&#39;": "'",
    "&amp;": "&",
  });
}

function decode_with_table(s: string, table: Record<string, string>): string {
  let replace = s;
  for (const key in table) {
    replace = replace.replace(new RegExp(key, "g"), table[key]);
  }
  return replace;
}

export const DATA_PAGE_REGEX = /<div id="app" data-page="(.+)"><!--/s;
export const DATA_PAGE_GROUP_INDEX = 1;

export async function get_buffer(url: string): Promise<ArrayBuffer> {
  return await (
    await fetch(url).catch((err) => {
      throw new Error(`While trying to get ${url}: ${err}`);
    })
  ).arrayBuffer();
}

export async function parse_video_playlist(
  url: string
): Promise<[segments: string[], iv?: Uint8Array, key?: ArrayBuffer]> {
  const playlist = (await get(url)).split("\n");

  let iv_bytes: Uint8Array | undefined;
  let key: ArrayBuffer | undefined;

  playlist.find((line) => {
    const iv_index = line.indexOf("IV=");
    if (iv_index != -1) {
      const iv_str = line.substring(iv_index + 3);
      iv_bytes = new Uint8Array(16);
      for (let i = 0; i < iv_str.length; i += 2) {
        iv_bytes[i / 2] = parseInt(iv_str.substring(i, i + 2), 16);
      }

      return true;
    }
  });

  if (iv_bytes) {
    key = await get_buffer("https://scws.work/storage/enc.key");
  }

  return [playlist.filter((line) => line.endsWith(".ts")), iv_bytes, key];
}

export async function parse_subtitle_playlist(url: string): Promise<string> {
  return (await get(url))
    .split("\n")
    .find((line) => line.indexOf(".vtt") != -1)!;
}
