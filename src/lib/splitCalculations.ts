/**
 * Split Bill Calculations - Safe Split Logic
 * Menangani pembagian equal dengan rounding protection
 */

export interface Participant {
  id: string;
  name: string;
  isSelected: boolean; // Only split among selected users
  amountOwed: number; // Amount that this participant owes
}

/**
 * Split equal dengan proteksi terhadap decimal rounding issue
 * 
 * Problem yang diselesaikan:
 * Rp 100.000 / 3 = 33.333,333...
 * Jika dibulatkan semua ke 33.333,33 → total = 99.999,99 (kurang Rp 0,01)
 * 
 * Solusi:
 * - Hitung baseSplit yang di-floor ke 2 desimal
 * - Hitung remainder (sisa receh dari pembulatan)
 * - Distribute baseSplit ke semua participant
 * - Add remainder ke participant pertama yang selected
 * 
 * Hasil:
 * Participant 1: 33.333,34 (dapat +0,01 remainder)
 * Participant 2: 33.333,33
 * Participant 3: 33.333,33
 * Total: 100.000,00 ✅ (pas tanpa kehilangan/kelebihan)
 * 
 * @param totalAmount - Total expense yang akan di-split
 * @param participants - Array of participants dengan status isSelected
 * @returns New array of participants dengan amountOwed yang sudah diupdate
 */
export function handleSplitEqual(
  totalAmount: number,
  participants: Participant[]
): Participant[] {
  // Step 1: Filter hanya participant yang isSelected = true
  const selectedParticipants = participants.filter((p) => p.isSelected);
  const selectedCount = selectedParticipants.length;

  // Edge case: Tidak ada yang selected atau total amount = 0
  if (selectedCount === 0 || totalAmount === 0) {
    return participants.map((p) => ({
      ...p,
      amountOwed: 0,
    }));
  }

  // Step 2: Hitung baseSplit (pembulatan ke bawah dengan 2 desimal)
  // Contoh: 100000 / 3 = 33333.333... → floor ke 33333.33
  const rawSplit = totalAmount / selectedCount;
  const baseSplit = Math.floor(rawSplit * 100) / 100;

  // Step 3: Hitung remainder (sisa receh yang hilang karena floor)
  // Contoh: 100000 - (33333.33 * 3) = 100000 - 99999.99 = 0.01
  const totalAfterBaseSplit = baseSplit * selectedCount;
  const remainder = Math.round((totalAmount - totalAfterBaseSplit) * 100) / 100;

  // Step 4: Distribute amounts
  let isFirstSelected = true;

  return participants.map((participant) => {
    // Participant yang tidak selected → amountOwed = 0
    if (!participant.isSelected) {
      return {
        ...participant,
        amountOwed: 0,
      };
    }

    // Participant pertama yang selected → dapat baseSplit + remainder
    if (isFirstSelected) {
      isFirstSelected = false;
      const amountWithRemainder = baseSplit + remainder;
      return {
        ...participant,
        amountOwed: Math.round(amountWithRemainder * 100) / 100,
      };
    }

    // Participant sisanya → dapat baseSplit saja
    return {
      ...participant,
      amountOwed: baseSplit,
    };
  });
}

/**
 * Utility function untuk validasi apakah total split sudah benar
 * Berguna untuk testing dan debugging
 * 
 * @param participants - Array participants dengan amountOwed
 * @param expectedTotal - Total amount yang seharusnya
 * @returns Object dengan status validasi dan detail perhitungan
 */
export function validateSplitTotal(
  participants: Participant[],
  expectedTotal: number
): {
  isValid: boolean;
  actualTotal: number;
  difference: number;
  message: string;
} {
  const actualTotal = participants.reduce((sum, p) => sum + p.amountOwed, 0);
  const roundedActualTotal = Math.round(actualTotal * 100) / 100;
  const difference = Math.round((expectedTotal - roundedActualTotal) * 100) / 100;

  return {
    isValid: difference === 0,
    actualTotal: roundedActualTotal,
    difference,
    message:
      difference === 0
        ? "✅ Split calculation is accurate"
        : `❌ Split has ${difference > 0 ? "missing" : "extra"} Rp ${Math.abs(difference)}`,
  };
}

/**
 * Format currency untuk display (Rupiah format)
 * 
 * @param amount - Amount dalam number
 * @returns Formatted string (contoh: "Rp 33.333,33")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
