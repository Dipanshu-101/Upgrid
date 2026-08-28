import { describe, it, expect } from "vitest";
import axios from "axios";

const BASE_URL = "http://localhost:3001";

describe("Website gets created", () => {
  it("Website not created if url is not present", async () => {
    try {
      await axios.post(`${BASE_URL}/website`, {});

      expect(false, "website created when it shouldn't");
    } catch (e) {}
  });

  it("Website is created if url is present", async () => {
    const response = await axios.post(`${BASE_URL}/website`, {
      url: "https://google.com",
    });

    expect(response.data.id).not.toBeNull();
  });
});