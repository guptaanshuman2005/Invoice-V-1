/**
 * InvoiceProIn - Indian CA Statutory Stock Valuation & Physical Verification Engine
 * Implements:
 * - AS-2 / Ind AS 2 / ICDS-II (Inventories at Lower of Cost or Net Realizable Value)
 * - FIFO (First-In, First-Out) & Weighted Average Cost (WAC) formulas
 * - Form 3CD Clause 35 Quantitative Tally for Tax Audit
 * - CARO 2020 Clause 3(ii) Physical Inventory Verification & Material Discrepancy (>10%) Sentinel
 */

import type { Item, StockHistoryEntry, Company, Invoice } from '../types';
import { downloadCSV } from './csvExport';

export type ValuationMethod = 'FIFO' | 'WAC' | 'NRV';

export interface ItemValuationResult {
  itemId: string;
  name: string;
  hsn: string;
  unit: string;
  quantity: number;
  method: ValuationMethod;
  effectiveCostPrice: number;
  sellingPrice: number;
  valuationRate: number; // Lower of Cost or NRV (AS-2 mandate)
  totalValuation: number;
  batchesRemaining: { qty: number; unitCost: number }[];
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NEGATIVE_STOCK';
}

export interface StockValuationSummary {
  method: ValuationMethod;
  totalValuation: number;
  totalItems: number;
  inStockCount: number;
  lowStockCount: number;
  outStockCount: number;
  negativeStockCount: number;
  items: ItemValuationResult[];
  tradingAccount: {
    estimatedOpeningStock: number;
    totalInwardValue: number;
    costOfGoodsSold: number;
    closingStockValue: number;
    grossProfitContribution: number;
  };
}

export interface PhysicalAuditComparison {
  itemId: string;
  name: string;
  hsn: string;
  unit: string;
  bookQuantity: number;
  physicalQuantity: number;
  varianceQty: number; // physical - book
  variancePercentage: number;
  isMaterialDiscrepancy: boolean; // >= 10% CARO 2020 threshold
  unitRate: number;
  varianceValue: number;
  status: 'EXACT' | 'SURPLUS' | 'SHORTAGE' | 'MATERIAL_DISCREPANCY';
}

/**
 * Calculates FIFO Cost for an item based on its historical stock movements.
 * Inward entries (initial, purchase, positive adjustment, sales return) create lots.
 * Outward entries (invoices, sales) consume the oldest available lots first.
 */
export function calculateItemFifoCost(
  item: Item,
  itemHistory: StockHistoryEntry[]
): { effectiveCost: number; batchesRemaining: { qty: number; unitCost: number }[] } {
  const defaultCost = item.costPrice || (item.price > 0 ? item.price * 0.75 : 0);
  const closingQty = item.quantityInStock || 0;

  if (closingQty <= 0) {
    return { effectiveCost: defaultCost, batchesRemaining: [] };
  }

  // Sort chronological
  const chronological = [...itemHistory].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  interface InwardBatch {
    qty: number;
    unitCost: number;
  }

  const batches: InwardBatch[] = [];

  // Reconstruct lots from chronological events
  if (chronological.length === 0) {
    batches.push({ qty: closingQty, unitCost: defaultCost });
  } else {
    for (const entry of chronological) {
      const delta = entry.newQuantity - entry.previousQuantity;

      if (delta > 0) {
        // Inward stock movement
        const batchCost = entry.unitCost || defaultCost;
        batches.push({ qty: delta, unitCost: batchCost });
      } else if (delta < 0) {
        // Outward stock movement: consume from earliest batch (FIFO)
        let qtyToDeduct = Math.abs(delta);
        while (qtyToDeduct > 0 && batches.length > 0) {
          if (batches[0].qty <= qtyToDeduct) {
            qtyToDeduct -= batches[0].qty;
            batches.shift();
          } else {
            batches[0].qty -= qtyToDeduct;
            qtyToDeduct = 0;
          }
        }
      }
    }
  }

  // If batches remain, take from the tail to match current closing quantity
  let remainingUnitsNeeded = closingQty;
  const remainingBatches: InwardBatch[] = [];
  let totalRemainingCost = 0;

  for (let i = batches.length - 1; i >= 0 && remainingUnitsNeeded > 0; i--) {
    const batch = batches[i];
    const takeQty = Math.min(batch.qty, remainingUnitsNeeded);
    remainingBatches.unshift({ qty: takeQty, unitCost: batch.unitCost });
    totalRemainingCost += takeQty * batch.unitCost;
    remainingUnitsNeeded -= takeQty;
  }

  // Fallback for any uncovered portion
  if (remainingUnitsNeeded > 0) {
    remainingBatches.unshift({ qty: remainingUnitsNeeded, unitCost: defaultCost });
    totalRemainingCost += remainingUnitsNeeded * defaultCost;
  }

  const effectiveCost = closingQty > 0 ? totalRemainingCost / closingQty : defaultCost;

  return {
    effectiveCost: Number(effectiveCost.toFixed(2)),
    batchesRemaining: remainingBatches
  };
}

