import { describe, expect, it } from "vitest";
import { isStoredOrganizationValid } from "@/components/app-shell/app-shell";

describe("workspace selection guard", () => {
  const organizations = [
    { id: "org-1", name: "Jakarta" },
    { id: "org-2", name: "Surabaya" },
  ];

  it("allows an unset or currently accessible organization", () => {
    expect(isStoredOrganizationValid("", organizations)).toBe(true);
    expect(isStoredOrganizationValid("org-2", organizations)).toBe(true);
  });

  it("rejects a stale organization selection", () => {
    expect(isStoredOrganizationValid("deleted-org", organizations)).toBe(false);
  });
});
