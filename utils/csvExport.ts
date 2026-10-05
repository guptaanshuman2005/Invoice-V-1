import type { Invoice, Company } from '../types';
import { STATE_TO_GST_CODE } from '../constants';

export const downloadCSV = (content: string, filename: string) => {
    try {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
        return true;
    } catch (error) {
        console.error("Failed to download CSV:", error);
        alert("Failed to download the file. Please try again.");
        return false;
    }
};

export const arrayToCSV = (data: any[], columns: { key: string, label: string, formatter?: (row: any) => string }[]): string => {
    if (!data || !data.length) return '';
    
    try {
        const headerRow = columns.map(c => `"${c.label}"`).join(',');
        const rows = data.map(row => {
            return columns.map(c => {
                let val = c.formatter ? c.formatter(row) : (row[c.key] || '');
                if (val === null || val === undefined) val = '';
                if (typeof val === 'string') {
                    val = val.replace(/"/g, '""'); 
                }
                return `"${val}"`;
            }).join(',');
        });
        
        return [headerRow, ...rows].join('\n');
    } catch (error) {
        console.error("Error generating CSV content:", error);
        return '';
    }
};

export const generateGSTR1CSV = (invoices: Invoice[], company: Company) => {
    try {
        const rows: string[][] = [];
        const companyState = (company.details.state || '').trim().toLowerCase();

        const regularInvoices = invoices.filter(inv => inv.documentType !== 'credit_note' && inv.documentType !== 'debit_note');
        const creditDebitNotes = invoices.filter(inv => inv.documentType === 'credit_note' || inv.documentType === 'debit_note');

        // 1. Header for B2B/B2C
        rows.push(['GSTR-1 Outward Supplies Report']);
        rows.push(['Generated On', new Date().toLocaleDateString()]);
        rows.push([]);
        rows.push([
            'GSTIN/UIN of Recipient', 'Receiver Name', 'Invoice Number', 'Invoice Date', 
            'Invoice Value', 'Place Of Supply', 'Reverse Charge', 'Invoice Type', 
            'Rate (%)', 'Taxable Value', 'Integrated Tax (IGST)', 'Central Tax (CGST)', 
            'State/UT Tax (SGST)', 'Cess Amount'
        ]);

        const hsnGroups: { [hsn: string]: any } = {};

        regularInvoices.forEach(inv => {
            const pos = (inv.shippingState || inv.client.state || '').trim();
            const isInterState = pos.toLowerCase() !== companyState && pos !== '';
            const isB2B = !!(inv.client.gstin && inv.client.gstin.trim().length > 0);

            // Group items by GST Rate for invoice rows
            const rateGroups: { [rate: number]: number } = {};
            inv.items.forEach(item => {
                const rate = item.gstRate || 0;
                if (!rateGroups[rate]) rateGroups[rate] = 0;
                rateGroups[rate] += (item.price * item.quantity);

                // Aggregate HSN
                const hsn = item.hsn || 'Other';
                if (!hsnGroups[hsn]) {
                    hsnGroups[hsn] = { desc: item.name, uqc: item.unit, qty: 0, val: 0, taxable: 0, igst: 0, cgst: 0, sgst: 0 };
                }
                hsnGroups[hsn].qty += item.quantity;
                const taxable = item.price * item.quantity;
                const taxAmount = (taxable * rate) / 100;
                hsnGroups[hsn].taxable += taxable;
                hsnGroups[hsn].val += (taxable + taxAmount);
                
                if (isInterState) {
                    hsnGroups[hsn].igst += taxAmount;
                } else {
                    hsnGroups[hsn].cgst += taxAmount / 2;
                    hsnGroups[hsn].sgst += taxAmount / 2;
                }
            });

            Object.keys(rateGroups).forEach(rateStr => {
                const rate = Number(rateStr);
                const taxableValue = rateGroups[rate];
                const taxAmount = (taxableValue * rate) / 100;
                
                let igst = 0, cgst = 0, sgst = 0;
                if (isInterState) {
                    igst = taxAmount;
                } else {
                    cgst = taxAmount / 2;
                    sgst = taxAmount / 2;
                }

                rows.push([
                    inv.client.gstin || '',
                    inv.client.name,
                    inv.invoiceNumber,
                    inv.issueDate,
                    inv.grandTotal.toFixed(2),
                    pos,
                    'N',
                    isB2B ? 'B2B' : (inv.grandTotal > 250000 && isInterState ? 'B2CL' : 'B2CS'),
                    rate.toString(),
                    taxableValue.toFixed(2),
                    igst.toFixed(2),
                    cgst.toFixed(2),
                    sgst.toFixed(2),
                    '0.00'
                ]);
            });
        });

        // 2. Table 9B: Credit & Debit Notes
        if (creditDebitNotes.length > 0) {
            rows.push([]);
            rows.push([]);
            rows.push(['TABLE 9B: CREDIT / DEBIT NOTES (CDNR / CDNUR)']);
            rows.push([
                'GSTIN/UIN of Recipient', 'Receiver Name', 'Document Type', 'Note Number', 'Note Date',
                'Original Invoice Number', 'Original Invoice Date', 'Reason For Issuing', 'Note Value',
                'Place Of Supply', 'Rate (%)', 'Taxable Value', 'Integrated Tax (IGST)', 'Central Tax (CGST)', 'State/UT Tax (SGST)'
            ]);

            creditDebitNotes.forEach(note => {
                const pos = (note.shippingState || note.client.state || '').trim();
                const isInterState = pos.toLowerCase() !== companyState && pos !== '';
                const docLabel = note.documentType === 'credit_note' ? 'Credit Note (C)' : 'Debit Note (D)';

                const rateGroups: { [rate: number]: number } = {};
                note.items.forEach(item => {
                    const rate = item.gstRate || 0;
                    if (!rateGroups[rate]) rateGroups[rate] = 0;
                    rateGroups[rate] += (item.price * item.quantity);
                });

                Object.keys(rateGroups).forEach(rateStr => {
                    const rate = Number(rateStr);
                    const taxableValue = rateGroups[rate];
                    const taxAmount = (taxableValue * rate) / 100;

                    let igst = 0, cgst = 0, sgst = 0;
                    if (isInterState) {
                        igst = taxAmount;
                    } else {
                        cgst = taxAmount / 2;
                        sgst = taxAmount / 2;
                    }

                    rows.push([
                        note.client.gstin || '',
                        note.client.name,
                        docLabel,
                        note.invoiceNumber,
                        note.issueDate,
                        note.originalInvoiceNumber || '',
                        note.originalInvoiceDate || '',
                        note.reason || 'Sales Return',
                        note.grandTotal.toFixed(2),
                        pos,
                        rate.toString(),
                        taxableValue.toFixed(2),
                        igst.toFixed(2),
                        cgst.toFixed(2),
                        sgst.toFixed(2)
                    ]);
                });
            });
        }

        // 3. HSN Summary
        rows.push([]);
        rows.push([]);
        rows.push(['HSN SUMMARY']);
        rows.push([
            'HSN', 'Description', 'UQC', 'Total Quantity', 'Total Value', 
            'Taxable Value', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess'
        ]);

        Object.keys(hsnGroups).forEach(hsn => {
            const g = hsnGroups[hsn];
            rows.push([
                hsn, g.desc, g.uqc, g.qty.toString(), g.val.toFixed(2),
                g.taxable.toFixed(2), g.igst.toFixed(2), g.cgst.toFixed(2), g.sgst.toFixed(2), '0.00'
            ]);
        });

        return rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    } catch (error) {
        console.error("Error generating GSTR-1 CSV:", error);
        return '';
    }
};

export const generateGSTR3BCSV = (invoices: Invoice[], company: Company) => {
    try {
        let taxableVal = 0;
        let igstVal = 0;
        let cgstVal = 0;
        let sgstVal = 0;

        const companyState = (company.details.state || '').trim().toLowerCase();
        const unregisteredInterState: { [state: string]: { taxable: number, igst: number } } = {};

        invoices.forEach(inv => {
            const isCreditNote = inv.documentType === 'credit_note';
            const multiplier = isCreditNote ? -1 : 1;

            taxableVal += (inv.subTotal || 0) * multiplier;
            igstVal += (inv.igst || 0) * multiplier;
            cgstVal += (inv.cgst || 0) * multiplier;
            sgstVal += (inv.sgst || 0) * multiplier;

            const pos = (inv.shippingState || inv.client.state || '').trim();
            const isInterState = pos.toLowerCase() !== companyState && pos !== '';
            const isUnregistered = !(inv.client.gstin && inv.client.gstin.trim().length > 0);

            if (isInterState && isUnregistered && pos) {
                if (!unregisteredInterState[pos]) {
                    unregisteredInterState[pos] = { taxable: 0, igst: 0 };
                }
                unregisteredInterState[pos].taxable += (inv.subTotal || 0) * multiplier;
                unregisteredInterState[pos].igst += (inv.igst || 0) * multiplier;
            }
        });

        taxableVal = Math.max(0, taxableVal);
        igstVal = Math.max(0, igstVal);
        cgstVal = Math.max(0, cgstVal);
        sgstVal = Math.max(0, sgstVal);

        const rows = [
            ['GSTR-3B Summary Report'],
            ['Generated On', new Date().toLocaleDateString()],
            [],
            ['Table 3.1 Details of Outward Supplies and inward supplies liable to reverse charge (Net of Credit/Debit Notes)'],
            ['Nature of Supplies', 'Total Taxable Value', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess'],
            ['(a) Outward taxable supplies (other than zero rated, nil rated and exempted)', taxableVal.toFixed(2), igstVal.toFixed(2), cgstVal.toFixed(2), sgstVal.toFixed(2), '0.00'],
            ['(b) Outward taxable supplies (zero rated)', '0.00', '0.00', '0.00', '0.00', '0.00'],
            ['(c) Other outward supplies (Nil rated, exempted)', '0.00', '-', '-', '-', '-'],
            ['(d) Inward supplies (liable to reverse charge)', '0.00', '0.00', '0.00', '0.00', '0.00'],
            ['(e) Non-GST outward supplies', '0.00', '-', '-', '-', '-'],
            [],
            ['Table 3.2 Of the supplies shown in 3.1 (a) above, details of inter-State supplies made to unregistered persons'],
            ['Place of Supply (State/UT)', 'Total Taxable Value', 'Amount of Integrated Tax']
        ];

        if (Object.keys(unregisteredInterState).length === 0) {
            rows.push(['No inter-state supplies to unregistered persons', '-', '-']);
        } else {
            Object.entries(unregisteredInterState).forEach(([state, amounts]) => {
                rows.push([state, Math.max(0, amounts.taxable).toFixed(2), Math.max(0, amounts.igst).toFixed(2)]);
            });
        }

        return rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    } catch (error) {
        console.error("Error generating GSTR-3B CSV:", error);
        return '';
    }
};

export const downloadJSON = (data: any, filename: string) => {
    try {
        const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        return true;
    } catch (error) {
        console.error("Failed to download JSON:", error);
        alert("Failed to download JSON file. Please try again.");
        return false;
    }
};

export const getStateCode = (stateName: string): string => {
    if (!stateName) return '99';
    const trimmed = stateName.trim();
    if (/^\d{2}$/.test(trimmed)) return trimmed;
    return STATE_TO_GST_CODE[trimmed] || '99';
};

export const generateGSTR1JSON = (invoices: Invoice[], company: Company, fp: string = '') => {
    const companyState = (company.details.state || '').trim().toLowerCase();
    
    // Group B2B by Client GSTIN
    const b2bMap: Record<string, { ctin: string, inv: any[] }> = {};
    const b2csMap: Record<string, { sply_ty: string, pos: string, typ: string, rt: number, txval: number, iamt: number, camt: number, samt: number, csamt: number }> = {};
    const hsnMap: Record<string, { hsn_sc: string, desc: string, uqc: string, qty: number, val: number, txval: number, iamt: number, camt: number, samt: number, csamt: number }> = {};
    const cdnrMap: Record<string, { ctin: string, nt: any[] }> = {};
    const cdnur: any[] = [];
    
    const invoiceNumbers: string[] = [];
    const creditNoteNumbers: string[] = [];
    const debitNoteNumbers: string[] = [];

    invoices.forEach(inv => {
        const rawPos = (inv.shippingState || inv.client.state || '').trim();
        const posCode = getStateCode(rawPos);
        const isInterState = rawPos.toLowerCase() !== companyState && rawPos !== '';
        const isB2B = !!(inv.client.gstin && inv.client.gstin.trim().length > 0);
        const isCreditNote = inv.documentType === 'credit_note';
        const isDebitNote = inv.documentType === 'debit_note';

        // Parse date to DD-MM-YYYY
        let formattedDate = inv.issueDate;
        try {
            const d = new Date(inv.issueDate);
            if (!isNaN(d.getTime())) {
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                formattedDate = `${day}-${month}-${year}`;
            }
        } catch (_) {}

        // Group items by rate
        const rateItems: Record<number, { txval: number, iamt: number, camt: number, samt: number }> = {};
        inv.items.forEach(item => {
            const rt = Number(item.gstRate) || 0;
            const txval = (Number(item.price) || 0) * (Number(item.quantity) || 0);
            const tax = (txval * rt) / 100;
            if (!rateItems[rt]) {
                rateItems[rt] = { txval: 0, iamt: 0, camt: 0, samt: 0 };
            }
            rateItems[rt].txval += txval;
            if (isInterState) {
                rateItems[rt].iamt += tax;
            } else {
                rateItems[rt].camt += tax / 2;
                rateItems[rt].samt += tax / 2;
            }
        });

        const itms = Object.entries(rateItems).map(([rtStr, vals], idx) => ({
            num: idx + 1,
            itm_det: {
                rt: Number(rtStr),
                txval: parseFloat(vals.txval.toFixed(2)),
                iamt: parseFloat(vals.iamt.toFixed(2)),
                camt: parseFloat(vals.camt.toFixed(2)),
                samt: parseFloat(vals.samt.toFixed(2)),
                csamt: 0
            }
        }));

        if (isCreditNote || isDebitNote) {
            const ntty = isCreditNote ? "C" : "D";
            if (isCreditNote) creditNoteNumbers.push(inv.invoiceNumber);
            if (isDebitNote) debitNoteNumbers.push(inv.invoiceNumber);

            let origDate = inv.originalInvoiceDate || inv.issueDate;
            try {
                const od = new Date(origDate);
                if (!isNaN(od.getTime())) {
                    origDate = `${String(od.getDate()).padStart(2, '0')}-${String(od.getMonth() + 1).padStart(2, '0')}-${od.getFullYear()}`;
                }
            } catch (_) {}

            const notePayload = {
                ntty,
                nt_num: inv.invoiceNumber,
                nt_dt: formattedDate,
                inum: inv.originalInvoiceNumber || inv.invoiceNumber,
                idt: origDate,
                val: parseFloat(inv.grandTotal.toFixed(2)),
                pos: posCode,
                rchrg: "N",
                itms
            };

            if (isB2B) {
                const ctin = inv.client.gstin!.trim().toUpperCase();
                if (!cdnrMap[ctin]) {
                    cdnrMap[ctin] = { ctin, nt: [] };
                }
                cdnrMap[ctin].nt.push(notePayload);
            } else {
                cdnur.push({
                    typ: isInterState ? "B2CL" : "B2CS",
                    ...notePayload
                });
            }
            return; // Don't add CN/DN directly to b2b or b2cs outward
        }

        invoiceNumbers.push(inv.invoiceNumber);

        if (isB2B) {
            const ctin = inv.client.gstin!.trim().toUpperCase();
            if (!b2bMap[ctin]) {
                b2bMap[ctin] = { ctin, inv: [] };
            }

            b2bMap[ctin].inv.push({
                inum: inv.invoiceNumber,
                idt: formattedDate,
                val: parseFloat(inv.grandTotal.toFixed(2)),
                pos: posCode,
                rchrg: "N",
                inv_typ: "R",
                itms
            });
        } else {
            // B2CS (Unregistered recipient)
            const sply_ty = isInterState ? "INTER" : "INTRA";
            inv.items.forEach(item => {
                const rt = Number(item.gstRate) || 0;
                const txval = (Number(item.price) || 0) * (Number(item.quantity) || 0);
                const tax = (txval * rt) / 100;
                const key = `${sply_ty}_${posCode}_${rt}`;

                if (!b2csMap[key]) {
                    b2csMap[key] = {
                        sply_ty,
                        pos: posCode,
                        typ: "OE",
                        rt,
                        txval: 0,
                        iamt: 0,
                        camt: 0,
                        samt: 0,
                        csamt: 0
                    };
                }

                b2csMap[key].txval += txval;
                if (isInterState) {
                    b2csMap[key].iamt += tax;
                } else {
                    b2csMap[key].camt += tax / 2;
                    b2csMap[key].samt += tax / 2;
                }
            });
        }

        // HSN aggregation
        inv.items.forEach(item => {
            const hsn = (item.hsn || '9999').trim();
            const rt = Number(item.gstRate) || 0;
            const txval = (Number(item.price) || 0) * (Number(item.quantity) || 0);
            const tax = (txval * rt) / 100;
            const val = txval + tax;
            const uqc = (item.unit || 'PCS').toUpperCase();

            if (!hsnMap[hsn]) {
                hsnMap[hsn] = {
                    hsn_sc: hsn,
                    desc: item.name || 'Goods/Services',
                    uqc,
                    qty: 0,
                    val: 0,
                    txval: 0,
                    iamt: 0,
                    camt: 0,
                    samt: 0,
                    csamt: 0
                };
            }

            hsnMap[hsn].qty += Number(item.quantity) || 0;
            hsnMap[hsn].val += val;
            hsnMap[hsn].txval += txval;
            if (isInterState) {
                hsnMap[hsn].iamt += tax;
            } else {
                hsnMap[hsn].camt += tax / 2;
                hsnMap[hsn].samt += tax / 2;
            }
        });
    });

    const b2b = Object.values(b2bMap);
    const b2cs = Object.values(b2csMap).map(b => ({
        ...b,
        txval: parseFloat(b.txval.toFixed(2)),
        iamt: parseFloat(b.iamt.toFixed(2)),
        camt: parseFloat(b.camt.toFixed(2)),
        samt: parseFloat(b.samt.toFixed(2))
    }));

    const hsnData = Object.values(hsnMap).map((h, i) => ({
        num: i + 1,
        hsn_sc: h.hsn_sc,
        desc: h.desc,
        uqc: h.uqc,
        qty: parseFloat(h.qty.toFixed(2)),
        val: parseFloat(h.val.toFixed(2)),
        txval: parseFloat(h.txval.toFixed(2)),
        iamt: parseFloat(h.iamt.toFixed(2)),
        camt: parseFloat(h.camt.toFixed(2)),
        samt: parseFloat(h.samt.toFixed(2)),
        csamt: 0
    }));

    // Document Issue
    const sortedInvoices = [...invoiceNumbers].sort();
    const doc_det: any[] = [
        {
            doc_num: 1,
            doc_typ: "Invoices for outward supply",
            docs: [
                {
                    num: 1,
                    from: sortedInvoices[0] || 'INV-001',
                    to: sortedInvoices[sortedInvoices.length - 1] || 'INV-001',
                    totnum: sortedInvoices.length,
                    canc: 0,
                    net_issue: sortedInvoices.length
                }
            ]
        }
    ];

    if (creditNoteNumbers.length > 0) {
        const sortedCN = [...creditNoteNumbers].sort();
        doc_det.push({
            doc_num: 2,
            doc_typ: "Credit Note",
            docs: [
                {
                    num: 1,
                    from: sortedCN[0],
                    to: sortedCN[sortedCN.length - 1],
                    totnum: sortedCN.length,
                    canc: 0,
                    net_issue: sortedCN.length
                }
            ]
        });
    }

    if (debitNoteNumbers.length > 0) {
        const sortedDN = [...debitNoteNumbers].sort();
        doc_det.push({
            doc_num: 3,
            doc_typ: "Debit Note",
            docs: [
                {
                    num: 1,
                    from: sortedDN[0],
                    to: sortedDN[sortedDN.length - 1],
                    totnum: sortedDN.length,
                    canc: 0,
                    net_issue: sortedDN.length
                }
            ]
        });
    }

    const cur_gt = invoices.reduce((sum, inv) => {
        const mult = inv.documentType === 'credit_note' ? -1 : 1;
        return sum + (inv.grandTotal || 0) * mult;
    }, 0);

    return {
        gstin: (company.details.gstin || '27AAAAA0000A1Z5').toUpperCase(),
        fp: fp || `${String(new Date().getMonth() + 1).padStart(2, '0')}${new Date().getFullYear()}`,
        cur_gt: parseFloat(Math.max(0, cur_gt).toFixed(2)),
        gt: parseFloat(Math.max(0, cur_gt).toFixed(2)),
        b2b,
        b2cs,
        cdnr: Object.values(cdnrMap),
        cdnur,
        hsn: { data: hsnData },
        doc_issue: { doc_det }
    };
};

