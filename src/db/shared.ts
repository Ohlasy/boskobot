import Airtable from "airtable";
import {
  array,
  DecoderFunction,
  number,
  record,
  string,
  undef,
  union,
} from "typescript-json-decoder";

/**
 * The Airtable base with our tables
 *
 * Creating this objects reads `AIRTABLE_API_TOKEN` from env.
 */
export const getTableById = (tableId: string) =>
  new Airtable().base("appGuHpWjhgFytJ09")(tableId);

/** Decode first element of an array, returns `undefined` if array is empty */
export const decodeFirst =
  <T>(decodeItem: DecoderFunction<T>) =>
  (value: unknown): T | undefined => {
    const decodeItems = array(decodeItem);
    const items = decodeItems(value);
    return items.at(0) as T | undefined;
  };

/** Decode an array, treating `undefined` as empty array */
export const optionalArray =
  <T>(decodeItem: DecoderFunction<T>) =>
  (value: unknown) => {
    if (typeof value === "undefined") {
      return [];
    } else {
      const decodeItems = array(decodeItem);
      return decodeItems(value);
    }
  };

/**
 * Decode Airtable lookup field
 *
 * Lookup fields are represented as arrays of strings in the API.
 */
export const decodeLookupField = union(undef, decodeFirst(string));

/**
 * Decode Airtable linked record field
 *
 * Linked records are represented as arrays of record IDs in the API.
 */
export const decodeLinkedRecord = decodeLookupField;

/** Decode Airtable Attachment field */
export const decodeAttachment = record({
  id: string,
  url: string,
  filename: string,
  type: string,
  size: number,
});

export const logErrorAndReturnNull = (e: Error) => {
  console.error(e);
  return null;
};

export const logJsonValueAndContinue = <T>(val: T): T => {
  console.log(JSON.stringify(val, null, 2));
  return val;
};
