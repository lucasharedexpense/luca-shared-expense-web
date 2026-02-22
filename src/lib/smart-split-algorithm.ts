/**
 * Smart Split Bill Algorithm
 *
 * Graph-optimized debt settlement that minimizes the total number of
 * transactions between users.  Three sequential optimization passes:
 *
 *   1. Bilateral Simplification  – net out mutual debts
 *   2. Cycle Elimination (DFS)   – remove closed debt loops
 *   3. Transitive Triangle ("Titip Duit") – re-route middleman debts
 *
 * Also exports a Consumption Details calculator that totals how much
 * each person consumed, regardless of who paid.
 */

// ─── Shared precision constant ──────────────────────────────────────────────────

/** Amounts below this threshold are treated as zero (avoids floating-point dust). */
const EPSILON = 0.01;

// ─── Interfaces ─────────────────────────────────────────────────────────────────

export interface FirestoreItem {
  id: string;
  itemName: string;
  price: number;
  quantity: number;
  taxPercentage?: number;
  discountAmount?: number;
  memberNames: string[];
}

export interface FirestoreActivity {
  id: string;
  payerName: string;
  title: string;
  items: FirestoreItem[];
}

export interface SettlementTransaction {
  id: string;
  fromName: string;
  toName: string;
  amount: number;
}

export interface ConsumptionDetail {
  userName: string;
  totalConsumption: number;
  items: {
    itemName: string;
    activityTitle: string;
    price: number;
    quantity: number;
    splitAmount: number;
  }[];
}

export interface SettlementResult {
  settlements: SettlementTransaction[];
  consumptionDetails: ConsumptionDetail[];
}

// ─── Debt-Graph type alias ──────────────────────────────────────────────────────

/** Adjacency map:  graph.get(from)!.get(to) = amount the `from` owes `to`. */
type DebtGraph = Map<string, Map<string, number>>;

// ─── Item cost calculation (per the user-spec formula) ──────────────────────────

/**
 * Calculate the cost share each member bears for a single item.
 *
 * Formula (applied in order):
 *   1. itemTotal      = price × quantity
 *   2. afterTax       = itemTotal × (1 + taxPercentage / 100)
 *   3. afterDiscount  = max(0, afterTax − discountAmount)
 *   4. amountPerPerson = afterDiscount / memberNames.length
 */
function calculateItemAmountPerPerson(item: FirestoreItem): number {
  if (item.memberNames.length === 0) return 0;

  const itemTotal = item.price * item.quantity;
  const afterTax = itemTotal * (1 + (item.taxPercentage ?? 0) / 100);
  const afterDiscount = Math.max(0, afterTax - (item.discountAmount ?? 0));

  return afterDiscount / item.memberNames.length;
}

// ─── 0. Build initial debt graph ────────────────────────────────────────────────

function buildDebtGraph(activities: FirestoreActivity[]): DebtGraph {
  const graph: DebtGraph = new Map();

  const addEdge = (from: string, to: string, amount: number): void => {
    if (from === to || amount <= 0) return; // self-debt is ignored
    if (!graph.has(from)) graph.set(from, new Map());
    const edges = graph.get(from)!;
    edges.set(to, (edges.get(to) ?? 0) + amount);
  };

  for (const activity of activities) {
    for (const item of activity.items) {
      const perPerson = calculateItemAmountPerPerson(item);
      if (perPerson <= 0) continue;

      for (const member of item.memberNames) {
        // Each consumer owes the payer their share
        addEdge(member, activity.payerName, perPerson);
      }
    }
  }

  return graph;
}

// ─── 1. Bilateral Simplification ────────────────────────────────────────────────

/**
 * For every pair (A, B) where both A→B and B→A exist,
 * replace them with a single net edge in the direction of the larger debt.
 */
