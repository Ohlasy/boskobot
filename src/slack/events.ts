import {
  DecoderFunction,
  decodeType,
  literal,
  optional,
  record,
  string,
} from "typescript-json-decoder";

/** The initial handshake challenge sent by Slack to verify endpoint authenticity */
export type EndpointHandshake = decodeType<typeof decodeEndpointHandshake>;
export const decodeEndpointHandshake = record({
  token: string,
  challenge: string,
  type: literal("url_verification"),
});

/** A generic event callback with a customizable event decoder */
export type EventCallback = decodeType<typeof decodeEventCallback>;
export const decodeEventCallback = <Event>(
  decodeEvent: DecoderFunction<Event>
) =>
  record({
    token: string,
    team_id: string,
    api_app_id: string,
    type: literal("event_callback"),
    event: decodeEvent,
  });

/** Event received when somebody mentions an app */
export type AppMention = decodeType<typeof decodeAppMentionEvent>;
export const decodeAppMentionEvent = record({
  type: literal("app_mention"),
  user: string,
  text: string,
  ts: string,
  channel: string,
  event_ts: string,
  thread_ts: optional(string),
});