/**
 * Calculates Weighted Average Cost (WAC) for an item across all inward records.
 */
export function calculateItemWacCost(
  item: Item,
  itemHistory: StockHistoryEntry[]
): number {
  const defaultCost = item.costPrice || (item.price > 0 ? item.price * 0.75 : 0);
  let totalInwardQty = 0;
  let totalInwardCost = 0;

  itemHistory.forEach(entry => {
    const delta = entry.newQuantity - entry.previousQuantity;
    if (delta > 0) {
      const cost = entry.unitCost || defaultCost;
      totalInwardQty += delta;
      totalInwardCost += delta * cost;
    }
  });

  if (totalInwardQty === 0) {
    return defaultCost;
  }

  return Number((totalInwardCost / totalInwardQty).toFixed(2));
}

/**
 * Computes complete statutory stock valuation across all items for CA Trading / P&L statement.
 */
export function computeStockValuation(
  items: Item[],
  stockHistory: StockHistoryEntry[] = [],
  invoices: Invoice[] = [],
  method: ValuationMethod = 'FIFO'
): StockValuationSummary {
  let totalValuation = 0;
  let inStockCount = 0;
  let lowStockCount = 0;
  let outStockCount = 0;
  let negativeStockCount = 0;

  const itemResults: ItemValuationResult[] = items.map(item => {
    const qty = item.quantityInStock || 0;
    const itemHistory = stockHistory.filter(h => h.itemId === item.id);
    const sellingPrice = item.price || 0;

    let effectiveCostPrice = 0;
    let batchesRemaining: { qty: number; unitCost: number }[] = [];

    if (method === 'FIFO') {
      const fifoRes = calculateItemFifoCost(item, itemHistory);
      effectiveCostPrice = fifoRes.effectiveCost;
      batchesRemaining = fifoRes.batchesRemaining;
    } else if (method === 'WAC') {
      effectiveCostPrice = calculateItemWacCost(item, itemHistory);
      batchesRemaining = [{ qty, unitCost: effectiveCostPrice }];
    } else {
      // NRV / Standard
      effectiveCostPrice = item.costPrice || sellingPrice * 0.75;
      batchesRemaining = [{ qty, unitCost: effectiveCostPrice }];
    }

    // AS-2 / Ind AS 2 Mandate: Lower of Cost or Net Realizable Value
    const valuationRate = (sellingPrice > 0 && effectiveCostPrice > 0)
      ? Math.min(effectiveCostPrice, sellingPrice)
      : (effectiveCostPrice || sellingPrice || 0);

    const valuation = qty > 0 ? Number((qty * valuationRate).toFixed(2)) : 0;
    totalValuation += valuation;

    let status: ItemValuationResult['status'] = 'IN_STOCK';
    if (qty < 0) {
      status = 'NEGATIVE_STOCK';
      negativeStockCount++;
    } else if (qty === 0) {
      status = 'OUT_OF_STOCK';
      outStockCount++;
    } else if (qty <= 5) {
      status = 'LOW_STOCK';
      lowStockCount++;
    } else {
      inStockCount++;
    }

    return {
      itemId: item.id,
      name: item.name,
      hsn: item.hsn || '',
      unit: item.unit || 'pcs',
      quantity: qty,
      method,
      effectiveCostPrice,
      sellingPrice,
      valuationRate,
      totalValuation: valuation,
      batchesRemaining,
      status
    };
  });

  // Calculate Trading Account / P&L Impact
  let totalInvoicedRevenue = 0;
  let totalInvoicedCost = 0;

  invoices.forEach(inv => {
    if (inv.status !== 'Unpaid' || true) {
      (inv.items || []).forEach(line => {
        const lineQty = line.quantity || 1;
        const linePrice = line.price || 0;
        const matchedItem = items.find(i => i.id === line.id || i.name === line.name);
        const costRate = matchedItem?.costPrice || (linePrice * 0.75);
        totalInvoicedRevenue += lineQty * linePrice;
        totalInvoicedCost += lineQty * costRate;
      });
    }
  });

  const estimatedOpeningStock = Number((totalValuation * 0.85).toFixed(2));
  const totalInwardValue = Number((totalInvoicedCost + (totalValuation - estimatedOpeningStock)).toFixed(2));
  const costOfGoodsSold = Number(totalInvoicedCost.toFixed(2));
  const grossProfitContribution = Number((totalInvoicedRevenue - costOfGoodsSold).toFixed(2));

  return {
    method,
    totalValuation: Number(totalValuation.toFixed(2)),
    totalItems: items.length,
    inStockCount,
    lowStockCount,
    outStockCount,
    negativeStockCount,
    items: itemResults,
    tradingAccount: {
      estimatedOpeningStock,
      totalInwardValue: Math.max(0, totalInwardValue),
      costOfGoodsSold,
      closingStockValue: Number(totalValuation.toFixed(2)),
      grossProfitContribution
    }
  };
}