function bilateralSimplify(graph: DebtGraph): DebtGraph {
  const simplified: DebtGraph = new Map();
  const processed = new Set<string>();

  for (const [from, edges] of graph) {
    for (const [to, amount] of edges) {
      const pairKey = from < to ? `${from}|${to}` : `${to}|${from}`;
      if (processed.has(pairKey)) continue;
      processed.add(pairKey);

      const reverseAmount = graph.get(to)?.get(from) ?? 0;
      const net = amount - reverseAmount;

      if (Math.abs(net) > EPSILON) {
        const actualFrom = net > 0 ? from : to;
        const actualTo = net > 0 ? to : from;
        if (!simplified.has(actualFrom)) simplified.set(actualFrom, new Map());
        simplified.get(actualFrom)!.set(actualTo, Math.abs(net));
      }
    }
  }

  return simplified;
}

// ─── 2. Cycle Elimination (DFS) ─────────────────────────────────────────────────

/**
 * Standard DFS with backtracking.
 * Returns the first cycle found as an ordered array of node names, or null.
 */
function findCycleDFS(graph: DebtGraph): string[] | null {
  const allNodes = new Set<string>();
  for (const [from, edges] of graph) {
    allNodes.add(from);
    for (const to of edges.keys()) allNodes.add(to);
  }

  for (const start of allNodes) {
    const inStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): string[] | null => {
      if (inStack.has(node)) {
        // Extract the cycle portion from the path
        const idx = path.indexOf(node);
        return idx !== -1 ? path.slice(idx) : null;
      }

      inStack.add(node);
      path.push(node);

      const edges = graph.get(node);
      if (edges) {
        for (const [next, weight] of edges) {
          if (weight > EPSILON) {
            const cycle = dfs(next);
            if (cycle) return cycle;
          }
        }
      }

      path.pop();
      inStack.delete(node);
      return null;
    };

    const cycle = dfs(start);
    if (cycle && cycle.length >= 2) return cycle;
  }

  return null;
}

/**
 * Repeatedly find a cycle, subtract the minimum edge weight along it,
 * and remove zeroed edges.  Terminates when no cycles remain.
 */
function eliminateCycles(graph: DebtGraph): DebtGraph {
  // Deep-clone
  const result: DebtGraph = new Map();
  for (const [from, edges] of graph) {
    result.set(from, new Map(edges));
  }

  while (true) {
    const cycle = findCycleDFS(result);
    if (!cycle) break;

    // Find minimum edge weight in cycle
    let minWeight = Infinity;
    for (let i = 0; i < cycle.length; i++) {
      const from = cycle[i];
      const to = cycle[(i + 1) % cycle.length];
      minWeight = Math.min(minWeight, result.get(from)?.get(to) ?? 0);
    }

    if (minWeight <= EPSILON) break; // safety guard

    // Subtract minWeight from every edge in the cycle
    for (let i = 0; i < cycle.length; i++) {
      const from = cycle[i];
      const to = cycle[(i + 1) % cycle.length];
      const updated = (result.get(from)?.get(to) ?? 0) - minWeight;

      if (updated <= EPSILON) {
        result.get(from)?.delete(to);
        if (result.get(from)?.size === 0) result.delete(from);
      } else {
        result.get(from)!.set(to, updated);
      }
    }
  }

  return result;
}

// ─── 3. Transitive Triangle Optimization ("Titip Duit") ─────────────────────────

/**
 * If A→B, B→C, **and** A→C all exist, re-route through B:
 *   reroute = min(A→B, B→C)
 *   A→B  −= reroute
 *   B→C  −= reroute
 *   A→C  += reroute
 *
 * This eliminates the middleman (B) for that portion of the debt,
 * reducing the total number of transactions.
 *
 * The process repeats until no more triangles can be optimized.
 */
