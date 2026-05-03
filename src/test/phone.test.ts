import { describe, it, expect } from "vitest";
import { toE164, isE164 } from "@/lib/phone";

describe("toE164", () => {
  it("BR cellphone with DDD (11 digits)", () => {
    expect(toE164("(31) 99724-6145").value).toBe("+5531997246145");
  });
  it("BR with country code already", () => {
    expect(toE164("+55 31 99724-6145").value).toBe("+5531997246145");
  });
  it("plain digits 5511999567436", () => {
    expect(toE164("5511999567436").value).toBe("+5511999567436");
  });
  it("p:+5554996802031 prefixed garbage", () => {
    expect(toE164("p:+5554996802031").value).toBe("+5554996802031");
  });
  it("11 digit no DDI", () => {
    expect(toE164("11999007447").value).toBe("+5511999007447");
  });
  it("--- empty", () => {
    expect(toE164("---").ok).toBe(false);
  });
  it("validates E.164", () => {
    expect(isE164("+5531997246145")).toBe(true);
    expect(isE164("31997246145")).toBe(false);
  });
});