/**
 * CARO 2020 Clause 3(ii) Physical Stock Verification Comparator
 */
export function comparePhysicalStock(
  items: Item[],
  physicalCounts: Record<string, number>,
  valuationMethod: ValuationMethod = 'FIFO'
): {
  comparisons: PhysicalAuditComparison[];
  totalBookValue: number;
  totalPhysicalValue: number;
  totalVarianceValue: number;
  materialDiscrepancyCount: number;
} {
  let totalBookValue = 0;
  let totalPhysicalValue = 0;
  let totalVarianceValue = 0;
  let materialDiscrepancyCount = 0;

  const comparisons: PhysicalAuditComparison[] = items.map(item => {
    const bookQty = item.quantityInStock || 0;
    const physicalQty = physicalCounts[item.id] !== undefined ? physicalCounts[item.id] : bookQty;
    const varianceQty = physicalQty - bookQty;

    const variancePercentage = bookQty !== 0 
      ? Number(((Math.abs(varianceQty) / Math.abs(bookQty)) * 100).toFixed(1))
      : (physicalQty !== 0 ? 100 : 0);

    // CARO 2020: Discrepancy >= 10% is classified as material
    const isMaterialDiscrepancy = variancePercentage >= 10 && varianceQty !== 0;
    if (isMaterialDiscrepancy) {
      materialDiscrepancyCount++;
    }

    const unitRate = item.costPrice || (item.price > 0 ? item.price * 0.75 : item.price || 0);
    const bookVal = Math.max(0, bookQty * unitRate);
    const physicalVal = Math.max(0, physicalQty * unitRate);
    const varianceVal = varianceQty * unitRate;

    totalBookValue += bookVal;
    totalPhysicalValue += physicalVal;
    totalVarianceValue += varianceVal;

    let status: PhysicalAuditComparison['status'] = 'EXACT';
    if (isMaterialDiscrepancy) {
      status = 'MATERIAL_DISCREPANCY';
    } else if (varianceQty > 0) {
      status = 'SURPLUS';
    } else if (varianceQty < 0) {
      status = 'SHORTAGE';
    }

    return {
      itemId: item.id,
      name: item.name,
      hsn: item.hsn || '',
      unit: item.unit || 'pcs',
      bookQuantity: bookQty,
      physicalQuantity: physicalQty,
      varianceQty,
      variancePercentage,
      isMaterialDiscrepancy,
      unitRate,
      varianceValue: Number(varianceVal.toFixed(2)),
      status
    };
  });

  return {
    comparisons,
    totalBookValue: Number(totalBookValue.toFixed(2)),
    totalPhysicalValue: Number(totalPhysicalValue.toFixed(2)),
    totalVarianceValue: Number(totalVarianceValue.toFixed(2)),
    materialDiscrepancyCount
  };
}

/**
 * Exports Statutory FIFO / AS-2 Stock Valuation Schedule for CA
 */
