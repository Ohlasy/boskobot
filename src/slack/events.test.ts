import assert from "node:assert";
import test from "node:test";
import {
  decodeAppMentionEvent,
  decodeEndpointHandshake,
  decodeEventCallback,
} from "./events";
import { record } from "typescript-json-decoder";

test("Decode initial handshake", () => {
  const payload = {
    token: "Jhj5dZrVaK7ZwHHjRyZWjbDl",
    challenge: "3eZbrw1aBm2rZgRNFdxV2595E9CY3gmdALWMmHkvFXO7tYXAYM8P",
    type: "url_verification",
  };
  assert.deepEqual(decodeEndpointHandshake(payload), payload);
});

test("Decode event callback", () => {
  const payload = {
    token: "ZZZZZZWSxiZZZ2yIvs3peJ",
    team_id: "T123ABC456",
    api_app_id: "A123ABC456",
    event: {},
    type: "event_callback",
    event_id: "Ev123ABC456",
    event_time: 1515449522000016,
    authed_users: ["U0LAN0Z89"],
  };
  const decodeDummyEvent = decodeEventCallback(record({}));
  assert.deepEqual(decodeDummyEvent(payload), {
    token: "ZZZZZZWSxiZZZ2yIvs3peJ",
    team_id: "T123ABC456",
    api_app_id: "A123ABC456",
    type: "event_callback",
    event: {},
  });
});

test("Decode app mention event", () => {
  const payload = {
    type: "app_mention",
    user: "U061F7AUR",
    text: "<@U0LAN0Z89> is it everything a river should be?",
    ts: "1515449522.000016",
    channel: "C123ABC456",
    event_ts: "1515449522000016",
  };
  assert.deepEqual(decodeAppMentionEvent(payload), {
    type: "app_mention",
    user: "U061F7AUR",
    text: "<@U0LAN0Z89> is it everything a river should be?",
    ts: "1515449522.000016",
    channel: "C123ABC456",
    event_ts: "1515449522000016",
    thread_ts: undefined,
  });
});

test("Decode real-world app mention event", () => {
  const payload = {
    user: "UJJ3MNA91",
    type: "app_mention",
    ts: "1749884891.812059",
    client_msg_id: "6bb37b7b-a3b3-4d97-8fb7-a25c0fdde047",
    text: "<@U09145W3EAJ> Hi, I just need a response to test something, make something up. Anything. Surprise me.",
    team: "TG21XF887",
    thread_ts: "1749884517.657749",
    parent_user_id: "UJJ3MNA91",
    blocks: [
      {
        type: "rich_text",
        block_id: "CnaAq",
        elements: [
          {
            type: "rich_text_section",
            elements: [
              {
                type: "user",
                user_id: "U09145W3EAJ",
              },
              {
                type: "text",
                text: " Hi, I just need a response to test something, make something up. Anything. Surprise me.",
              },
            ],
          },
        ],
      },
    ],
    channel: "C0918Q3G85B",
    event_ts: "1749884891.812059",
  };
  assert.deepEqual(decodeAppMentionEvent(payload), {
    channel: "C0918Q3G85B",
    event_ts: "1749884891.812059",
    text: "<@U09145W3EAJ> Hi, I just need a response to test something, make something up. Anything. Surprise me.",
    ts: "1749884891.812059",
    type: "app_mention",
    user: "UJJ3MNA91",
    thread_ts: "1749884517.657749",
  });
});
