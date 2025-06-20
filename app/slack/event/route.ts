import {
  AppMention,
  decodeAppMentionEvent,
  decodeEndpointHandshake,
  decodeEventCallback,
} from "@/src/slack/events";
import { waitUntil } from "@vercel/functions";
import { NextRequest } from "next/server";
import { union } from "typescript-json-decoder";
import path from "path";
import { promises as fs } from "fs";
import OpenAI from "openai";
import { WebClient } from "@slack/web-api";

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

  const prompt = await fs.readFile(
    path.join(process.cwd(), "/app/prompt.txt"),
    "utf-8"
  );

  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: mention.text,
    instructions: prompt,
    previous_response_id: undefined, // TBD
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

  await stopSpinner();
  await slack.chat.postMessage({
    channel: mention.channel,
    thread_ts: mention.event_ts,
    text: response.output_text,
  });
}
