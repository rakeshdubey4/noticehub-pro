import React, { useState, useEffect, useRef } from 'react';
import { useForm, router, Link, usePage } from '@inertiajs/react';
import toast, { Toaster } from 'react-hot-toast';
// Import Recharts components for beautiful visualization
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';


export default function Dashboard({ notices = {}, summary = { total: 0, pending: 0, filed: 0, not_needed: 0 }, filters = { search: '', notice_type: '', filing_status: '' }, uniqueNoticeTypes = [], emailHistoryLogs = [], isAdmin = false }) {

    // Notices paginated structure se data array extract karein
    const noticeDataArray = notices.data || [];

    // Auth context destructured parameters from Laravel standard auth global hooks
    const { auth, flash } = usePage().props;
    const user = auth?.user;

    // Mobile Sidebar Visibility State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    // Search control management state
    // Multiple State variables tracking selection inputs
    const [search, setSearch] = useState(filters?.search || '');
    const [noticeType, setNoticeType] = useState(filters?.notice_type || '');
    const [filingStatus, setFilingStatus] = useState(filters?.filing_status || '');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isEmailLogExpanded, setIsEmailLogExpanded] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const dropdownRef = useRef(null);
    // Dedicated form tracking hooks state exclusively for Change Password logic module
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Modal controls toggling mechanisms
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentNoticeId, setCurrentNoticeId] = useState(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    // Inertia standard form data submission state management 
    const { data, setData, post, put, reset, errors, processing } = useForm({
        company_name: '',
        notice_type: '',
        notice_date: '',
        notice_post_date: '',
        notify_day: '',
    });
    // Global utility helper function to instantly fire toast animations
    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        // Auto-dismiss context box safely after 4 seconds automatically
        setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 4000);
    };

    // Safety registration window context block for fallbacks triggers
    if (typeof window.isEmailLogExpanded === 'undefined') { window.isEmailLogExpanded = false; }
    window.setIsEmailHistoryOpen = setIsEmailLogExpanded;
    window.isEmailHistoryOpen = isEmailLogExpanded;

    // Inertia generic session success validation to toast interceptor listener
    useEffect(() => {
        setSelectedIds([]);
    }, [notices.current_page]);
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success, { duration: 4000, position: 'top-right' });
        }
    }, [flash]);

    // Close settings dropdown on click event tracking bubble outside boundaries
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);



    // Handle real-time search logic with standard 300ms debounce experience
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            if (search.length > 0 && search.length < 2) {
                return;
            }
            router.get(
                route('dashboard'),
                {
                    search,
                    notice_type: noticeType,
                    filing_status: filingStatus,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [search, noticeType, filingStatus]);
    const clearAllFilters = () => {
        setSearch('');
        setNoticeType('');
        setFilingStatus('');
    };


    // BULK SELECTION ENGINE MANAGEMENT ACTIONS
    const handleSelectRow = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(item => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleSelectAllRows = () => {
        if (selectedIds.length === noticeDataArray.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(noticeDataArray.map(notice => notice.id));
        }
    };

    const handleBulkStatusSubmit = (targetStatus) => {
        if (selectedIds.length === 0) return;
        if (window.confirm(`Kya aap sabhi ${selectedIds.length} selected records ka status update karna chahte hain?`)) {
            router.post(route('notices.bulk-update-status'), {
                ids: selectedIds,
                filing_status: targetStatus
            }, {
                onSuccess: () => {
                    setSelectedIds([]);
                    toast.success("Bulk operation executed successfully.");
                }
            });
        }
    };
    // File download router utilities mapping active filtration settings
    const triggerExport = (formatType) => {
        const routeName = formatType === 'excel' ? 'reports.export.excel' : 'reports.export.pdf';
        window.location.href = route(routeName, { search, notice_type: noticeType, filing_status: filingStatus });
    };

    const handleLogout = (e) => {
        e.preventDefault();
        router.post(route('logout'));
    };

    // Async Request submission for resetting account user profile credentials
    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        passwordForm.put(route('user.change-password'), {
            onSuccess: () => {
                setIsPasswordModalOpen(false);
                passwordForm.reset();
                showToast("Account security validation check: Password updated successfully.", "success");

            },
            onError: () => {
                showToast("Error check: Unable to update password.", "error");
            }
        });
    };



    // Opening Create Modal view helper
    const openAddModal = () => {
        reset();
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    // Opening Update Modal binding context datasets
    const openEditModal = (notice) => {
        setData({
            company_name: notice.company_name || '',
            notice_type: notice.notice_type || '',
            notice_date: notice.notice_date || '',
            notice_post_date: notice.notice_post_date || '',
            notify_day: notice.notify_day || 0,
        });
        setCurrentNoticeId(notice.id);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    // Global asynchronous operations router dispatch action
    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditMode) {
            put(route('notices.update', currentNoticeId), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    showToast("Notice record directory logs modified successfully!", "success");
                },
                onError: () => showToast("Error check: Validation fields mismatched.", "error")
            });
        } else {
            post(route('notices.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    showToast("New corporate notice profile logged inside directory!", "success");
                },
                onError: () => showToast("Error check: Required fields parameters missing.", "error")
            });
        }
    };

    // Instant status change update handler (Ajax experience)
    const handleStatusChange = (id, statusValue) => {
        router.put(route('notices.update', id),
            { filing_status: statusValue },
            { preserveScroll: true ,

            
                onSuccess: () => showToast(`Filing execution status modified to ${statusValue.toUpperCase()}`, "info"),
                onError: () => showToast("Failed to alter status variables parameters.", "error")
            }
        );
    };


    // Safe deletion workflow execution 
    const handleDelete = (id) => {
        if (window.confirm("Permanently delete this notice?")) {
            router.delete(route('notices.destroy', id), {
                onSuccess: () => showToast("Notice record trace permanently wiped from directory database.", "warning"),
                onError: () => showToast("Administrative privilege check: Action restricted.", "error")
            });
        }
    };
    const formatDate = (dateString) => {
        if (!dateString || !dateString.includes('-')) return '-';

        const [year, month, day] = dateString.split('-');
        return `${day}-${month}-${year}`;
    };

    // Row status specific alert style injector
    // Dynamic deadline calculation and urgency visual injector
    const getRowBgClass = (notice) => {
        const status = notice.filing_status;

        // Check if notice is pending AND overdue (Current Date > Notice Date + Notify Days)
        if (status === 'pending' && notice.notice_date) {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time part for pure date comparison

            const noticeDate = new Date(notice.notice_date);
            const notifyDays = parseInt(notice.notify_day) || 0;

            // Target trigger date calculation
            const targetAlertDate = new Date(noticeDate);
            targetAlertDate.setDate(targetAlertDate.getDate() + notifyDays);
            targetAlertDate.setHours(0, 0, 0, 0);

            if (today >= targetAlertDate) {
                // CRITICAL OVERDUE: Eye-catching bold soft red alert format with thick warning boundary
                return 'bg-rose-50 hover:bg-rose-100/80 border-l-4 border-l-rose-600 animate-pulse-subtle';
            }
        }

        // Default fallbacks for non-critical rows
        if (status === 'filed') return 'bg-emerald-50/40 hover:bg-emerald-50/80 border-l-4 border-l-emerald-500';
        if (status === 'not needed') return 'bg-slate-100/50 hover:bg-slate-100/90 border-l-4 border-l-slate-400';

        return 'bg-amber-50/40 hover:bg-amber-50/80 border-l-4 border-l-amber-500'; // Standard pending row
    };


    const chartData = [
        {
            name: 'Pending',
            value: summary.pending,
            color: '#f59e0b',
        },
        {
            name: 'Filed',
            value: summary.filed,
            color: '#10b981',
        },
        {
            name: 'Not Needed',
            value: summary.not_needed,
            color: '#64748b',
        },
    ];

    const COLORS = ['#f59e0b', '#10b981', '#64748b'];


    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 antialiased p-4 md:p-8">
            {/* Native Toast alerts floating configuration injection rendering layout node */}
            <Toaster />
            {/* STYLISH NAVIGATION HEADER BAR WITH DROPDOWN AUTHS */}
            <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-sm px-4 md:px-8 py-3.5 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <span className="text-2xl">📋</span>
                    <span className="font-black text-slate-900 tracking-tight text-lg md:text-xl">NoticeHub Pro</span>
                </div>

                <div className="flex items-center space-x-4">
                    {user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsProfileOpen(!isProfileOpen);
                                }}
                                className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl hover:bg-slate-100 transition text-sm font-semibold text-slate-700"
                            >
                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                                <span className="hidden sm:inline-block max-w-[120px] truncate">{user.name}</span>
                                <span className="text-[10px] text-slate-400">▼</span>
                            </button>

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                    <div className="px-4 py-2 border-b border-slate-100">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Account Role</p>
                                        <p className="text-sm font-bold text-slate-800 truncate">{isAdmin ? 'Systems Admin' : 'Guest Viewer'}</p>
                                    </div>

                                    {/* Fixed Action Toggle preventing bubble conflicts */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation(); // Event bubble block karega
                                            setIsProfileOpen(false); // Dropdown menu band karega
                                            setIsPasswordModalOpen(true); // Password modal instantly open karega
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition duration-150"
                                    >
                                        ⚙️ Change Password
                                    </button>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 transition duration-150 border-t border-slate-50"
                                    >
                                        🚪 Logout Account
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <Link href={route('login')} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition shadow-sm">Login</Link>
                            <Link href={route('register')} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition shadow-sm">Register</Link>
                        </div>
                    )}


                </div>
            </header>
            <div className="max-w-7xl mx-auto space-y-8">

                {/* LATEST SUMMARY METRIC DASHBOARD CARDS */}
                {/* LATEST INTERACTIVE GLOW METRIC DASHBOARD CARDS WITH FLOATING DATA INSIGHT POPUPS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                    {/* CARD 1: Total Notices Records */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative group transition-all duration-200 hover:shadow-md">
                        <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Notices</span>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">{summary.total}</h3>

                        {/* Cute Glassmorphic Floating Popup Overlay */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-52 bg-slate-900/90 border border-white/10 text-white rounded-xl p-3 text-xs shadow-xl backdrop-blur-md z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                            <div className="font-bold border-b border-white/10 pb-1 mb-1 text-[11px] uppercase tracking-wider text-blue-400">📊 Database Logs Insight</div>
                            <p className="text-white/80 leading-relaxed">Directory contains a total of <strong className="text-white font-extrabold">{summary.total}</strong> registered profiles logs tracked across system indexes.</p>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900/90" />
                        </div>
                    </div>

                    {/* CARD 2: Pending Filings Alerts Timeline (Tracks Last 24H) */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative group transition-all duration-200 hover:shadow-md">
                        <span className="text-xs uppercase tracking-wider font-semibold text-amber-500">Pending Filings</span>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-amber-600 mt-1">{summary.pending}</h3>

                        {/* Cute Glassmorphic Floating Popup Overlay */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-52 bg-slate-900/90 border border-white/10 text-white rounded-xl p-3 text-xs shadow-xl backdrop-blur-md z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                            <div className="font-bold border-b border-white/10 pb-1 mb-1 text-[11px] uppercase tracking-wider text-amber-400">⚠️ Live Urgency Monitor</div>
                            <p className="text-white/80 leading-relaxed"><strong className="text-amber-400 font-extrabold">+{summary.pending_last_24h ?? 0} new entries</strong> have arrived inside the tracking directory list within the last 24 hours.</p>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900/90" />
                        </div>
                    </div>

                    {/* CARD 3: Filed Status Complete Milestone Logs (Tracks Monthly Performance) */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative group transition-all duration-200 hover:shadow-md">
                        <span className="text-xs uppercase tracking-wider font-semibold text-emerald-500">Filed Status</span>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-emerald-600 mt-1">{summary.filed}</h3>

                        {/* Cute Glassmorphic Floating Popup Overlay */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-52 bg-slate-900/90 border border-white/10 text-white rounded-xl p-3 text-xs shadow-xl backdrop-blur-md z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                            <div className="font-bold border-b border-white/10 pb-1 mb-1 text-[11px] uppercase tracking-wider text-emerald-400">🏆 Velocity Reports</div>
                            <p className="text-white/80 leading-relaxed">Compliance velocity check: <strong className="text-emerald-400 font-extrabold">{summary.filed_this_month ?? 0} filings</strong> successfully completed and closed during this calendar month.</p>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900/90" />
                        </div>
                    </div>

                    {/* CARD 4: Not Needed Operational Segment Records */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative group transition-all duration-200 hover:shadow-md">
                        <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Not Needed</span>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-slate-500 mt-1">{summary.not_needed ?? 0}</h3>

                        {/* Cute Glassmorphic Floating Popup Overlay */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-52 bg-slate-900/90 border border-white/10 text-white rounded-xl p-3 text-xs shadow-xl backdrop-blur-md z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                            <div className="font-bold border-b border-white/10 pb-1 mb-1 text-[11px] uppercase tracking-wider text-slate-400">💤 Maintenance Exclusions</div>
                            <p className="text-white/80 leading-relaxed">Contains records categorized as exempt from active automation alert triggers loops calculations rules.</p>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900/90" />
                        </div>
                    </div>

                </div>

                {/* ADVANCED RECHARTS CORPORATE ANALYTICS CHART CONSOLE */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">

                        <div>
                            <h4 className="text-lg font-bold text-slate-900 mb-2">
                                📈 Compliance Analytics
                            </h4>

                            <p className="text-sm text-slate-500 mb-4">
                                Real-time notice filing status distribution.
                            </p>

                            <div className="space-y-3">
                                {chartData.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="font-medium text-slate-700">
                                                {item.name}
                                            </span>
                                        </div>

                                        <span className="font-bold text-slate-900">
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        dataKey="value"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={110}
                                        paddingAngle={4}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>

                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                    </div>
                </div>

                {/* Real-time Donut Chart Container Rendering Segment */}
                {summary.total === 0 ? (
                    <div className="text-sm text-slate-500">Add records to render analytical chart overview.</div>
                ) : (
                    <div className="flex items-center space-x-4">
                        {chartData.map((entry, index) => (
                            <div key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
                                {entry.name}: {entry.value}
                            </div>
                        ))}
                    </div>
                )}
                {summary.total > 0 && <div className="text-xs text-slate-400">Total Logs {summary.total}</div>}
                {/* LATEST DESIGN HIDDEN COLLAPSIBLE EMAIL LOG AUDIT SYSTEM - ONLY FOR ADMIN */}
                {isAdmin && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden transition-all duration-300">

                        {/* CLICKABLE HEADER TOGGLE WITH SMOOTH INTERACTION */}
                        <button
                            type="button"
                            onClick={() => {
                                // Client-side variable state dynamically tracking expanded panel frame
                                window.setIsEmailHistoryOpen ? window.setIsEmailHistoryOpen(!window.isEmailHistoryOpen) : null;
                                // Alternate inline direct fallback approach using local component flag
                                if (typeof isEmailLogExpanded === 'undefined') {
                                    window.isEmailLogExpanded = !window.isEmailLogExpanded;
                                    router.reload({ preserveScroll: true }); // Fast state layout sync
                                } else {
                                    setIsEmailLogExpanded(!isEmailLogExpanded);
                                }
                            }}
                            className="w-full flex items-center justify-between p-5 bg-slate-50/50 hover:bg-slate-50 transition-colors duration-200 text-left focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                        >
                            <div className="flex items-center space-x-3">
                                <span className="text-xl bg-indigo-50 p-2 rounded-xl text-indigo-600 shadow-sm">📅</span>
                                <div>
                                    <h4 className="text-base font-black tracking-tight text-slate-900">System Dispatch Logs Auditing Trail</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Click here to expand and analyze real-time cron script notification history logs.</p>
                                </div>
                            </div>

                            {/* Dynamic Interactive Arrow Spinning Based on Active Open State Toggle */}
                            <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm">
                                    {(() => {
                                        if (typeof isEmailLogExpanded !== 'undefined' ? isEmailLogExpanded : window.isEmailLogExpanded) return 'Hide Logs';
                                        return 'View Logs';
                                    })()}
                                </span>
                                <span className={`text-slate-400 font-extrabold text-sm transition-transform duration-200 transform ${(typeof isEmailLogExpanded !== 'undefined' ? isEmailLogExpanded : window.isEmailLogExpanded) ? 'rotate-180' : 'rotate-0'
                                    }`}>
                                    ▼
                                </span>
                            </div>
                        </button>

                        {/* HIDDEN INLINE CONTENT EXPANDING WITH TRANSITION BOUNDS */}
                        {(typeof isEmailLogExpanded !== 'undefined' ? isEmailLogExpanded : window.isEmailLogExpanded) && (
                            <div className="p-6 border-t border-slate-100 bg-white animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="overflow-x-auto border border-slate-100 rounded-xl shadow-inner bg-slate-50/30">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                                                <th className="p-3.5 pl-4">Log ID</th>
                                                <th className="p-3.5">Dispatched Execution Date</th>
                                                <th className="p-3.5">Target Destination Address</th>
                                                <th className="p-3.5 text-center">Consolidated Records Track Count</th>
                                                <th className="p-3.5 text-center">System Integration Check status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-600 bg-white">
                                            {emailHistoryLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="p-6 text-center text-slate-400 font-medium">No system dynamic automation emails triggered or archived yet.</td>
                                                </tr>
                                            ) : (
                                                emailHistoryLogs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="p-3.5 pl-4 font-bold text-slate-400">#LOG-00{log.id}</td>
                                                        <td className="p-3.5 text-slate-900">{formatDate(log.sent_date)}</td>
                                                        <td className="p-3.5 text-slate-600 font-semibold">{log.recipient_email}</td>
                                                        <td className="p-3.5 text-center">
                                                            <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-md font-bold">
                                                                {log.record_count} Notice records
                                                            </span>
                                                        </td>
                                                        <td className="p-3.5 text-center">
                                                            <span className="inline-flex items-center text-[10px] font-extrabold bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-1 rounded uppercase shadow-inner">
                                                                ✓ Log Dispatched
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}


                {/* DIRECTORY MASTER HEADINGS AND EXPORT TOOLS */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pt-2">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Corporate Notice Directory</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Real-time notice handling logs without page reloads</p>
                    </div>
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                        {/* Dynamic Export Control Node Triggers */}
                        <button onClick={() => triggerExport('excel')} className="flex-1 lg:flex-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition">Export Excel</button>
                        <button onClick={() => triggerExport('pdf')} className="flex-1 lg:flex-none bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition">Export PDF</button>
                        {isAdmin && <button onClick={openAddModal} className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl shadow-md transition">+ Add Notice</button>}
                    </div>
                </div>


                {/* MODERN MULTI-PARAMETER ADVANCED FILTERS PANEL */}
                < div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 space-y-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">🔎 Advanced Filter Console</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Parameter 1: Company Profile Text Search with Native X Clear Button */}
                        <div className="relative w-full">
                            {/* Search Lens Icon */}
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 text-sm">
                                🔍
                            </span>

                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search Company profile..."
                                className="w-full pl-10 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 shadow-inner"
                            />

                            {/* Dynamic 'X' Clear Trigger Option Inside Box Boundary */}
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-red-700 font-bold text-base transition-colors duration-120"
                                    title="Clear text query"
                                >

                                    <span className="text-sm font-bold leading-none select-none">✕</span>
                                </button>
                            )}
                        </div>

                        {/* 2. Notice Type Dropdown Filter with Clear Button */}
                        <div className="relative w-full">
                            <select
                                value={noticeType}
                                onChange={(e) => setNoticeType(e.target.value)}
                                className="w-full py-2 pl-3 pr-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-600 appearance-none"
                            >
                                <option value="">All Notice Categories</option>
                                {uniqueNoticeTypes.map((type, idx) => (
                                    <option key={idx} value={type}>{type}</option>
                                ))}
                            </select>
                            {/* Combined Dynamic Control Area ensuring zero overlapping */}
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1.5">
                                {noticeType && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setNoticeType('');
                                        }}
                                        className=" text-slate-400 hover:text-slate-600 transition-colors duration-150 flex items-center justify-center p-5"
                                        title="Clear filter"
                                    >
                                        <span className="text-sm font-extrabold leading-none select-none">✕</span>
                                    </button>
                                )}
                                <span className="text-slate-400 text-[10px] leading-none select-none"></span>
                            </div>
                        </div>
                        {/* Parameter 3: Filing Status Dropdown Filter */}
                        <div className='relative w-full'>
                            <select
                                value={filingStatus}
                                onChange={(e) => setFilingStatus(e.target.value)}
                                className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-600"
                            >
                                <option value="">All Filing Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="filed">Filed</option>
                                <option value="not needed">Not Needed</option>
                            </select>

                            {/* Combined Dynamic Control Area ensuring zero overlapping */}
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1.5">
                                {filingStatus && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setFilingStatus('');
                                        }}
                                        className="text-slate-400 hover:text-slate-600 transition-colors duration-150 flex items-center justify-center p-5"
                                        title="Clear filter"
                                    >
                                        <span className="text-sm font-extrabold leading-none select-none">✕</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter Reset Controller */}
                        <div>
                            <button
                                onClick={clearAllFilters}
                                className="w-full py-2 px-4 text-sm font-semibold border border-slate-200 hover:bg-slate-50 rounded-xl transition duration-150 text-slate-500"
                            >
                                Reset Search Parameters
                            </button>
                        </div>

                        {/* NEW COMPONENT DYNAMIC FLOATING CONSOLE FOR BULK STATUS UPDATES */}
                        {isAdmin && selectedIds.length > 0 && (
                            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white border border-slate-200 rounded-2xl shadow-xl p-4">
                                <span className="text-sm font-semibold text-slate-700">
                                    Selected rows: {selectedIds.length}
                                </span>

                                <button
                                    onClick={() => handleBulkStatusSubmit("filed")}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition shadow-sm"
                                >
                                    Mark Filed
                                </button>

                                <button
                                    onClick={() => handleBulkStatusSubmit("pending")}
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition shadow-sm"
                                >
                                    Mark Pending
                                </button>

                                <button
                                    onClick={() => handleBulkStatusSubmit("not needed")}
                                    className="bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition shadow-sm"
                                >
                                    Mark Not Needed
                                </button>

                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="text-slate-500 hover:text-slate-700 text-xs font-bold underline px-2"
                                >
                                    Deselect All
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-slate-400 font-medium self-end md:self-center">
                        Showing page {notices.current_page || 1} of {notices.last_page || 1} ({notices.total || 0} records total)
                    </div>
                </div>


                {/* ULTRA-RESPONSIVE DATA TABLE SECTION */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                    <div className="overflow-x-auto">
                        {/* ULTRA-RESPONSIVE MODERN GRID COMPONENT CONTAINER */}

                        {/* DESKTOP ENGINE GRID GRID HEADER (Dynamic columns based on role) (Visible only on medium screens and up) */}
                        <div className={`hidden md:grid bg-slate-50/70 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider p-4 ${isAdmin ? 'md:grid-cols-9' : 'md:grid-cols-7'
                            }`}
                        >
                            {isAdmin && (
                                <div className="hidden md:flex items-center justify-center text-center pl-4">
                                    <input
                                        type="checkbox"
                                        checked={
                                            noticeDataArray.length > 0 &&
                                            selectedIds.length === noticeDataArray.length
                                        }
                                        onChange={handleSelectAllRows}
                                    />
                                </div>
                            )}
                            <div className="w-12">Sl. No.</div> {/* New Serial Number Column */}
                            <div>Company Profile</div>
                            <div>Notice Category</div>
                            <div>Notice Date</div>
                            <div>Notice Post Date</div>
                            <div>Alert Trigger</div>
                            <div>Filing Status</div>

                            {/* Clean Check: Sirf Admin ko hi header title dikhega */}
                            {isAdmin && <div className="text-center">Control Actions</div>}
                        </div>

                        {/* DATA CONTAINER WORKSPACE */}
                        <div className="divide-y divide-slate-100">
                            {noticeDataArray.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 font-medium">
                                    No notice records discovered inside directory database.
                                </div>
                            ) : (
                                noticeDataArray.map((notice, index) => {
                                    // Paginated Serial Number Equation Math Logic
                                    const currentPage = notices.current_page || 1;
                                    const perPage = notices.per_page || 10;
                                    const serialNumber = (currentPage - 1) * perPage + index + 1;

                                    return (
                                        <div
                                            key={notice.id}
                                            className={`grid grid-cols-1 items-center gap-2 md:gap-0 p-4 pl-5 transition duration-150 ${getRowBgClass(notice)} ${isAdmin ? 'md:grid-cols-9' : 'md:grid-cols-7'
                                                }`}
                                        >
                                            {isAdmin && (
                                                <div className="hidden md:flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(notice.id)}
                                                        onChange={() => handleSelectRow(notice.id)}
                                                    />
                                                </div>
                                            )}
                                            {/* DYNAMIC COLUMN: Sl. No. */}
                                            <div className="flex justify-between md:block">
                                                <span className="md:hidden text-xs font-bold uppercase text-slate-400">Sl. No.:</span>
                                                <span className="text-sm font-bold text-slate-500 w-12">{serialNumber}</span>
                                            </div>
                                            {/* COLUMN 1: Company Profile */}
                                            <div className="flex justify-between md:block">
                                                <span className="md:hidden text-xs font-bold uppercase text-slate-400">Company:</span>
                                                <span className="font-semibold text-slate-900 text-sm">{notice.company_name}</span>
                                            </div>

                                            {/* COLUMN 2: Notice Category */}
                                            <div className="flex justify-between md:block">
                                                <span className="md:hidden text-xs font-bold uppercase text-slate-400">Category:</span>
                                                <span>
                                                    <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium inline-block">
                                                        {notice.notice_type}
                                                    </span>
                                                </span>
                                            </div>

                                            {/* COLUMN 3: Notice Date */}
                                            <div className="flex justify-between md:block">
                                                <span className="md:hidden text-xs font-bold uppercase text-slate-400">Notice Date:</span>
                                                <span className="text-sm font-medium text-slate-900">{formatDate(notice.notice_date)}</span>
                                            </div>

                                            {/* COLUMN 4: Notice Post Date */}
                                            <div className="flex justify-between md:block">
                                                <span className="md:hidden text-xs font-bold uppercase text-slate-400">Post Date:</span>
                                                <span className="text-sm text-slate-600">{formatDate(notice.notice_post_date)}</span>
                                            </div>

                                            {/* COLUMN 5: Alert Trigger (Dynamic Target Date & Due Counter Calculation) */}
                                            <div className="flex justify-between md:block">
                                                <span className="md:hidden text-xs font-bold uppercase text-slate-400">Trigger:</span>
                                                <div className="text-sm font-semibold space-y-0.5">
                                                    {(() => {
                                                        if (!notice.notice_date) return <span className="text-slate-400">-</span>;

                                                        // 1. Calculate Target Alert Trigger Date (Notice Date + Notify Days)
                                                        const noticeDate = new Date(notice.notice_date);
                                                        const notifyDays = parseInt(notice.notify_day) || 0;
                                                        const targetDate = new Date(noticeDate);
                                                        targetDate.setDate(targetDate.getDate() + notifyDays);

                                                        // Format target date as dd-mm-yyyy for clean display
                                                        const day = String(targetDate.getDate()).padStart(2, '0');
                                                        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
                                                        const year = targetDate.getFullYear();
                                                        const formattedTargetDate = `${day}-${month}-${year}`;

                                                        // 2. Calculate remaining or overdue days relative to today
                                                        const today = new Date();
                                                        today.setHours(0, 0, 0, 0);
                                                        targetDate.setHours(0, 0, 0, 0);

                                                        const timeDiff = targetDate.getTime() - today.getTime();
                                                        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

                                                        // 3. Status Badge Render Logic
                                                        let statusBadge = null;
                                                        if (notice.filing_status === 'filed' || notice.filing_status === 'not needed') {
                                                            statusBadge = <span className="text-[10px] text-slate-400 font-normal">(Inactive)</span>;
                                                        } else if (daysDiff < 0) {
                                                            statusBadge = <span className="text-rose-600 text-xs font-black block">⚠️ {Math.abs(daysDiff)} Days Overdue</span>;
                                                        } else if (daysDiff === 0) {
                                                            statusBadge = <span className="text-amber-600 text-xs font-black block animate-pulse">⏰ Triggering Today</span>;
                                                        } else {
                                                            statusBadge = <span className="text-emerald-600 text-xs font-bold block">⏳ In {daysDiff} Days</span>;
                                                        }

                                                        return (
                                                            <div className="space-y-0.5">
                                                                <div className="text-indigo-600 font-bold">{formattedTargetDate}</div>
                                                                <div className="text-xs text-slate-400 font-medium">({notice.notify_day} days setup)</div>
                                                                <div>{statusBadge}</div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>


                                            {/* COLUMN 6: Filing Status */}
                                            <div className="flex justify-between md:block">
                                                <span className="md:hidden text-xs font-bold uppercase text-slate-400">Status:</span>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5">
                                                    {isAdmin ? (
                                                        <select
                                                            value={notice.filing_status}
                                                            onChange={(e) => handleStatusChange(notice.id, e.target.value)}
                                                            className="text-xs font-semibold bg-white rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 pl-3 pr-8"
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="filed">Filed</option>
                                                            <option value="not needed">Not Needed</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${notice.filing_status === 'filed' ? 'bg-emerald-50 text-emerald-700' :
                                                            notice.filing_status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {(notice.filing_status || 'pending').toUpperCase()}
                                                        </span>
                                                    )}

                                                </div>
                                                {/* Dynamic Priority Alert Badge Overlay */}
                                                {notice.filing_status === 'pending' && (() => {
                                                    const today = new Date(); today.setHours(0, 0, 0, 0);
                                                    const target = new Date(notice.notice_date);
                                                    target.setDate(target.getDate() + (parseInt(notice.notify_day) || 0));
                                                    target.setHours(0, 0, 0, 0);
                                                    return today >= target ? (
                                                        <span className="inline-flex items-center text-[10px] font-extrabold bg-rose-600 text-white px-2 py-0.5 rounded shadow-sm tracking-wider uppercase animate-bounce">
                                                            ⚠️ OVERDUE CRITICAL
                                                        </span>
                                                    ) : null;
                                                })()}
                                            </div>


                                            {/* COLUMN 7: Admin Control Actions */}
                                            {isAdmin && (
                                                <div className="flex justify-between md:justify-center items-center pt-2 md:pt-0 border-t border-dashed border-slate-100 md:border-0 gap-4">
                                                    <span className="md:hidden text-xs font-bold uppercase text-slate-400">Actions:</span>
                                                    <div className="space-x-4">
                                                        <button onClick={() => openEditModal(notice)} className="text-blue-600 hover:text-blue-800 font-bold text-sm transition">Edit</button>
                                                        <button onClick={() => handleDelete(notice.id)} className="text-rose-600 hover:text-rose-800 font-bold text-sm transition">Delete</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })

                            )}
                        </div>

                    </div>
                </div>



                {/* MODAL LIGHTBOX LAYOUT */}


                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">
                                    {isEditMode ? 'Modify Notice Log' : 'Add New Notice Profile'}
                                </h2>

                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 text-2xl font-semibold"
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">

                                <div>
                                    <label className="block mb-1 text-sm font-medium">
                                        Company Name
                                    </label>

                                    <input
                                        type="text"
                                        value={data.company_name}
                                        onChange={(e) =>
                                            setData('company_name', e.target.value)
                                        }
                                        className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        placeholder="e.g. Acme Corporation"
                                        required
                                    />

                                    {errors.company_name && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.company_name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block mb-1 text-sm font-medium">
                                        Notice Type
                                    </label>

                                    <input
                                        type="text"
                                        value={data.notice_type}
                                        onChange={(e) =>
                                            setData('notice_type', e.target.value)
                                        }
                                        className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        placeholder="e.g. Audit Compliance"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block mb-1 text-sm font-medium">
                                        Notice Date
                                    </label>

                                    <input
                                        type="date"
                                        value={data.notice_date}
                                        onChange={(e) =>
                                            setData('notice_date', e.target.value)
                                        }
                                        // Pure field box par kahin bhi touch ya click hone par calendar toggle hoga
                                        onClick={(e) => {
                                            if (typeof e.target.showPicker === 'function') {
                                                e.target.showPicker();
                                            }
                                        }}
                                        className="w-full cursor-pointer rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block mb-1 text-sm font-medium">
                                        Notice Post Date
                                    </label>

                                    <input
                                        type="date"
                                        value={data.notice_post_date}
                                        onChange={(e) =>
                                            setData('notice_post_date', e.target.value)
                                        }
                                        // Pure field box par kahin bhi touch ya click hone par calendar toggle hoga
                                        onClick={(e) => {
                                            if (e.target.showPicker) {
                                                e.target.showPicker();
                                            }
                                        }}
                                        className="w-full cursor-pointer rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block mb-1 text-sm font-medium">
                                        Notify Target (Days After Notice Date)
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        value={data.notify_day}
                                        onChange={(e) =>
                                            setData(
                                                'notify_day',
                                                e.target.value === ''
                                                    ? ''
                                                    : parseInt(e.target.value, 10)
                                            )
                                        }
                                        className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        placeholder="e.g. 15 or 30 days" required
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                                    >
                                        {processing
                                            ? 'Saving...'
                                            : isEditMode
                                                ? 'Apply Updates'
                                                : 'Save Notice'}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                )}

                {/* SECONDARY MODAL WINDOW LAYER: CHANGE PASSWORD OVERLAY */}

                {isPasswordModalOpen && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-lg font-bold">
                                    Change Password
                                </h2>

                                <button
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="text-slate-400 text-xl"
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.data.current_password}
                                        onChange={(e) =>
                                            passwordForm.setData('current_password', e.target.value)
                                        }
                                        className="w-full rounded-xl border-slate-200"
                                    />
                                </div>
                                {passwordForm.errors.current_password && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {passwordForm.errors.current_password}
                                    </p>
                                )}



                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.data.password}
                                        onChange={(e) =>
                                            passwordForm.setData('password', e.target.value)
                                        }
                                        className="w-full rounded-xl border-slate-200"
                                    />
                                </div>
                                {passwordForm.errors.password && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {passwordForm.errors.password}
                                    </p>
                                )}

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.data.password_confirmation}
                                        onChange={(e) =>
                                            passwordForm.setData(
                                                'password_confirmation',
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-xl border-slate-200"
                                    />
                                </div>
                                {passwordForm.errors.password_confirmation && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {passwordForm.errors.password_confirmation}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    className="w-full bg-blue-600 text-white py-2 rounded-xl"
                                >
                                    Update Password
                                </button>
                            </form>
                        </div>
                    </div>
                )}
                {/* LATEST ULTRA-MODERN FLOATING TOAST NOTIFICATION GRAPHIC COMPONENT SYSTEM */}
                {/* THE LATEST PREMIUM GLASSMORPHISM GLOW TOAST POPUP */}
                {toast.visible && (
                    <div
                        className={`fixed top-6 right-6 z-[99999] max-w-md w-full rounded-2xl border p-4 flex items-center justify-between shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-bottom-5 duration-300 ${toast.type === 'success'
                            ? 'bg-emerald-900/95 border-emerald-500/30 text-white shadow-emerald-950/20'
                            : toast.type === 'error'
                                ? 'bg-rose-900/95 border-rose-500/30 text-white shadow-rose-950/20'
                                : 'bg-slate-900/95 border-slate-500/30 text-white shadow-slate-950/20'
                            }`}
                    >
                        {/* INNER METRIC FLEX ROW CONTAINER */}
                        <div className="flex items-center space-x-4 flex-1 min-w-0">

                            {/* VIBRANT GLOW STATUS INDICATOR ICON BOX */}
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl font-black shadow-inner relative overflow-hidden shrink-0 ${toast.type === 'success' ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-900' :
                                toast.type === 'error' ? 'bg-gradient-to-br from-rose-400 to-pink-500 text-slate-900' :
                                    'bg-gradient-to-br from-blue-400 to-indigo-500 text-slate-900'
                                }`}>
                                {/* Visual pulse glow backing circle */}
                                <span className="absolute inset-0 bg-white/20 animate-ping rounded-full scale-75" />

                                <span className="relative z-10 leading-none">
                                    {toast.type === 'success' && '✓'}
                                    {toast.type === 'error' && '✕'}
                                    {toast.type === 'info' && '🔔'}
                                </span>
                            </div>

                            {/* CONTENT CONTEXT HEADING AND STATUS LAYERS */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none">
                                    {toast.type === 'success' ? '✔ OPERATION SUCCESSFUL' : toast.type === 'error' ? '🚨 ATTENTION REQUIRED' : '💡 CORE CONSOLE ALERT'}
                                </p>
                                <p className="text-sm font-bold leading-tight mt-1 text-white/95">
                                    {toast.message}
                                </p>
                            </div>
                        </div>

                        {/* ULTRA-MODERN SMOOTH DISMISS CONTROL OVERLAY CHECK */}
                        <button
                            type="button"
                            onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
                            className="ml-4 shrink-0 w-7 h-7 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-white/20"
                            title="Dismiss message log"
                        >
                            <span className="text-sm font-black leading-none select-none">✕</span>
                        </button>

                        {/* DYNAMIC TIMELINE STATUS PROGRESS STRIP (Slick countdown line) */}
                        <div
                            className={`absolute bottom-0 left-0 h-1 rounded-b-2xl transition-all duration-4000 linear ${toast.type === 'success' ? 'bg-emerald-400' :
                                toast.type === 'error' ? 'bg-rose-400' : 'bg-blue-400'
                                }`}
                            style={{
                                width: '100%',
                                animation: 'toastProgress 4000ms linear forwards'
                            }}
                        />
                    </div>
                )}


            </div>
        </div >

    )
};

