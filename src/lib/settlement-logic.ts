// src/lib/settlement-logic.ts

export interface Settlement {
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

// ─── Input shape interfaces ────────────────────────────────────────────────────

interface SummaryItem {
    itemName: string;
    price: number;
    quantity: number;
    discountAmount?: number;
    taxPercentage?: number;
    memberNames: string[];
}

interface SummaryActivity {
    title: string;
    payerName: string;
    items: SummaryItem[];
}

/** Participants may arrive as plain strings or objects with a name property */
type EventParticipant = string | { name: string };

interface SummaryEvent {
    participants: EventParticipant[];
    activities: SummaryActivity[];
}

// ─── Output shape interface ────────────────────────────────────────────────────

interface Balance {
    name: string;
    amount: number;
}

export interface SummaryResult {
    totalExpense: number;
    settlements: Settlement[];
    consumptionDetails: ConsumptionDetail[];
    balances: Balance[];
}

// ─── Main function ─────────────────────────────────────────────────────────────

export const calculateSummary = (event: SummaryEvent): SummaryResult => {
    const consumptionMap: Record<string, number> = {};
    const paidMap: Record<string, number> = {};
    const detailsMap: Record<string, ConsumptionDetail> = {};

    // 1. Init Data Peserta
    event.participants.forEach((p: EventParticipant) => {
        // Handle participant object vs string
        const name = typeof p === 'string' ? p : p.name;
        consumptionMap[name] = 0;
        paidMap[name] = 0;
        detailsMap[name] = { userName: name, totalConsumption: 0, items: [] };
    });

    let totalExpense = 0;

    // 2. Loop Activity & Items
    event.activities.forEach((activity: SummaryActivity) => {
        let activityTotal = 0;

        activity.items.forEach((item: SummaryItem) => {
            // Kalkulasi Harga Item + Tax - Discount
            const itemPriceTotal = item.price * item.quantity;
            const discount = item.discountAmount ?? 0;
            const tax = itemPriceTotal * ((item.taxPercentage ?? 0) / 100);
            const finalItemTotal = itemPriceTotal - discount + tax;

            activityTotal += finalItemTotal;

            // Split Logic
            const splitCount = item.memberNames.length;
            if (splitCount > 0) {
                const splitAmount = finalItemTotal / splitCount;
                
                item.memberNames.forEach((memberName: string) => {
                    if (consumptionMap[memberName] !== undefined) {
                        consumptionMap[memberName] += splitAmount;
                        
                        // Detail Consumption
                        detailsMap[memberName].items.push({
                            itemName: item.itemName,
                            activityTitle: activity.title,
                            price: item.price,
                            quantity: 1, 
                            splitAmount: splitAmount
                        });
                        detailsMap[memberName].totalConsumption += splitAmount;
                    }
                });
            }
        });

        // Catat Payer
        const payerName = activity.payerName;
        if (paidMap[payerName] !== undefined) {
            paidMap[payerName] += activityTotal;
        }
        totalExpense += activityTotal;
    });

    // 3. Hitung Balance (Paid - Consumed)
    const balances: Balance[] = [];
    Object.keys(consumptionMap).forEach(name => {
        const balance = (paidMap[name] ?? 0) - (consumptionMap[name] ?? 0);
        balances.push({ name, amount: balance });
    });

    // 4. Generate Settlements (Greedy Algo)
    const settlements: Settlement[] = [];
    const debtors = balances.filter(b => b.amount < -1).sort((a, b) => a.amount - b.amount);
    const creditors = balances.filter(b => b.amount > 1).sort((a, b) => b.amount - a.amount);

    let i = 0; 
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        const amount = Math.min(Math.abs(debtor.amount), creditor.amount);

        settlements.push({
            id: `settle_${i}_${j}`,
            fromName: debtor.name,
            toName: creditor.name,
            amount: amount
        });

        debtor.amount += amount;
        creditor.amount -= amount;

        if (Math.abs(debtor.amount) < 1) i++;
        if (creditor.amount < 1) j++;
    }

    return {
        totalExpense,
        settlements,
        consumptionDetails: Object.values(detailsMap).filter(d => d.totalConsumption > 0),
        balances // Return balance juga buat info debug/display
    };
};