import {
  AppMention,
  decodeAppMentionEvent,
  decodeEndpointHandshake,
  decodeEventCallback,
} from "@/src/slack/events";
import { waitUntil } from "@vercel/functions";
import { NextRequest } from "next/server";
import { record, string, union } from "typescript-json-decoder";
import path from "path";
import { promises as fs } from "fs";
import OpenAI from "openai";
import { WebClient } from "@slack/web-api";
import {
  createSession,
  getExistingSession,
  saveSession,
} from "@/src/db/session";

export async function POST(request: NextRequest): Promise<Response> {
  const decodeIncomingMessage = union(
    decodeEndpointHandshake,
    decodeEventCallback(decodeAppMentionEvent)
  );
  try {
    const msg = decodeIncomingMessage(await request.json());
    if (msg.token !== process.env.SLACK_LEGACY_VERIFICATION_TOKEN) {
      console.error("Slack verification token does not match, ignoring.");
      return new Response("Verification token does not match", { status: 403 });
    }
    switch (msg.type) {
      case "url_verification":
        console.log("Received Slack URL verification request.");
        return new Response(msg.challenge, { status: 200 });
      case "event_callback":
        const event = msg.event as AppMention;
        console.log(
          `Received Slack app mention event, time stamp ${event.ts}, thread time stamp ${event.thread_ts}.`
        );
        // Return a response to Slack immediately, but also wait
        // for the chat response to finish before exiting
        waitUntil(respondToMention(event));
        return new Response("OK, thanks!", { status: 200 });
    }
  } catch {
    return new Response("Cannot decode handshake event", { status: 400 });
  }
}

async function respondToMention(mention: AppMention) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

  const spinnerReaction = "hourglass_flowing_sand";

  // Start spinner
  await slack.reactions.add({
    name: spinnerReaction,
    channel: mention.channel,
    timestamp: mention.ts,
  });

  const stopSpinner = () =>
    slack.reactions.remove({
      name: spinnerReaction,
      channel: mention.channel,
      timestamp: mention.ts,
    });

  // Is this mention a part of an existing session?
  const session = mention.thread_ts
    ? await getExistingSession(mention.thread_ts)
    : null;

  if (session) {
    console.log(
      `Mention is a part of existing session ${session.sessionId}, last response ID ${session.lastResponseId}.`
    );
  } else {
    console.log(`Previous session for this mention not found.`);
  }

  const prompt = await fs.readFile(
    path.join(process.cwd(), "/app/prompt.txt"),
    "utf-8"
  );

  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: mention.text,
    instructions: prompt,
    previous_response_id: session?.lastResponseId,
    tools: [
      {
        type: "file_search",
        vector_store_ids: [process.env.VECTOR_STORE_ID ?? "<unset>"],
      },
    ],
  });

  // On error report to the thread and bail out early
  if (response.error) {
    await stopSpinner();
    await slack.chat.postMessage({
      channel: mention.channel,
      thread_ts: mention.event_ts,
      text: response.error.message,
    });
    return;
  }

  // Save session
  if (session) {
    console.log(`Updating last response ID for session to ${response.id}.`);
    await saveSession({ ...session, lastResponseId: response.id });
  } else {
    console.log(
      `Creating new session with initial response ID ${response.id}.`
    );
    const permalink = await slack.chat
      .getPermalink({
        channel: mention.channel,
        message_ts: mention.ts,
      })
      .then(record({ permalink: string }))
      .then((response) => response.permalink)
      .catch((e) => {
        console.error(e);
        return undefined;
      });
    await createSession({
      sessionId: mention.thread_ts ?? mention.ts,
      lastResponseId: response.id,
      slackLink: permalink,
    });
  }

  await stopSpinner();
  await slack.chat.postMessage({
    channel: mention.channel,
    thread_ts: mention.event_ts,
    text: response.output_text,
  });
}
