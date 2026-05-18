import { describe, expect, it } from "vitest";

import { normalizeAdminLoginIdentifier, normalizeVietnamPhone } from "./identity";

describe("normalizeVietnamPhone", () => {
  it.each([
    ["0912345678", "0912345678"],
    ["0912 345 678", "0912345678"],
    ["0912.345.678", "0912345678"],
    ["0912-345-678", "0912345678"],
    ["+84912345678", "0912345678"],
    ["84912345678", "0912345678"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeVietnamPhone(input)).toBe(expected);
  });

  it.each(["", "admin", "12345", "190012345678901", "+123456789"])(
    "rejects %s",
    (input) => {
      expect(normalizeVietnamPhone(input)).toBe("");
    },
  );
});

describe("normalizeAdminLoginIdentifier", () => {
  it("returns phone identity when input is a phone number", () => {
    expect(normalizeAdminLoginIdentifier("+84912345678")).toEqual({
      type: "phone",
      value: "0912345678",
    });
  });

  it("returns username identity otherwise", () => {
    expect(normalizeAdminLoginIdentifier("admin")).toEqual({
      type: "username",
      value: "admin",
    });
  });
});
