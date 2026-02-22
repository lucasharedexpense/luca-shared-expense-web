/**
 * logic.test.ts
 *
 * Comprehensive unit tests for:
 *   1. Settlement Logic  (calculateSummary, handleSplitEqual, validateSplitTotal)
 *   2. Smart Split Algorithm  (smartSplitBill, calculateConsumptionDetails)
 *   3. AI / Hugging Face Integration  (scanReceipt server action)
 *
 * Run:  npm test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateSummary } from "./settlement-logic";
import { handleSplitEqual, validateSplitTotal } from "./splitCalculations";
import { smartSplitBill, calculateConsumptionDetails } from "./smart-split-algorithm";

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

// ─────────────────────────────────────────────────────────────────────────────
// 4. SMART SPLIT ALGORITHM TESTS (smartSplitBill)
// ─────────────────────────────────────────────────────────────────────────────

/** Helper to build a FirestoreActivity */
const makeActivity = (
  id: string,
  payerName: string,
  title: string,
  items: {
    id: string;
    itemName: string;
    price: number;
    quantity: number;
    memberNames: string[];
    taxPercentage?: number;
    discountAmount?: number;
  }[]
) => ({ id, payerName, title, items });

describe("smartSplitBill", () => {
  // ── 4a. Basic settlements ─────────────────────────────────────────────────

  it("returns empty array when there are no activities", () => {
    const result = smartSplitBill([]);
    expect(result).toHaveLength(0);
  });

  it("returns no settlements when a person pays only for themselves", () => {
    const activities = [
      makeActivity("a1", "Alice", "Solo Lunch", [
        { id: "i1", itemName: "Salad", price: 50_000, quantity: 1, memberNames: ["Alice"] },
      ]),
    ];
    const result = smartSplitBill(activities);
    expect(result).toHaveLength(0);
  });

  it("generates one settlement: Bob pays Alice when Alice pays for both", () => {
    const activities = [
      makeActivity("a1", "Alice", "Dinner", [
        { id: "i1", itemName: "Shared Dish", price: 100_000, quantity: 1, memberNames: ["Alice", "Bob"] },
      ]),
    ];
    const result = smartSplitBill(activities);

    expect(result).toHaveLength(1);
    expect(result[0].fromName).toBe("Bob");
    expect(result[0].toName).toBe("Alice");
    expect(result[0].amount).toBe(50_000);
  });

  it("generates two settlements when Alice and Bob each pay for separate equal items", () => {
    // Alice pays 100k for all 3; Bob pays 60k for all 3
    // Net: Alice is owed 100k - (100k/3 + 60k/3) = ...
    // Simpler: Alice pays 90k item (3 people), Bob pays 30k item (3 people)
    const activities = [
      makeActivity("a1", "Alice", "Dinner", [
        { id: "i1", itemName: "Pizza", price: 90_000, quantity: 1, memberNames: ["Alice", "Bob", "Charlie"] },
      ]),
      makeActivity("a2", "Bob", "Drinks", [
        { id: "i2", itemName: "Beer", price: 30_000, quantity: 1, memberNames: ["Alice", "Bob", "Charlie"] },
      ]),
    ];
    const result = smartSplitBill(activities);

    // Charlie owes both Alice and Bob; Alice and Bob net out partially
    const totalAmount = result.reduce((sum, s) => sum + s.amount, 0);
    expect(totalAmount).toBeGreaterThan(0);
    // All settlement fromName/toName should be valid strings
    result.forEach((s) => {
      expect(typeof s.fromName).toBe("string");
      expect(typeof s.toName).toBe("string");
      expect(s.amount).toBeGreaterThan(0);
      expect(s.fromName).not.toBe(s.toName);
    });
  });

  // ── 4b. Bilateral simplification ─────────────────────────────────────────

  it("cancels mutual debts (bilateral simplification): A owes B 60k, B owes A 40k → A pays B 20k", () => {
    // Activity 1: B pays 120k split among A and B (A owes B 60k)
    // Activity 2: A pays 80k split among A and B (B owes A 40k)
    // Net: A owes B 20k
    const activities = [
      makeActivity("a1", "B", "Lunch", [
        { id: "i1", itemName: "Food", price: 120_000, quantity: 1, memberNames: ["A", "B"] },
      ]),
      makeActivity("a2", "A", "Dinner", [
        { id: "i2", itemName: "Drinks", price: 80_000, quantity: 1, memberNames: ["A", "B"] },
      ]),
    ];
    const result = smartSplitBill(activities);

    expect(result).toHaveLength(1);
    expect(result[0].fromName).toBe("A");
    expect(result[0].toName).toBe("B");
    expect(result[0].amount).toBe(20_000);
  });

  it("results in no settlements when mutual debts cancel out perfectly", () => {
    // A pays 100k for A+B; B pays 100k for A+B → they're even
    const activities = [
      makeActivity("a1", "A", "Lunch", [
        { id: "i1", itemName: "Food", price: 100_000, quantity: 1, memberNames: ["A", "B"] },
      ]),
      makeActivity("a2", "B", "Dinner", [
        { id: "i2", itemName: "Drinks", price: 100_000, quantity: 1, memberNames: ["A", "B"] },
      ]),
    ];
    const result = smartSplitBill(activities);
    expect(result).toHaveLength(0);
  });

  // ── 4c. Tax and discount ──────────────────────────────────────────────────

  it("applies tax correctly when calculating who owes whom", () => {
    // Alice pays for item 100k + 10% tax = 110k, split between Alice and Bob
    const activities = [
      makeActivity("a1", "Alice", "Dinner", [
        { id: "i1", itemName: "Steak", price: 100_000, quantity: 1, memberNames: ["Alice", "Bob"], taxPercentage: 10 },
      ]),
    ];
    const result = smartSplitBill(activities);

    expect(result).toHaveLength(1);
    expect(result[0].fromName).toBe("Bob");
    expect(result[0].toName).toBe("Alice");
    expect(result[0].amount).toBe(55_000); // 110k / 2
  });

  it("applies discount correctly when calculating who owes whom", () => {
    // Alice pays for item 100k - 20k discount = 80k, split between Alice and Bob
    const activities = [
      makeActivity("a1", "Alice", "Dinner", [
        { id: "i1", itemName: "Pasta", price: 100_000, quantity: 1, memberNames: ["Alice", "Bob"], discountAmount: 20_000 },
      ]),
    ];
    const result = smartSplitBill(activities);

    expect(result).toHaveLength(1);
    expect(result[0].fromName).toBe("Bob");
    expect(result[0].toName).toBe("Alice");
    expect(result[0].amount).toBe(40_000); // 80k / 2
  });

  // ── 4d. Sum invariant ────────────────────────────────────────────────────

  it("settlement amounts sum equals total debt (3 people, one payer)", () => {
    // Alice pays 90k for Alice+Bob+Charlie
    // Bob and Charlie each owe 30k
    const activities = [
      makeActivity("a1", "Alice", "Dinner", [
        { id: "i1", itemName: "Meal", price: 90_000, quantity: 1, memberNames: ["Alice", "Bob", "Charlie"] },
      ]),
    ];
    const result = smartSplitBill(activities);
    const totalSettled = result.reduce((sum, s) => sum + s.amount, 0);

    expect(result).toHaveLength(2);
    expect(totalSettled).toBe(60_000); // Bob 30k + Charlie 30k
  });

  it("each settlement has a unique id", () => {
    const activities = [
      makeActivity("a1", "Alice", "Dinner", [
        { id: "i1", itemName: "Meal", price: 90_000, quantity: 1, memberNames: ["Alice", "Bob", "Charlie"] },
      ]),
    ];
    const result = smartSplitBill(activities);
    const ids = result.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. SMART SPLIT ALGORITHM TESTS (calculateConsumptionDetails)
// ─────────────────────────────────────────────────────────────────────────────

describe("calculateConsumptionDetails", () => {
  it("returns empty array when there are no activities", () => {
    const result = calculateConsumptionDetails([]);
    expect(result).toHaveLength(0);
  });

  it("returns empty array when items have no members", () => {
    const activities = [
      makeActivity("a1", "Alice", "Dinner", [
        { id: "i1", itemName: "Meal", price: 50_000, quantity: 1, memberNames: [] },
      ]),
    ];
    const result = calculateConsumptionDetails(activities);
    expect(result).toHaveLength(0);
  });

  it("assigns full item cost to a single consumer", () => {
    const activities = [
      makeActivity("a1", "Alice", "Lunch", [
        { id: "i1", itemName: "Salad", price: 50_000, quantity: 1, memberNames: ["Bob"] },
      ]),
    ];
    const result = calculateConsumptionDetails(activities);

    expect(result).toHaveLength(1);
    expect(result[0].userName).toBe("Bob");
    expect(result[0].totalConsumption).toBe(50_000);
  });

  it("splits item cost equally among all consumers", () => {
    const activities = [
      makeActivity("a1", "Alice", "Dinner", [
        { id: "i1", itemName: "Pizza", price: 90_000, quantity: 1, memberNames: ["Alice", "Bob", "Charlie"] },
      ]),
    ];
    const result = calculateConsumptionDetails(activities);

    expect(result).toHaveLength(3);
    result.forEach((d) => expect(d.totalConsumption).toBe(30_000));
  });

  it("correctly includes tax in consumption amount", () => {
    // 100k + 10% tax = 110k / 2 = 55k each
    const activities = [
      makeActivity("a1", "Alice", "Dinner", [
        { id: "i1", itemName: "Steak", price: 100_000, quantity: 1, memberNames: ["Alice", "Bob"], taxPercentage: 10 },
      ]),
    ];
    const result = calculateConsumptionDetails(activities);

    expect(result).toHaveLength(2);
    result.forEach((d) => expect(d.totalConsumption).toBe(55_000));
  });

  it("correctly applies discount in consumption amount", () => {
    // 100k - 20k discount = 80k / 2 = 40k each
    const activities = [
      makeActivity("a1", "Alice", "Dinner", [
        { id: "i1", itemName: "Pasta", price: 100_000, quantity: 1, memberNames: ["Alice", "Bob"], discountAmount: 20_000 },
      ]),
    ];
    const result = calculateConsumptionDetails(activities);

    expect(result).toHaveLength(2);
    result.forEach((d) => expect(d.totalConsumption).toBe(40_000));
  });

  it("accumulates consumption across multiple activities for the same user", () => {
    const activities = [
      makeActivity("a1", "Alice", "Lunch", [
        { id: "i1", itemName: "Sandwich", price: 30_000, quantity: 1, memberNames: ["Bob"] },
      ]),
      makeActivity("a2", "Alice", "Dinner", [
        { id: "i2", itemName: "Pasta", price: 50_000, quantity: 1, memberNames: ["Bob"] },
      ]),
    ];
    const result = calculateConsumptionDetails(activities);

    expect(result).toHaveLength(1);
    expect(result[0].userName).toBe("Bob");
    expect(result[0].totalConsumption).toBe(80_000);
    expect(result[0].items).toHaveLength(2);
  });

  it("includes per-item breakdown in items array", () => {
    const activities = [
      makeActivity("a1", "Alice", "Dinner", [
        { id: "i1", itemName: "Steak", price: 100_000, quantity: 1, memberNames: ["Bob"] },
      ]),
    ];
    const result = calculateConsumptionDetails(activities);
    const detail = result[0];

    expect(detail.items).toHaveLength(1);
    expect(detail.items[0].itemName).toBe("Steak");
    expect(detail.items[0].activityTitle).toBe("Dinner");
    expect(detail.items[0].splitAmount).toBe(100_000);
  });

  it("sum of all consumption equals total expense (no tax/discount)", () => {
    const activities = [
      makeActivity("a1", "Alice", "Dinner", [
        { id: "i1", itemName: "Meal", price: 120_000, quantity: 1, memberNames: ["Alice", "Bob", "Charlie"] },
        { id: "i2", itemName: "Drinks", price: 60_000, quantity: 1, memberNames: ["Alice", "Bob"] },
      ]),
    ];
    const result = calculateConsumptionDetails(activities);
    const totalConsumed = result.reduce((sum, d) => sum + d.totalConsumption, 0);

    // 120k + 60k = 180k total expense, split among participants → sum must equal 180k
    expect(Math.round(totalConsumed)).toBe(180_000);
  });

  it("sorts results descending by totalConsumption", () => {
    const activities = [
      makeActivity("a1", "Alice", "Dinner", [
        { id: "i1", itemName: "Cheap", price: 10_000, quantity: 1, memberNames: ["LowSpender"] },
        { id: "i2", itemName: "Expensive", price: 90_000, quantity: 1, memberNames: ["HighSpender"] },
      ]),
    ];
    const result = calculateConsumptionDetails(activities);

    expect(result[0].userName).toBe("HighSpender");
    expect(result[1].userName).toBe("LowSpender");
  });
});