function transitiveTriangleOptimize(graph: DebtGraph): DebtGraph {
  // Deep-clone
  const result: DebtGraph = new Map();
  for (const [from, edges] of graph) {
    result.set(from, new Map(edges));
  }

  let changed = true;
  while (changed) {
    changed = false;

    for (const [a, aEdges] of result) {
      for (const [b, abAmount] of aEdges) {
        if (abAmount <= EPSILON) continue;

        const bEdges = result.get(b);
        if (!bEdges) continue;

        for (const [c, bcAmount] of bEdges) {
          if (bcAmount <= EPSILON || c === a) continue;

          // Require that A already owes C (triangle condition)
          const acAmount = aEdges.get(c) ?? 0;
          if (acAmount <= EPSILON) continue;

          // Found triangle A→B, B→C, A→C — reroute
          const reroute = Math.min(abAmount, bcAmount);

          // A→B
          const newAB = abAmount - reroute;
          if (newAB <= EPSILON) {
            aEdges.delete(b);
          } else {
            aEdges.set(b, newAB);
          }

          // B→C
          const newBC = bcAmount - reroute;
          if (newBC <= EPSILON) {
            bEdges.delete(c);
            if (bEdges.size === 0) result.delete(b);
          } else {
            bEdges.set(c, newBC);
          }

          // A→C
          aEdges.set(c, acAmount + reroute);

          changed = true;
          break; // restart iteration after mutation
        }
        if (changed) break;
      }
      if (changed) break;
    }
  }

  // Prune empty entries
  for (const [from, edges] of result) {
    if (edges.size === 0) result.delete(from);
  }

  return result;
}

// ─── Public API: Smart Split Bill ───────────────────────────────────────────────

/**
 * Runs the full 3-step graph optimization on a list of activities and
 * returns the minimized set of settlement transactions.
 */
export function smartSplitBill(
  activities: FirestoreActivity[],
): SettlementTransaction[] {
  // Build raw debt graph
  let graph = buildDebtGraph(activities);

  // Step 1 — cancel mutual debts
  graph = bilateralSimplify(graph);

  // Step 2 — eliminate closed cycles
  graph = eliminateCycles(graph);

  // Step 3 — consolidate via triangles
  graph = transitiveTriangleOptimize(graph);

  // Flatten graph into settlement list
  const settlements: SettlementTransaction[] = [];
  let idx = 0;

  for (const [from, edges] of graph) {
    for (const [to, amount] of edges) {
      if (amount > EPSILON) {
        settlements.push({
          id: `settle_${idx++}`,
          fromName: from,
          toName: to,
          amount: Math.round(amount * 100) / 100,
        });
      }
    }
  }

  // Sort: largest debt first for readability
  settlements.sort((a, b) => b.amount - a.amount);

  return settlements;
}

// ─── Public API: Consumption Details ────────────────────────────────────────────

/**
 * Calculates how much each person consumed in total across all activities,
 * regardless of who paid.  Returns a per-user breakdown with item-level detail.
 */
export function calculateConsumptionDetails(
  activities: FirestoreActivity[],
): ConsumptionDetail[] {
  const detailsMap: Record<string, ConsumptionDetail> = {};

  for (const activity of activities) {
    for (const item of activity.items) {
      if (item.memberNames.length === 0) continue;

      const perPerson = calculateItemAmountPerPerson(item);

      for (const member of item.memberNames) {
        if (!detailsMap[member]) {
          detailsMap[member] = {
            userName: member,
            totalConsumption: 0,
            items: [],
          };
        }

        detailsMap[member].totalConsumption += perPerson;
        detailsMap[member].items.push({
          itemName: item.itemName,
          activityTitle: activity.title,
          price: item.price,
          quantity: item.quantity,
          splitAmount: Math.round(perPerson * 100) / 100,
        });
      }
    }
  }

  // Round totals and sort descending
  const results = Object.values(detailsMap);
  for (const d of results) {
    d.totalConsumption = Math.round(d.totalConsumption * 100) / 100;
  }

  return results.sort((a, b) => b.totalConsumption - a.totalConsumption);
}
