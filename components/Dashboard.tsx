
import React, { useMemo, useEffect, useState } from 'react';
import type { Company, Invoice, Item } from '../types';
import { TrendingUp, TrendingDown, IndianRupee, FileText, Users, AlertTriangle, Scale, X, PlusCircle } from 'lucide-react';
import Modal from './common/Modal';

interface DashboardProps {
    invoices: Invoice[];
    items: Item[];
    company: Company;
    setActiveView?: (view: string) => void;
    onContinueDraft?: () => void; // New prop
    setInvoiceFilter?: (filter: string) => void;
    setInventoryFilter?: (filter: 'all' | 'in' | 'low' | 'out') => void;
}

// ... (Keep existing icons and chart components: TrendingUpIcon, AreaChart, etc. No logic changes, just wrapper styling) ...

const Sparkline: React.FC<{ data: number[], color: string }> = ({ data, color }) => {
    if (data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 100;
    const height = 40;
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible opacity-80">
            <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend?: { value: number; label: string };
    sparklineData?: number[];
    color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'orange';
    onClick?: () => void;
    delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, sparklineData, color, onClick, delay = 0 }) => {
    const isPositive = trend && trend.value >= 0;
    const colorStyles = {
        blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', stroke: '#3b82f6', shadow: 'hover:shadow-blue-500/10 hover:border-blue-500/30' },
        green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', stroke: '#22c55e', shadow: 'hover:shadow-green-500/10 hover:border-green-500/30' },
        yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400', stroke: '#eab308', shadow: 'hover:shadow-yellow-500/10 hover:border-yellow-500/30' },
        purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', stroke: '#a855f7', shadow: 'hover:shadow-purple-500/10 hover:border-purple-500/30' },
        red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', stroke: '#ef4444', shadow: 'hover:shadow-red-500/10 hover:border-red-500/30' },
        orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', stroke: '#f97316', shadow: 'hover:shadow-orange-500/10 hover:border-orange-500/30' },
    };
    const style = colorStyles[color];

    return (
        <div
            onClick={onClick}
            className={`
                relative p-6 rounded-2xl glass-panel 
                hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group h-full
                opacity-0 animate-fade-in-up ${style.shadow}
            `}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${style.bg} ${style.text} transition-transform duration-300 group-hover:scale-110`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'text-green-600 bg-green-100/50 dark:bg-green-900/30' : 'text-red-600 bg-red-100/50 dark:bg-red-900/30'}`}>
                        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Math.abs(trend.value).toFixed(1)}%
                    </div>
                )}
            </div>
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 font-display">{value}</h3>
                </div>
                {sparklineData && <div className="w-24 h-10 shrink-0"><Sparkline data={sparklineData} color={style.stroke} /></div>}
            </div>
        </div>
    );
};

import {
    AreaChart as RechartsAreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Tooltip
} from 'recharts';

