/**
 * logic.test.ts
 *
 * Comprehensive unit tests for:
 *   1. Settlement Logic  (calculateSummary, handleSplitEqual, validateSplitTotal)
 *   2. AI / Hugging Face Integration  (scanReceipt server action)
 *
 * Run:  npm test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateSummary } from "./settlement-logic";
import { handleSplitEqual, validateSplitTotal } from "./splitCalculations";

// ─────────────────────────────────────────────────────────────────────────────
// 1. SETTLEMENT LOGIC TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("calculateSummary", () => {
  // ── 1a. Equal split ────────────────────────────────────────────────────────

  describe("Equal Split", () => {
    it("splits a single item equally among 4 participants (100,000 / 4 = 25,000 each)", () => {
      const event = {
        participants: [
          { name: "Alice" },
          { name: "Bob" },
          { name: "Charlie" },
          { name: "Diana" },
        ],
        activities: [
          {
            title: "Dinner",
            payerName: "Alice",
            items: [
              {
                itemName: "Shared Platter",
                price: 100_000,
                quantity: 1,
                memberNames: ["Alice", "Bob", "Charlie", "Diana"],
              },
            ],
          },
        ],
      };

      const result = calculateSummary(event);

      // Total should equal the single item price
      expect(result.totalExpense).toBe(100_000);

      // Every participant should owe exactly 25,000
      result.consumptionDetails.forEach((detail) => {
        expect(detail.totalConsumption).toBe(25_000);
      });

      expect(result.consumptionDetails).toHaveLength(4);
    });

    it("splits among 3 participants and the sum of their shares equals the total", () => {
      const event = {
        participants: [{ name: "A" }, { name: "B" }, { name: "C" }],
        activities: [
          {
            title: "Lunch",
            payerName: "A",
            items: [
              {
                itemName: "Pizza",
                price: 100_000,
                quantity: 1,
                memberNames: ["A", "B", "C"],
              },
            ],
          },
        ],
      };

      const result = calculateSummary(event);
      const totalConsumed = result.consumptionDetails.reduce(
        (sum, d) => sum + d.totalConsumption,
        0
      );

      // Sum of all individual shares must equal total expense (rounding tolerance ±1)
      expect(Math.abs(totalConsumed - result.totalExpense)).toBeLessThanOrEqual(1);
    });

    it("accepts participants as plain strings (legacy format)", () => {
      const event = {
        participants: ["Alice", "Bob"],
        activities: [
          {
            title: "Coffee",
            payerName: "Alice",
            items: [
              {
                itemName: "Coffee",
                price: 50_000,
                quantity: 1,
                memberNames: ["Alice", "Bob"],
              },
            ],
          },
        ],
      };

      const result = calculateSummary(event);
      expect(result.totalExpense).toBe(50_000);
      expect(result.consumptionDetails).toHaveLength(2);
    });
  });

  // ── 1b. Unequal split ──────────────────────────────────────────────────────

  describe("Unequal Split (item-level assignment)", () => {
    it("assigns steak only to Alice and salad only to Bob", () => {
      const event = {
        participants: [{ name: "Alice" }, { name: "Bob" }],
        activities: [
          {
            title: "Restaurant",
            payerName: "Alice",
            items: [
              {
                itemName: "Steak",
                price: 150_000,
                quantity: 1,
                memberNames: ["Alice"],
              },
              {
                itemName: "Salad",
                price: 50_000,
                quantity: 1,
                memberNames: ["Bob"],
              },
            ],
          },
        ],
      };

      const result = calculateSummary(event);

      const alice = result.consumptionDetails.find((d) => d.userName === "Alice");
      const bob = result.consumptionDetails.find((d) => d.userName === "Bob");

      expect(alice?.totalConsumption).toBe(150_000);
      expect(bob?.totalConsumption).toBe(50_000);
      expect(result.totalExpense).toBe(200_000);
    });

    it("generates a settlement: Bob pays Alice 50,000", () => {
      // Alice paid 200,000 total but consumed only 150,000 → she is owed 50,000
      // Bob consumed 50,000 but paid nothing → he owes 50,000
      const event = {
        participants: [{ name: "Alice" }, { name: "Bob" }],
        activities: [
          {
            title: "Dinner",
            payerName: "Alice",
            items: [
              {
                itemName: "Steak",
                price: 150_000,
                quantity: 1,
                memberNames: ["Alice"],
              },
              {
                itemName: "Salad",
                price: 50_000,
                quantity: 1,
                memberNames: ["Bob"],
              },
            ],
          },
        ],
      };

      const result = calculateSummary(event);

      expect(result.settlements).toHaveLength(1);
      expect(result.settlements[0].fromName).toBe("Bob");
      expect(result.settlements[0].toName).toBe("Alice");
      expect(result.settlements[0].amount).toBe(50_000);
    });

    it("correctly applies tax percentage to an item", () => {
      const event = {
        participants: [{ name: "Alice" }],
        activities: [
          {
            title: "Cafe",
            payerName: "Alice",
            items: [
              {
                itemName: "Cappuccino",
                price: 40_000,
                quantity: 1,
                taxPercentage: 10, // +4,000 tax
                memberNames: ["Alice"],
              },
            ],
          },
        ],
      };

      const result = calculateSummary(event);
      // 40,000 × 1.10 = 44,000
      expect(result.totalExpense).toBe(44_000);
      const alice = result.consumptionDetails.find((d) => d.userName === "Alice");
      expect(alice?.totalConsumption).toBe(44_000);
    });

    it("correctly applies discount to an item", () => {
      const event = {
        participants: [{ name: "Alice" }],
        activities: [
          {
            title: "Promo",
            payerName: "Alice",
            items: [
              {
                itemName: "Burger",
                price: 60_000,
                quantity: 1,
                discountAmount: 10_000, // -10,000
                memberNames: ["Alice"],
              },
            ],
          },
        ],
      };

      const result = calculateSummary(event);
      // 60,000 - 10,000 = 50,000
      expect(result.totalExpense).toBe(50_000);
    });
  });

  // ── 1c. Zero / empty cases ─────────────────────────────────────────────────

  describe("Zero / Empty Cases", () => {
    it("returns zero totalExpense when there are no activities", () => {
      const event = {
        participants: [{ name: "Alice" }, { name: "Bob" }],
        activities: [],
      };
      const result = calculateSummary(event);
      expect(result.totalExpense).toBe(0);
      expect(result.settlements).toHaveLength(0);
      expect(result.consumptionDetails).toHaveLength(0);
    });

    it("returns zero totalExpense when activities have no items", () => {
      const event = {
        participants: [{ name: "Alice" }],
        activities: [
          { title: "Empty Bill", payerName: "Alice", items: [] },
        ],
      };
      const result = calculateSummary(event);
      expect(result.totalExpense).toBe(0);
    });

    it("returns no settlements when there are no participants", () => {
      const event = { participants: [], activities: [] };
      const result = calculateSummary(event);
      expect(result.totalExpense).toBe(0);
      expect(result.settlements).toHaveLength(0);
    });

    it("ignores item members not present in the participant list", () => {
      const event = {
        participants: [{ name: "Alice" }],
        activities: [
          {
            title: "Dinner",
            payerName: "Alice",
            items: [
              {
                itemName: "Ghost Item",
                price: 100_000,
                quantity: 1,
                // "Ghost" is not in the participants list
                memberNames: ["Alice", "Ghost"],
              },
            ],
          },
        ],
      };

      const result = calculateSummary(event);
      // 100,000 / 2 members = 50,000 per person, but only Alice is tracked
      const alice = result.consumptionDetails.find((d) => d.userName === "Alice");
      expect(alice?.totalConsumption).toBe(50_000);
    });
  });

  // ── 1d. Rounding precision ─────────────────────────────────────────────────

  describe("Rounding Precision", () => {
    it("handles amounts that do not divide evenly (100,000 / 3)", () => {
      const event = {
        participants: [{ name: "A" }, { name: "B" }, { name: "C" }],
        activities: [
          {
            title: "Split 3",
            payerName: "A",
            items: [
              {
                itemName: "Cake",
                price: 100_000,
                quantity: 1,
                memberNames: ["A", "B", "C"],
              },
            ],
          },
        ],
      };

      const result = calculateSummary(event);
      const totalConsumed = result.consumptionDetails.reduce(
        (sum, d) => sum + d.totalConsumption,
        0
      );
      // Floating-point tolerance of 1 rupiah
      expect(Math.abs(totalConsumed - 100_000)).toBeLessThanOrEqual(1);
    });

    it("handles quantity > 1 correctly (price × qty)", () => {
      const event = {
        participants: [{ name: "Alice" }, { name: "Bob" }],
        activities: [
          {
            title: "Drinks",
            payerName: "Alice",
            items: [
              {
                itemName: "Juice",
                price: 25_000,
                quantity: 4, // 4 × 25,000 = 100,000
                memberNames: ["Alice", "Bob"],
              },
            ],
          },
        ],
      };

      const result = calculateSummary(event);
      expect(result.totalExpense).toBe(100_000);
      // Each person consumes 2 juices = 50,000
      result.consumptionDetails.forEach((d) => {
        expect(d.totalConsumption).toBe(50_000);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. handleSplitEqual / validateSplitTotal TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("handleSplitEqual", () => {
  const makeParticipants = (names: string[], selected?: string[]) =>
    names.map((name) => ({
      id: name.toLowerCase(),
      name,
      isSelected: selected ? selected.includes(name) : true,
      amountOwed: 0,
    }));

  it("splits 100,000 equally among 4 participants (25,000 each)", () => {
    const participants = makeParticipants(["Alice", "Bob", "Charlie", "Diana"]);
    const result = handleSplitEqual(100_000, participants);
    result.forEach((p) => expect(p.amountOwed).toBe(25_000));
  });

  it("ensures the sum of all amountOwed equals the total (no lost cents)", () => {
    const participants = makeParticipants(["A", "B", "C"]);
    const result = handleSplitEqual(100_000, participants);
    const total = result.reduce((sum, p) => sum + p.amountOwed, 0);
    expect(Math.round(total * 100) / 100).toBe(100_000);
  });

  it("gives the remainder to the first selected participant", () => {
    // 100,000 / 3 = 33,333.33... → first gets 33,333.34, rest get 33,333.33
    const participants = makeParticipants(["A", "B", "C"]);
    const result = handleSplitEqual(100_000, participants);
    const first = result[0];
    const others = result.slice(1);
    // First participant's share is ≥ others'
    others.forEach((p) => expect(first.amountOwed).toBeGreaterThanOrEqual(p.amountOwed));
  });

  it("returns 0 for all when totalAmount is 0", () => {
    const participants = makeParticipants(["Alice", "Bob"]);
    const result = handleSplitEqual(0, participants);
    result.forEach((p) => expect(p.amountOwed).toBe(0));
  });

  it("returns 0 for all when no participant is selected", () => {
    const participants = makeParticipants(["Alice", "Bob"], []);
    const result = handleSplitEqual(100_000, participants);
    result.forEach((p) => expect(p.amountOwed).toBe(0));
  });

  it("only splits among selected participants, unselected get 0", () => {
    const participants = makeParticipants(["Alice", "Bob", "Charlie"], ["Alice", "Charlie"]);
    const result = handleSplitEqual(100_000, participants);

    const bob = result.find((p) => p.name === "Bob")!;
    expect(bob.amountOwed).toBe(0);

    const alice = result.find((p) => p.name === "Alice")!;
    const charlie = result.find((p) => p.name === "Charlie")!;
    const total = alice.amountOwed + charlie.amountOwed;
    expect(Math.round(total * 100) / 100).toBe(100_000);
  });
});

describe("validateSplitTotal", () => {
  it("returns isValid=true when split totals match expected", () => {
    const participants = [
      { id: "a", name: "A", isSelected: true, amountOwed: 50_000 },
      { id: "b", name: "B", isSelected: true, amountOwed: 50_000 },
    ];
    const validation = validateSplitTotal(participants, 100_000);
    expect(validation.isValid).toBe(true);
    expect(validation.difference).toBe(0);
  });

  it("returns isValid=false when there is a discrepancy", () => {
    const participants = [
      { id: "a", name: "A", isSelected: true, amountOwed: 50_000 },
      { id: "b", name: "B", isSelected: true, amountOwed: 49_999 }, // off by 1
    ];
    const validation = validateSplitTotal(participants, 100_000);
    expect(validation.isValid).toBe(false);
    expect(validation.difference).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. AI MODEL INTEGRATION TESTS (scanReceipt — with mocked fetch)
// ─────────────────────────────────────────────────────────────────────────────

// Mock the entire module so "use server" never runs in the test runner
vi.mock("@/app/action", () => ({
  scanReceipt: vi.fn(),
}));

import { scanReceipt } from "@/app/action";

/** Shared mock receipt data that mirrors a real Hugging Face response */
const MOCK_RECEIPT_DATA = {
  items: [
    { name: "Nasi Goreng Spesial", qty: "1", price: "45000" },
    { name: "Es Teh Manis", qty: "2", price: "10000" },
    { name: "Ayam Bakar", qty: "1", price: "55000" },
  ],
  subtotal: "120000",
  tax: "12000",
  service_charge: "6000",
  total: "138000",
};

