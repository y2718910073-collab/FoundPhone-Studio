import { describe, expect, it } from "vitest";
import { numericPrice, parseCart, parseOrders } from "./LocalShop";
import { parsePersonalRecords } from "./PersonalRecords";
import { makeItem } from "../schema";

describe("saved local shopping state", () => {
  it("parses only bounded quantities and rejects malformed or polluted data", () => {
    expect(parseCart('{"a":2,"b":99,"c":101,"d":-4,"e":"2"}')).toEqual({ a:2,b:99 });
    expect(parseCart("not json")).toEqual({});
    expect(parseCart("null")).toEqual({});
  });
  it("retains only valid local orders", () => {
    const valid = {id:"one",title:"纸书",price:19,quantity:2,status:"已下单",createdAt:"2026-10-28T10:00:00.000Z"};
    expect(parseOrders(JSON.stringify([valid,{...valid,status:"未知"}]))).toEqual([valid]);
    expect(parseOrders("{}")).toEqual([]);
  });
  it("uses the catalog price and handles bad values safely", () => {
    expect(numericPrice(makeItem({meta:{price:"29.50"}}))).toBe(29.5);
    expect(numericPrice(makeItem({meta:{price:"not available"}}))).toBe(0);
  });
});
describe("user-created personal records", () => {
  it("reopens valid records and ignores malformed state", () => {
    const valid = {id:"test",title:"备忘录",detail:"正文",completed:false,updatedAt:"2026-10-28"};
    expect(parsePersonalRecords(JSON.stringify([valid,{title:"missing id"}]))).toEqual([valid]);
    expect(parsePersonalRecords("[]")).toEqual([]);
    expect(parsePersonalRecords("{oops")).toEqual([]);
  });
});
