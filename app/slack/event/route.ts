import { decodeEndpointHandshake } from "@/src/slack/events";
import { NextRequest } from "next/server";
import { union } from "typescript-json-decoder";

export async function POST(request: NextRequest): Promise<Response> {
  const decodeIncomingMessage = union(decodeEndpointHandshake);
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
    }
  } catch {
    return new Response("Cannot decode handshake event", { status: 400 });
  }
}