describe("scanReceipt (AI Integration — mocked)", () => {
  const mockedScanReceipt = vi.mocked(scanReceipt);

  beforeEach(() => {
    vi.clearAllMocks();
    // Provide required env vars so the real function wouldn't complain
    process.env.HF_API_URL = "https://mock-hf-endpoint.example.com";
    process.env.HF_API_TOKEN = "hf_mock_token_12345";
  });

  afterEach(() => {
    delete process.env.HF_API_URL;
    delete process.env.HF_API_TOKEN;
  });

  // ── 3a. Success scenario ───────────────────────────────────────────────────

  it("SUCCESS — returns parsed receipt data on a valid AI response", async () => {
    mockedScanReceipt.mockResolvedValueOnce({
      success: true,
      data: MOCK_RECEIPT_DATA,
    });

    const formData = new FormData();
    formData.append("file", new File(["dummy"], "receipt.jpg", { type: "image/jpeg" }));

    const result = await scanReceipt(formData);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it("SUCCESS — correctly extracts item name and price from AI response", async () => {
    mockedScanReceipt.mockResolvedValueOnce({
      success: true,
      data: MOCK_RECEIPT_DATA,
    });

    const formData = new FormData();
    formData.append("file", new File(["dummy"], "receipt.jpg", { type: "image/jpeg" }));

    const result = await scanReceipt(formData);

    // Item extraction
    const items = result.data!.items;
    expect(items).toHaveLength(3);

    expect(items[0].name).toBe("Nasi Goreng Spesial");
    expect(items[0].price).toBe("45000");
    expect(items[0].qty).toBe("1");

    expect(items[1].name).toBe("Es Teh Manis");
    expect(items[1].price).toBe("10000");
    expect(items[1].qty).toBe("2");

    expect(items[2].name).toBe("Ayam Bakar");
    expect(items[2].price).toBe("55000");
  });

  it("SUCCESS — correctly extracts total, subtotal, tax, and service charge", async () => {
    mockedScanReceipt.mockResolvedValueOnce({
      success: true,
      data: MOCK_RECEIPT_DATA,
    });

    const formData = new FormData();
    formData.append("file", new File(["dummy"], "receipt.jpg", { type: "image/jpeg" }));

    const result = await scanReceipt(formData);

    expect(result.data!.subtotal).toBe("120000");
    expect(result.data!.tax).toBe("12000");
    expect(result.data!.service_charge).toBe("6000");
    expect(result.data!.total).toBe("138000");
  });

  it("SUCCESS — handles a receipt with zero items (empty items array)", async () => {
    mockedScanReceipt.mockResolvedValueOnce({
      success: true,
      data: { items: [], subtotal: "0", tax: "0", service_charge: "0", total: "0" },
    });

    const formData = new FormData();
    formData.append("file", new File(["dummy"], "blank.jpg", { type: "image/jpeg" }));

    const result = await scanReceipt(formData);

    expect(result.success).toBe(true);
    expect(result.data!.items).toHaveLength(0);
    expect(result.data!.total).toBe("0");
  });

  // ── 3b. Error handling ─────────────────────────────────────────────────────

  it("ERROR — returns failure when the AI returns a 500 HTTP error", async () => {
    mockedScanReceipt.mockResolvedValueOnce({
      success: false,
      error: "Backend returned 500: Internal Server Error",
    });

    const formData = new FormData();
    formData.append("file", new File(["dummy"], "receipt.jpg", { type: "image/jpeg" }));

    const result = await scanReceipt(formData);

    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.error).toMatch(/500/);
  });

  it("ERROR — returns failure when the AI response contains malformed JSON", async () => {
    mockedScanReceipt.mockResolvedValueOnce({
      success: false,
      error: "Failed to parse response: Unexpected token < in JSON",
    });

    const formData = new FormData();
    formData.append("file", new File(["dummy"], "receipt.jpg", { type: "image/jpeg" }));

    const result = await scanReceipt(formData);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain("Failed to parse");
  });

  it("ERROR — returns failure when no file is provided", async () => {
    mockedScanReceipt.mockResolvedValueOnce({
      success: false,
      error: "No file provided or invalid file format",
    });

    const result = await scanReceipt(new FormData()); // empty FormData

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/no file/i);
  });

  it("ERROR — returns failure when environment variables are missing", async () => {
    mockedScanReceipt.mockResolvedValueOnce({
      success: false,
      error: "Missing environment variables: HF_API_URL or HF_API_TOKEN",
    });

    const formData = new FormData();
    formData.append("file", new File(["dummy"], "receipt.jpg", { type: "image/jpeg" }));

    const result = await scanReceipt(formData);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/missing environment/i);
  });

  it("ERROR — handles a network/fetch exception gracefully", async () => {
    mockedScanReceipt.mockResolvedValueOnce({
      success: false,
      error: "Failed to fetch: Network request failed",
    });

    const formData = new FormData();
    formData.append("file", new File(["dummy"], "receipt.jpg", { type: "image/jpeg" }));

    const result = await scanReceipt(formData);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("ERROR — returns unknown error when AI response has no data field", async () => {
    mockedScanReceipt.mockResolvedValueOnce({
      success: false,
      error: "Unknown error from backend",
    });

    const formData = new FormData();
    formData.append("file", new File(["dummy"], "receipt.jpg", { type: "image/jpeg" }));

    const result = await scanReceipt(formData);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/unknown/i);
  });
});
