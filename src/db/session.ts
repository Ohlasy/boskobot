import {
  decodeType,
  field,
  optional,
  record,
  string,
} from "typescript-json-decoder";
import { getTableById, logErrorAndReturnNull } from "./shared";

const table = () => getTableById("tbl1FyksMUFTYj1uk");

export const defaultModelId = "recDdQrpb7l8F7esJ";

export type Session = decodeType<typeof decodeSession>;
export const decodeSession = record({
  databaseId: field("ID", string),
  sessionId: field("Session ID", string),
  lastResponseId: field("Last Response ID", string),
  slackLink: field("Slack Link", optional(string)),
});

export const getExistingSession = (id: string): Promise<Session | null> =>
  table()
    .select({
      maxRecords: 1,
      filterByFormula: `{Session ID} = "${id}"`,
    })
    .all()
    .then((records) => records[0].fields)
    .then(decodeSession)
    .catch(logErrorAndReturnNull);

export const saveSession = (session: Session): Promise<Session | null> =>
  table()
    .update(session.databaseId, {
      "Last Response ID": session.lastResponseId,
    })
    .then((record) => record.fields)
    .then(decodeSession)
    .catch(logErrorAndReturnNull);

export const createSession = (
  session: Omit<Session, "databaseId">
): Promise<Session | null> =>
  table()
    .create({
      "Session ID": session.sessionId,
      "Last Response ID": session.lastResponseId,
      "Slack Link": session.slackLink,
      "Model": [defaultModelId],
    })
    .then((record) => record.fields)
    .then(decodeSession)
    .catch(logErrorAndReturnNull);
