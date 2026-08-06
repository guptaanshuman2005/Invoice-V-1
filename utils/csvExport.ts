import type { Invoice, Company } from '../types';

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

        invoices.forEach(inv => {
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

        // 2. HSN Summary
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
            taxableVal += inv.subTotal || 0;
            igstVal += inv.igst || 0;
            cgstVal += inv.cgst || 0;
            sgstVal += inv.sgst || 0;

            const pos = (inv.shippingState || inv.client.state || '').trim();
            const isInterState = pos.toLowerCase() !== companyState && pos !== '';
            const isUnregistered = !(inv.client.gstin && inv.client.gstin.trim().length > 0);

            if (isInterState && isUnregistered && pos) {
                if (!unregisteredInterState[pos]) {
                    unregisteredInterState[pos] = { taxable: 0, igst: 0 };
                }
                unregisteredInterState[pos].taxable += inv.subTotal || 0;
                unregisteredInterState[pos].igst += inv.igst || 0;
            }
        });

        const rows = [
            ['GSTR-3B Summary Report'],
            ['Generated On', new Date().toLocaleDateString()],
            [],
            ['Table 3.1 Details of Outward Supplies and inward supplies liable to reverse charge'],
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
                rows.push([state, amounts.taxable.toFixed(2), amounts.igst.toFixed(2)]);
            });
        }

        return rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    } catch (error) {
        console.error("Error generating GSTR-3B CSV:", error);
        return '';
    }
};