const AreaChart: React.FC<{ data: { label: string; value: number }[], onPointClick?: (label: string) => void }> = ({ data, onPointClick }) => {
    if (data.length === 0) return null;
    return (
        <div className="w-full h-full relative" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <RechartsAreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    onClick={(e: any) => {
                        if (e && e.activePayload && e.activePayload.length > 0 && onPointClick) {
                            onPointClick(e.activePayload[0].payload.label);
                        }
                    }}
                >
                    <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                        dx={-10}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#4F46E5"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#revenueGradient)"
                        activeDot={{ r: 6, fill: '#fff', stroke: '#4F46E5', strokeWidth: 2 }}
                    />
                </RechartsAreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ invoices, items, company, setActiveView, onContinueDraft, setInvoiceFilter, setInventoryFilter }) => {
    const currency = '₹';
    const [hasDraft, setHasDraft] = useState(false);

    useEffect(() => {
        const draft = localStorage.getItem(`invoice_draft_${company.id}`);
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                if (parsed.items && parsed.items.length > 0) {
                    setHasDraft(true);
                }
            } catch (e) {
                // ignore invalid draft
            }
        } else {
            setHasDraft(false);
        }
    }, [company.id]);

    const [timeRange, setTimeRange] = useState<'6M' | '1Y' | 'ALL'>('6M');

    const metrics = useMemo(() => {
        const totalRevenue = invoices.filter(inv => inv.status === 'Paid').reduce((acc, inv) => acc + inv.grandTotal, 0);
        const totalExpenses = (company.expenses || []).reduce((acc, exp) => acc + (Number(exp.amount) || 0), 0);
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        const totalOutstanding = invoices.filter(inv => inv.status === 'Unpaid').reduce((acc, inv) => acc + inv.grandTotal, 0);
        const totalOverdue = invoices.filter(inv => inv.status === 'Overdue').reduce((acc, inv) => acc + inv.grandTotal, 0);
        const totalReceivables = totalOutstanding + totalOverdue;
        const totalClients = new Set(invoices.map(i => i.client?.id).filter(Boolean)).size;
        const lowStockItems = items.filter(i => i.quantityInStock <= 5).length;
        const today = new Date();

        const monthsCount = timeRange === '6M' ? 6 : timeRange === '1Y' ? 12 : 12; // Cap ALL at 12 months for chart readability

        const chartMonths = Array.from({ length: monthsCount }, (_, i) => {
            const d = new Date(today.getFullYear(), today.getMonth() - ((monthsCount - 1) - i), 1);
            return { month: d.getMonth(), year: d.getFullYear(), label: d.toLocaleString('default', { month: 'short' }), revenue: 0, outstanding: 0, activeClients: new Set<string>() };
        });

        invoices.forEach(inv => {
            const [y, m] = inv.issueDate.split('-').map(Number);
            const invYear = y;
            const invMonth = m - 1;
            const monthIndex = chartMonths.findIndex(b => b.month === invMonth && b.year === invYear);
            if (monthIndex !== -1) {
                if (inv.status === 'Paid') chartMonths[monthIndex].revenue += inv.grandTotal;
                else if (inv.status === 'Unpaid' || inv.status === 'Overdue') chartMonths[monthIndex].outstanding += inv.grandTotal;
                if (inv.client?.id) chartMonths[monthIndex].activeClients.add(inv.client.id);
            }
        });
        const revenueData = chartMonths.map(m => m.revenue);
        const outstandingData = chartMonths.map(m => m.outstanding);
        const chartLabels = chartMonths.map(m => m.label);
        const currentIdx = monthsCount - 1;
        const prevIdx = monthsCount - 2;
        const calcTrend = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return ((curr - prev) / prev) * 100;
        };
        const revenueTrend = calcTrend(revenueData[currentIdx], revenueData[prevIdx]);
        const outstandingTrend = calcTrend(outstandingData[currentIdx], outstandingData[prevIdx]);
        const clientTrend = calcTrend(chartMonths[currentIdx].activeClients.size, chartMonths[prevIdx].activeClients.size);
        const clientRevenueMap = new Map<string, { name: string, total: number, count: number }>();
        invoices.forEach(inv => {
            if (!inv.client?.id) return;
            const current = clientRevenueMap.get(inv.client.id) || { name: inv.client.name || 'Unknown', total: 0, count: 0 };
            current.total += inv.grandTotal;
            current.count += 1;
            clientRevenueMap.set(inv.client.id, current);
        });
        const topClients = Array.from(clientRevenueMap.values())
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        // Dynamic Insights
        const insights = [];

        // 1. Low Stock
        if (lowStockItems > 0) {
            insights.push({
                type: 'warning',
                text: `${lowStockItems} items are running low on stock.`,
                action: 'Inventory'
            });
        }

        // 2. Overdue Payments
        if (totalOverdue > 0) {
            insights.push({
                type: 'danger',
                text: `You have ${currency}${totalOverdue.toLocaleString()} in overdue payments. Follow up with clients.`,
                action: 'Invoices'
            });
        }

        // 3. Revenue Growth
        if (revenueTrend > 10) {
            insights.push({
                type: 'success',
                text: `Revenue is up ${revenueTrend.toFixed(1)}% this month! Great job.`,
                action: 'Invoices'
            });
        }

        // 4. Revenue Forecast (Simple)
        const avgMonthlyRevenue = totalRevenue / (chartMonths.filter(m => m.revenue > 0).length || 1);
        if (avgMonthlyRevenue > 0) {
            insights.push({
                type: 'info',
                text: `Based on your average, you're projected to hit ${currency}${(avgMonthlyRevenue * 1.1).toLocaleString()} next month.`,
                action: 'Dashboard'
            });
        }

        // 5. Customer Retention
        const repeatClients = Array.from(clientRevenueMap.values()).filter(c => c.count > 1).length;
        const retentionRate = totalClients > 0 ? (repeatClients / totalClients) * 100 : 0;
        if (retentionRate > 0) {
            insights.push({
                type: 'success',
                text: `Your customer retention rate is ${retentionRate.toFixed(0)}%. ${repeatClients} clients have returned!`,
                action: 'Clients'
            });
        }

        // 6. Tax Liability Estimate
        const estimatedTax = invoices.reduce((acc, inv) => acc + (inv.cgst + inv.sgst + inv.igst), 0);
        if (estimatedTax > 0) {
            insights.push({
                type: 'info',
                text: `Estimated GST liability for this period is ${currency}${estimatedTax.toLocaleString()}.`,
                action: 'Invoices'
            });
        }

        if (invoices.length > 0 && invoices.filter(i => i.status === 'Unpaid').length > 3) {
            insights.push({
                type: 'info',
                text: `You have several pending invoices. Consider sending reminders.`,
                action: 'Invoices'
            });
        }

        // Calculate Receivables Aging
        let aging0to30 = 0;
        let aging31to60 = 0;
        let aging60plus = 0;

        invoices.forEach(inv => {
            if (inv.status === 'Unpaid' || inv.status === 'Overdue') {
                const issueDate = new Date(inv.issueDate);
                const diffTime = Math.abs(today.getTime() - issueDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 30) {
                    aging0to30 += inv.grandTotal;
                } else if (diffDays <= 60) {
                    aging31to60 += inv.grandTotal;
                } else {
                    aging60plus += inv.grandTotal;
                }
            }
        });
        const totalAging = aging0to30 + aging31to60 + aging60plus || 1;

        // Calculate GST collected
        let cgstCollected = 0;
        let sgstCollected = 0;
        let igstCollected = 0;
        invoices.forEach(inv => {
            cgstCollected += inv.cgst || 0;
            sgstCollected += inv.sgst || 0;
            igstCollected += inv.igst || 0;
        });
        const totalGstCollected = cgstCollected + sgstCollected + igstCollected;

        // Calculate Low Stock list
        const lowStockList = items.filter(i => i.quantityInStock <= 5)
            .sort((a, b) => a.quantityInStock - b.quantityInStock)
            .slice(0, 3);

        // Calculate Top Selling Items
        const itemSalesMap = new Map<string, { name: string, quantity: number, revenue: number }>();
        invoices.forEach(inv => {
            if (inv.items) {
                inv.items.forEach(item => {
                    const current = itemSalesMap.get(item.id || item.name) || { name: item.name || 'Unknown Item', quantity: 0, revenue: 0 };
                    current.quantity += item.quantity || 0;
                    current.revenue += (item.price || 0) * (item.quantity || 0);
                    itemSalesMap.set(item.id || item.name, current);
                });
            }
        });
        const topSellingItems = Array.from(itemSalesMap.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        return {
            totalRevenue,
            totalReceivables,
            totalOverdue,
            totalClients,
            lowStockItems,
            revenueData,
            outstandingData,
            chartLabels,
            topClients,
            topSellingItems,
            insights,
            trends: { revenue: revenueTrend, outstanding: outstandingTrend, clients: clientTrend },
            aging: { aging0to30, aging31to60, aging60plus, totalAging },
            gst: { cgstCollected, sgstCollected, igstCollected, totalGstCollected },
            lowStockList
        };
    }, [invoices, items, currency, timeRange]);

    const revenueChartData = useMemo(() => metrics.chartLabels.map((label, i) => ({ label, value: metrics.revenueData[i] })), [metrics]);
    const invoiceStatusCounts = useMemo(() => {
        const paid = invoices.filter(i => i.status === 'Paid').length;
        const pending = invoices.filter(i => i.status === 'Unpaid').length;
        const overdue = invoices.filter(i => i.status === 'Overdue').length;
        const total = invoices.length || 1;
        return { paid, pending, overdue, total };
    }, [invoices]);
    const dashArray = (count: number) => { const total = invoiceStatusCounts.total; const percentage = (count / total) * 100; return `${percentage}, 100`; };
    const dashOffset = (prevCounts: number[]) => { const total = invoiceStatusCounts.total; const prevSum = prevCounts.reduce((a, b) => a + b, 0); return -((prevSum / total) * 100); };

    const navigateToInvoices = (filter?: string) => {
        if (setActiveView) {
            if (setInvoiceFilter) setInvoiceFilter(filter || '');
            setActiveView('Invoices');
        }
    };

    const navigateToInventory = (filter?: 'all' | 'in' | 'low' | 'out') => {
        if (setActiveView) {
            if (setInventoryFilter) setInventoryFilter(filter || 'all');
            setActiveView('Inventory');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass-panel p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Overview</p>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Welcome back, <span className="text-accent">{company.details.name}</span>
                    </h1>
                </div>
                <div className="flex flex-wrap gap-3 relative z-10">
                    {setActiveView && (
                        <>
                            <button
                                onClick={() => setActiveView('Clients')}
                                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                            >
                                <Users className="w-4 h-4" /> Add Client
                            </button>
                            <button
                                onClick={() => setActiveView('NewInvoice')}
                                className="bg-accent text-white hover:shadow-lg hover:shadow-accent/25 px-6 py-3 rounded-xl font-bold transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
                            >
                                <PlusCircle className="w-5 h-5" /> Create Invoice
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Stat Cards Row - Staggered Animation */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title="Total Revenue" value={`${currency}${metrics.totalRevenue.toLocaleString()}`} icon={<IndianRupee className="w-6 h-6" />} color="green" trend={{ value: metrics.trends.revenue, label: 'vs last month' }} sparklineData={metrics.revenueData} onClick={() => navigateToInvoices('Paid')} delay={0} />
                <StatCard title="Total Receivables" value={`${currency}${metrics.totalReceivables.toLocaleString()}`} icon={<Scale className="w-6 h-6" />} color="yellow" trend={{ value: metrics.trends.outstanding, label: 'vs last month' }} sparklineData={metrics.outstandingData} onClick={() => navigateToInvoices('Unpaid')} delay={100} />
                <StatCard title="Overdue Amount" value={`${currency}${metrics.totalOverdue.toLocaleString()}`} icon={<TrendingDown className="w-6 h-6" />} color="red" trend={{ value: 0, label: 'Needs attention' }} onClick={() => navigateToInvoices('Overdue')} delay={200} />
                <StatCard title="Low Stock Items" value={metrics.lowStockItems.toString()} icon={<AlertTriangle className="w-6 h-6" />} color="orange" onClick={() => navigateToInventory('low')} delay={300} />
                <StatCard title="Active Clients" value={metrics.totalClients.toString()} icon={<Users className="w-6 h-6" />} color="blue" trend={{ value: metrics.trends.clients, label: 'Growth' }} onClick={() => setActiveView && setActiveView('Clients')} delay={400} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Column: Quick Actions & Insights */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Quick Actions */}
                    <div className="glass-panel p-6 rounded-3xl">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Quick Actions</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'New Invoice', icon: <PlusCircle className="w-5 h-5" />, view: 'NewInvoice', color: 'bg-accent text-white' },
                                { label: 'New Quote', icon: <FileText className="w-5 h-5" />, view: 'NewQuotation', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' },
                                { label: 'Add Client', icon: <Users className="w-5 h-5" />, view: 'Clients', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' },
                                { label: 'Add Item', icon: <PlusCircle className="w-5 h-5" />, view: 'Items', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' },
                            ].map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveView && setActiveView(action.view)}
                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all hover:scale-105 active:scale-95 ${action.color}`}
                                >
                                    {action.icon}
                                    <span className="text-[10px] font-bold uppercase text-center">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Receivables Aging */}
                    <div className="glass-panel p-6 rounded-3xl">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 font-display">Receivables Aging</h2>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1.5">
                                    <span className="text-slate-500">0-30 Days (Current)</span>
                                    <span className="text-slate-900 dark:text-white font-extrabold">{currency}{metrics.aging.aging0to30.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${(metrics.aging.aging0to30 / metrics.aging.totalAging) * 100}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1.5">
                                    <span className="text-slate-500">31-60 Days Overdue</span>
                                    <span className="text-slate-900 dark:text-white font-extrabold">{currency}{metrics.aging.aging31to60.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${(metrics.aging.aging31to60 / metrics.aging.totalAging) * 100}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1.5">
                                    <span className="text-slate-500">60+ Days Overdue</span>
                                    <span className="text-slate-900 dark:text-white font-extrabold">{currency}{metrics.aging.aging60plus.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${(metrics.aging.aging60plus / metrics.aging.totalAging) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* GST collected Breakdown */}
                    <div className="glass-panel p-6 rounded-3xl">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 font-display">GST collected</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/60">
                                <span className="text-xs font-bold text-slate-500">CGST</span>
                                <span className="text-xs font-black text-slate-900 dark:text-white font-display">{currency}{metrics.gst.cgstCollected.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/60">
                                <span className="text-xs font-bold text-slate-500">SGST</span>
                                <span className="text-xs font-black text-slate-900 dark:text-white font-display">{currency}{metrics.gst.sgstCollected.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/60">
                                <span className="text-xs font-bold text-slate-500">IGST</span>
                                <span className="text-xs font-black text-slate-900 dark:text-white font-display">{currency}{metrics.gst.igstCollected.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Total Tax</span>
                                <span className="text-sm font-black text-accent font-display">{currency}{metrics.gst.totalGstCollected.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Insights */}
                    <div className="glass-panel p-6 rounded-3xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Smart Insights</h2>
                            <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse"></span>
                        </div>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {metrics.insights.length === 0 ? (
                                <p className="text-xs text-slate-500 text-center py-4 italic">No new insights today.</p>
                            ) : (
                                metrics.insights.map((insight, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            if (setActiveView) {
                                                if (insight.action === 'Inventory') {
                                                    if (setInventoryFilter) setInventoryFilter('low');
                                                    setActiveView('Inventory');
                                                } else if (insight.action === 'Invoices') {
                                                    setActiveView('Invoices');
                                                } else {
                                                    setActiveView(insight.action);
                                                }
                                            }
                                        }}
                                        className={`
                                            p-4 rounded-2xl border cursor-pointer transition-all hover:translate-x-1 group
                                            ${insight.type === 'warning' ? 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800/30' :
                                                insight.type === 'danger' ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-800/30' :
                                                    insight.type === 'success' ? 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-800/30' :
                                                        'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30'}
                                        `}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 shrink-0 ${insight.type === 'warning' ? 'text-orange-500' :
                                                insight.type === 'danger' ? 'text-red-500' :
                                                    insight.type === 'success' ? 'text-green-500' :
                                                        'text-blue-500'
                                                }`}>
                                                {insight.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                                                    insight.type === 'danger' ? <AlertTriangle className="w-4 h-4" /> :
                                                        insight.type === 'success' ? <TrendingUp className="w-4 h-4" /> :
                                                            <FileText className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white mb-1 group-hover:text-accent transition-colors">{insight.text}</p>
                                                <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-accent/70 transition-colors">Take Action →</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Restock Alerts Widget */}
                    {metrics.lowStockList.length > 0 && (
                        <div className="glass-panel p-6 rounded-3xl animate-fade-in-up">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 font-display">Restock Alerts</h2>
                            <div className="space-y-3">
                                {metrics.lowStockList.map(item => (
                                    <div key={item.id} onClick={() => navigateToInventory('low')} className="flex items-center justify-between p-3 bg-rose-500/5 dark:bg-rose-950/10 border border-rose-500/10 dark:border-rose-900/20 rounded-2xl cursor-pointer hover:-translate-y-0.5 transition-all hover:shadow-sm">
                                        <div>
                                            <p className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[120px]">{item.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">HSN: {item.hsn || 'N/A'}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-100/50 dark:bg-rose-900/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                {item.quantityInStock} {item.unit || 'pcs'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Charts & Activity */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Main Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                        <div onClick={() => navigateToInvoices()} className="lg:col-span-2 glass-panel p-8 rounded-3xl cursor-pointer hover:shadow-xl transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingUp className="w-24 h-24 -mr-8 -mt-8" />
                            </div>
                            <div className="flex justify-between items-center mb-8 relative z-10">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-accent transition-colors">Revenue Trend</h2>
                                    <p className="text-xs text-slate-500 font-medium mt-1">Monthly performance overview</p>
                                </div>
                                <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setTimeRange('6M'); }}
                                        className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider transition-colors ${timeRange === '6M' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        6M
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setTimeRange('1Y'); }}
                                        className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider transition-colors ${timeRange === '1Y' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        1Y
                                    </button>
                                </div>
                            </div>
                            <div className="h-72 w-full relative z-10">
                                {metrics.revenueData.every(v => v === 0) ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <FileText className="w-12 h-12 mb-2 opacity-20" />
                                        <p className="text-sm font-medium">No revenue data for this period.</p>
                                    </div>
                                ) : (
                                    <AreaChart data={revenueChartData} onPointClick={(label) => {
                                        // e.g., filter invoices by month if possible, or just navigate
                                        navigateToInvoices();
                                    }} />
                                )}
                            </div>
                        </div>

                        <div onClick={() => navigateToInvoices()} className="glass-panel p-8 rounded-3xl flex flex-col cursor-pointer hover:shadow-xl transition-all group relative overflow-hidden">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 group-hover:text-accent transition-colors relative z-10">Invoice Status</h2>
                            <div className="flex-grow flex items-center justify-center relative z-10" style={{ minHeight: '220px' }}>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Paid', value: invoiceStatusCounts.paid, color: '#10b981' },
                                                { name: 'Pending', value: invoiceStatusCounts.pending, color: '#f59e0b' },
                                                { name: 'Overdue', value: invoiceStatusCounts.overdue, color: '#f43f5e' }
                                            ].filter(d => d.value > 0)}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {[
                                                { name: 'Paid', value: invoiceStatusCounts.paid, color: '#10b981' },
                                                { name: 'Pending', value: invoiceStatusCounts.pending, color: '#f59e0b' },
                                                { name: 'Overdue', value: invoiceStatusCounts.overdue, color: '#f43f5e' }
                                            ].filter(d => d.value > 0).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                                            formatter={(value) => [`${value} Invoices`]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-black text-slate-900 dark:text-white">{invoices.length}</span>
                                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Invoices</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-6 text-center relative z-10">
                                <div className="p-2 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-800/30">
                                    <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Paid</p>
                                    <p className="text-base font-black text-slate-900 dark:text-white">{invoiceStatusCounts.total > 0 ? Math.round((invoiceStatusCounts.paid / invoiceStatusCounts.total) * 100) : 0}%</p>
                                </div>
                                <div className="p-2 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-800/30">
                                    <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5">Pending</p>
                                    <p className="text-base font-black text-slate-900 dark:text-white">{invoiceStatusCounts.total > 0 ? Math.round((invoiceStatusCounts.pending / invoiceStatusCounts.total) * 100) : 0}%</p>
                                </div>
                                <div className="p-2 rounded-2xl bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100/50 dark:border-rose-800/30">
                                    <p className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-0.5">Overdue</p>
                                    <p className="text-base font-black text-slate-900 dark:text-white">{invoiceStatusCounts.total > 0 ? Math.round((invoiceStatusCounts.overdue / invoiceStatusCounts.total) * 100) : 0}%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Recent Activity, Top Clients & Top Selling Items */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                        {/* Recent Activity */}
                        <div className="glass-panel p-8 rounded-3xl">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Recent Activity</h2>
                                    <p className="text-xs text-slate-500 font-medium mt-1">Latest transactions</p>
                                </div>
                                <button onClick={() => setActiveView && setActiveView('Invoices')} className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline bg-accent/5 px-4 py-2 rounded-full">View All</button>
                            </div>
                            <div className="space-y-4">
                                {invoices.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FileText className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                                        <p className="text-sm text-slate-400 font-medium">No recent activity found.</p>
                                    </div>
                                ) : (
                                    invoices.slice(0, 5).map((inv, idx) => (
                                        <div onClick={() => navigateToInvoices()} key={inv.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700 opacity-0 animate-fade-in-up group" style={{ animationDelay: `${idx * 100}ms` }}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-transform group-hover:scale-110 ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : inv.status === 'Overdue' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                                    {(inv.client?.name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-accent transition-colors">{inv.client?.name || 'Unknown Client'}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-0.5">{inv.invoiceNumber} • {inv.issueDate}</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-black text-slate-900 dark:text-white">{currency}{inv.grandTotal.toLocaleString()}</p>
                                                <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${inv.status === 'Paid' ? 'text-emerald-500' : inv.status === 'Overdue' ? 'text-rose-500' : 'text-amber-500'}`}>{inv.status}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Top Clients */}
                        <div className="glass-panel p-8 rounded-3xl">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Top Clients</h2>
                                    <p className="text-xs text-slate-500 font-medium mt-1">By revenue contribution</p>
                                </div>
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                    <Users className="w-5 h-5 text-slate-400" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                {metrics.topClients.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Users className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                                        <p className="text-sm text-slate-400 font-medium">No client data yet.</p>
                                    </div>
                                ) : (
                                    metrics.topClients.map((client, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setActiveView && setActiveView('Clients')}
                                            className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700/50 group hover:border-accent/30 hover:shadow-md cursor-pointer transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-black text-xs group-hover:bg-accent group-hover:text-white transition-all">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-accent transition-colors">{client.name}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">{client.count} Invoices</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-slate-900 dark:text-white">{currency}{client.total.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Top Selling Items */}
                        <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">Top Selling Items</h2>
                                <p className="text-xs text-slate-500 font-medium mt-1">Best performing inventory</p>
                            </div>
                            <div className="h-56 w-full mt-6 relative z-10 flex items-center justify-center">
                                {metrics.topSellingItems.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <FileText className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                                        <p className="text-sm font-medium">No sales recorded yet.</p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={metrics.topSellingItems} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                                                formatter={(value) => [`${value} units`, 'Quantity Sold']}
                                            />
                                            <Bar dataKey="quantity" fill="#818cf8" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Draft Recovery Bar */}
            {hasDraft && onContinueDraft && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-4 animate-slide-in cursor-pointer hover:bg-black transition-colors" onClick={onContinueDraft}>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm">Unfinished Invoice Found</span>
                        <span className="text-xs text-slate-400">Continue where you left off?</span>
                    </div>
                    <button className="bg-white text-slate-900 px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-200">
                        Resume
                    </button>
                    <button
                        className="text-slate-500 hover:text-white"
                        onClick={(e) => {
                            e.stopPropagation();
                            setHasDraft(false);
                            localStorage.removeItem(`invoice_draft_${company.id}`);
                        }}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
