import { describe, expect, it } from "vitest";
import {
  asRecord,
  displayValue,
  formatTimestamp,
} from "@/components/operations/operation-register";

describe("operation register presentation guards", () => {
  it("converts only object-like values to safe records", () => {
    expect(asRecord({ status: "OPEN" })).toEqual({ status: "OPEN" });
    expect(asRecord(null)).toEqual({});
    expect(asRecord([])).toEqual({});
    expect(asRecord("partial response")).toEqual({});
  });

  it("uses safe placeholders for missing values and malformed timestamps", () => {
    expect(displayValue(undefined)).toBe("—");
    expect(displayValue(0)).toBe("0");
    expect(formatTimestamp(undefined)).toBe("—");
    expect(formatTimestamp("not-a-timestamp")).toBe("—");
  });
});