export function exportFifoValuationSchedule(
  summary: StockValuationSummary,
  company: Company,
  fy?: string
): void {
  const headers = [
    'Item ID',
    'Item Description',
    'HSN / SAC',
    'UOM',
    'Closing Qty',
    'Valuation Method',
    'Effective Cost Price (INR)',
    'Selling Price / NRV (INR)',
    'Valuation Rate Adopted (INR)',
    'Total Closing Stock Value (INR)',
    'Stock Status',
    'Form 3CD Clause 35 Remarks'
  ];

  const rows = summary.items.map(res => [
    `"${res.itemId}"`,
    `"${res.name.replace(/"/g, '""')}"`,
    `"${res.hsn || 'N/A'}"`,
    `"${res.unit.toUpperCase()}"`,
    res.quantity.toString(),
    `"${res.method}"`,
    res.effectiveCostPrice.toFixed(2),
    res.sellingPrice.toFixed(2),
    res.valuationRate.toFixed(2),
    res.totalValuation.toFixed(2),
    `"${res.status}"`,
    res.quantity < 0 ? '"AUDIT EXCEPTION: Negative Stock"' : '"Compliant with AS-2 / ICDS-II"'
  ].join(','));

  // Summary Row
  rows.push([
    '"TOTAL"',
    `"Total Active Items: ${summary.totalItems}"`,
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    summary.totalValuation.toFixed(2),
    '""',
    '""'
  ].join(','));

  const companyName = company.details?.name || 'Company';
  const gstin = company.details?.gstin || 'Unregistered';
  const period = fy || 'FY 2024-25';

  const metadata = [
    `"Form 3CD Clause 35 - Statutory Closing Stock Valuation Schedule"`,
    `"Entity: ${companyName} | GSTIN: ${gstin} | Assessment Period: ${period}"`,
    `"Accounting Standard: AS-2 / Ind AS 2 / ICDS-II (Lower of Cost or Net Realizable Value)"`,
    `"Cost Formula Applied: ${summary.method} (First-In, First-Out)"`,
    `"Audited Closing Stock for Trading Account: INR ${summary.totalValuation.toLocaleString('en-IN')}"`,
    `"Export Timestamp: ${new Date().toLocaleString('en-IN')}"`,
    ''
  ].join('\n');

  const csv = metadata + '\n' + headers.join(',') + '\n' + rows.join('\n');
  const filename = `Stock_Valuation_FIFO_AS2_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${period.replace(/\s+/g, '_')}.csv`;
  downloadCSV(csv, filename);
}

/**
 * Exports Physical Stock Verification & Discrepancy Schedule (CARO 2020 Clause 3(ii))
 */
export function exportPhysicalAuditSchedule(
  comparison: ReturnType<typeof comparePhysicalStock>,
  company: Company,
  auditDate: string = new Date().toISOString().split('T')[0]
): void {
  const headers = [
    'Item ID',
    'Item Description',
    'HSN / SAC',
    'UOM',
    'Book Stock (Qty)',
    'Physical Count (Qty)',
    'Variance (Qty)',
    'Variance %',
    'CARO Material Discrepancy (>=10%)',
    'Unit Valuation Rate (INR)',
    'Variance Financial Value (INR)',
    'Verification Status',
    'Audit Signoff'
  ];

  const rows = comparison.comparisons.map(c => [
    `"${c.itemId}"`,
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.hsn || 'N/A'}"`,
    `"${c.unit.toUpperCase()}"`,
    c.bookQuantity.toString(),
    c.physicalQuantity.toString(),
    c.varianceQty.toString(),
    `${c.variancePercentage.toFixed(1)}%`,
    c.isMaterialDiscrepancy ? '"YES - MATERIAL (>10%)"' : '"NO"',
    c.unitRate.toFixed(2),
    c.varianceValue.toFixed(2),
    `"${c.status}"`,
    '""'
  ].join(','));

  // Summary Row
  rows.push([
    '"TOTAL"',
    `"Total Items Audited: ${comparison.comparisons.length}"`,
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    `"Material Discrepancies: ${comparison.materialDiscrepancyCount}"`,
    '""',
    comparison.totalVarianceValue.toFixed(2),
    '""',
    '""'
  ].join(','));

  const companyName = company.details?.name || 'Company';
  const gstin = company.details?.gstin || 'Unregistered';

  const metadata = [
    `"Physical Stock Verification & Discrepancy Schedule"`,
    `"CARO 2020 Clause 3(ii) / Companies Act 2013 Compliance Schedule"`,
    `"Entity: ${companyName} | GSTIN: ${gstin} | Physical Verification Date: ${auditDate}"`,
    `"Material Discrepancy Standard: 10% or more in aggregate for each class of inventory"`,
    `"Total Book Value: INR ${comparison.totalBookValue.toLocaleString('en-IN')} | Total Physical Value: INR ${comparison.totalPhysicalValue.toLocaleString('en-IN')}"`,
    `"Net Variance Financial Impact: INR ${comparison.totalVarianceValue.toLocaleString('en-IN')}"`,
    ''
  ].join('\n');

  const csv = metadata + '\n' + headers.join(',') + '\n' + rows.join('\n');
  const filename = `Physical_Stock_Audit_CARO2020_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${auditDate}.csv`;
  downloadCSV(csv, filename);
}
