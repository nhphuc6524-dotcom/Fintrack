
import React, { useState, useEffect, useMemo } from 'react';
import { Expense, AppTab } from './types';
import { CATEGORIES } from './constants';
import { getFinancialAdvice } from './services/geminiService';

const App: React.FC = () => {
  // State quản lý dữ liệu
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [budget, setBudget] = useState<number>(() => {
    const saved = localStorage.getItem('budget');
    return saved ? parseInt(saved, 10) : 5000000;
  });

  // State giao diện
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].label);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('budget', budget.toString());
  }, [budget]);

  // Helpers
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const totalSpend = useMemo(() => expenses.reduce((acc, curr) => acc + curr.amount, 0), [expenses]);
  
  const categoryData = useMemo(() => {
    return CATEGORIES.map(cat => {
      const total = expenses
        .filter(e => e.category === cat.label)
        .reduce((sum, e) => sum + e.amount, 0);
      return { ...cat, total };
    }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  }, [expenses]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount, 10);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError("Số tiền không hợp lệ!");
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: numAmount,
      category,
      date,
      note: note.trim() || 'Không ghi chú'
    };

    setExpenses(prev => [newExpense, ...prev]);
    setAmount('');
    setNote('');
    setError('');
    showToast("Đã thêm chi tiêu!");
  };

  const deleteExpense = (id: string) => {
    if(window.confirm("Xóa giao dịch này?")) {
      setExpenses(prev => prev.filter(e => e.id !== id));
      showToast("Đã xóa giao dịch", "error");
    }
  };

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const advice = await getFinancialAdvice(expenses, budget);
      setAiAdvice(advice);
    } catch (err) {
      setAiAdvice("Lỗi AI rồi!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const budgetPercent = Math.min(Math.round((totalSpend / budget) * 100), 100);

  return (
    <div className="h-screen w-full flex items-center justify-center p-0 sm:p-6 lg:p-8">
      {/* Mockup Frame cho máy tính */}
      <div className="h-full w-full max-w-md bg-white relative flex flex-col shadow-[0_40px_100px_-20px_rgba(79,70,229,0.3)] sm:rounded-[3.5rem] overflow-hidden sm:border-[8px] border-slate-900 animate-app-entry">
        
        {/* Tai thỏ/Loa giả lập điện thoại */}
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-[60]"></div>

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl text-white font-bold text-sm animate-bounce flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
            <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <header className="bg-gradient-to-br from-indigo-700 via-blue-600 to-violet-800 text-white pt-12 pb-14 px-8 rounded-b-[3.5rem] shadow-xl relative transition-all duration-500 flex-shrink-0">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
                <i className="fas fa-wallet text-teal-300"></i> FINTRACK AI
              </h1>
              <div className="flex items-center gap-2 bg-black/20 py-1 px-3 rounded-full text-[9px] font-black tracking-widest uppercase border border-white/10">
                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse"></span>
                Cloud Sync
              </div>
            </div>

            <div className="text-center">
              {activeTab === 'home' ? (
                <>
                  <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">Chi tiêu tháng này</p>
                  <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tighter">
                    {totalSpend.toLocaleString('vi-VN')}
                    <span className="text-lg font-light ml-1 opacity-60">đ</span>
                  </h2>
                  <div className="max-w-[220px] mx-auto space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase opacity-80">
                      <span>Ngân sách</span>
                      <span>{budgetPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden border border-white/10">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out rounded-full ${budgetPercent > 90 ? 'bg-red-400' : 'bg-teal-400'}`}
                        style={{ width: `${budgetPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </>
              ) : activeTab === 'stats' ? (
                <h2 className="text-3xl font-black tracking-tight">Phân Tích Thống Kê</h2>
              ) : (
                <h2 className="text-3xl font-black tracking-tight">Cấu Hình Ứng Dụng</h2>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 -mt-10 pb-32 overflow-y-auto no-scrollbar relative z-20">
          {activeTab === 'home' && (
            <div className="space-y-6 animate-slide-up py-4">
              <section className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 p-6 border border-slate-50">
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Số tiền chi tiêu</label>
                    <div className="relative group">
                      <input
                        type="text" inputMode="numeric" value={amount}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^[0-9\b]+$/.test(val)) setAmount(val);
                        }}
                        placeholder="0"
                        className="w-full pl-6 pr-14 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[1.8rem] outline-none transition-all text-3xl font-black text-slate-800"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">VND</span>
                    </div>
                    {error && <p className="text-red-500 text-[10px] font-bold ml-2 mt-1">{error}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <select 
                        value={category} onChange={(e) => setCategory(e.target.value)}
                        className="w-full pl-5 pr-10 py-4 bg-slate-50 rounded-2xl appearance-none font-bold text-slate-700 outline-none focus:ring-2 ring-indigo-100 transition-all text-sm border border-transparent"
                      >
                        {CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                      </select>
                      <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 text-[10px] pointer-events-none"></i>
                    </div>
                    <input 
                      type="date" value={date} onChange={(e) => setDate(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 ring-indigo-100 transition-all text-sm border border-transparent"
                    />
                  </div>

                  <input 
                    type="text" value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú (Mua gì...)"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-indigo-100 transition-all text-sm font-medium border border-transparent"
                  />

                  <button type="submit" className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-black py-5 rounded-[1.8rem] shadow-xl shadow-slate-200 transition-all transform active:scale-95 flex items-center justify-center gap-3">
                    <i className="fas fa-plus-circle"></i> THÊM VÀO SỔ
                  </button>
                </form>
              </section>

              {/* AI Insight Box */}
              <section className="bg-indigo-900 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                 <div className="flex justify-between items-center mb-4 relative z-10">
                    <h3 className="font-black text-[10px] uppercase tracking-widest flex items-center gap-2 text-teal-400">
                      <i className="fas fa-robot"></i> Trợ lý AI Phân Tích
                    </h3>
                    <button 
                      onClick={handleAiAnalysis} disabled={isAnalyzing}
                      className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all border border-white/10 backdrop-blur-sm"
                    >
                      {isAnalyzing ? 'Đang đọc số liệu...' : 'Phân tích ngay'}
                    </button>
                 </div>
                 <div className="text-xs leading-relaxed font-medium text-indigo-100 whitespace-pre-wrap relative z-10">
                    {aiAdvice || "AI sẽ giúp bạn nhận xét thói quen chi tiêu và gợi ý cách tiết kiệm tiền dựa trên dữ liệu thật của bạn."}
                 </div>
              </section>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6 animate-slide-up py-4">
              <section className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-slate-100">
                <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                  <i className="fas fa-chart-line"></i> Biểu đồ hạng mục
                </h3>
                <div className="space-y-6">
                  {categoryData.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200 text-2xl">
                        <i className="fas fa-folder-open"></i>
                      </div>
                      <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest">Không có dữ liệu</p>
                    </div>
                  ) : (
                    categoryData.map(cat => (
                      <div key={cat.label} className="space-y-2 group">
                        <div className="flex justify-between items-end">
                          <div className="flex items-center gap-3">
                             <span className={`w-9 h-9 rounded-xl ${cat.bg} text-white flex items-center justify-center text-xs shadow-md shadow-indigo-100`}>{cat.icon}</span>
                             <span className="font-bold text-slate-700 text-sm">{cat.label}</span>
                          </div>
                          <div className="text-right">
                             <p className="font-black text-slate-900 text-sm leading-none">{cat.total.toLocaleString('vi-VN')}đ</p>
                             <p className="text-[9px] font-bold text-slate-400">{Math.round((cat.total/totalSpend)*100)}%</p>
                          </div>
                        </div>
                        <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 group-hover:brightness-110`} 
                            style={{ width: `${(cat.total / totalSpend) * 100}%`, backgroundColor: cat.color }}
                          ></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-2">Giao dịch gần đây</h3>
              <div className="space-y-3 pb-4">
                {expenses.map(exp => (
                  <div key={exp.id} className="bg-white p-4 rounded-[1.8rem] border border-slate-50 flex items-center justify-between group hover:border-indigo-200 transition-all hover:shadow-lg hover:shadow-indigo-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${CATEGORIES.find(c => c.label === exp.category)?.bg || 'bg-slate-500'} text-white shadow-sm`}>
                        {CATEGORIES.find(c => c.label === exp.category)?.icon || <i className="fas fa-receipt"></i>}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-sm leading-tight">{exp.category}</h4>
                        <p className="text-[10px] font-bold text-slate-400">{exp.date} • <span className="italic">{exp.note}</span></p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-black text-slate-900 text-sm">-{exp.amount.toLocaleString('vi-VN')}đ</span>
                      <button onClick={() => deleteExpense(exp.id)} className="text-slate-100 group-hover:text-red-400 transition-colors mt-1 p-1">
                        <i className="fas fa-trash-alt text-[9px]"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 animate-slide-up py-4">
              <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                 <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                   <i className="fas fa-bullseye"></i> Mục tiêu ngân sách
                 </h3>
                 <div className="space-y-6 text-center">
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-indigo-50 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Hạn mức chi tiêu tối đa</p>
                      <div className="flex items-baseline justify-center gap-2">
                        <input 
                          type="number" value={budget} 
                          onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
                          className="w-full text-center bg-transparent text-4xl font-black text-slate-900 outline-none"
                        />
                        <span className="text-slate-400 font-bold">đ</span>
                      </div>
                      <p className="text-[10px] font-bold text-indigo-500 mt-4 bg-indigo-50 px-3 py-1 rounded-full inline-block">
                        Số dư an toàn: {(budget - totalSpend).toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                       <button 
                         onClick={() => { if(confirm("Xóa toàn bộ dữ liệu?")) setExpenses([]); }}
                         className="w-full py-5 text-red-500 font-black text-xs hover:bg-red-50 rounded-[1.8rem] transition-all flex items-center justify-center gap-2 border border-red-50"
                       >
                          <i className="fas fa-trash"></i> LÀM TRỐNG DỮ LIỆU CÀI LẠI
                       </button>
                    </div>
                 </div>
              </section>
              <div className="text-center">
                <p className="text-slate-300 text-[9px] font-black uppercase tracking-[0.3em]">FinTrack AI v2.5</p>
                <p className="text-slate-200 text-[8px] mt-1 font-bold">Powered by Google Gemini 3 Flash</p>
              </div>
            </div>
          )}
        </main>

        {/* Tab Bar */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-100 flex justify-around items-center px-4 py-5 z-50">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'home' ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-400'}`}
          >
            <div className={`w-14 h-9 flex items-center justify-center rounded-2xl transition-all ${activeTab === 'home' ? 'bg-indigo-50 shadow-inner' : ''}`}>
              <i className="fas fa-edit text-lg"></i>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Sổ tay</span>
          </button>

          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'stats' ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-400'}`}
          >
            <div className={`w-14 h-9 flex items-center justify-center rounded-2xl transition-all ${activeTab === 'stats' ? 'bg-indigo-50 shadow-inner' : ''}`}>
              <i className="fas fa-chart-bar text-lg"></i>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Báo cáo</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'settings' ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-400'}`}
          >
            <div className={`w-14 h-9 flex items-center justify-center rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-indigo-50 shadow-inner' : ''}`}>
              <i className="fas fa-sliders-h text-lg"></i>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Ví</span>
          </button>
        </nav>

        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes appEntry {
            from { opacity: 0; transform: scale(0.9) translateY(40px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          .animate-slide-up {
            animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .animate-app-entry {
            animation: appEntry 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          input[type="number"]::-webkit-inner-spin-button, 
          input[type="number"]::-webkit-outer-spin-button { 
            -webkit-appearance: none; margin: 0; 
          }
          body { overscroll-behavior-y: contain; }
        `}</style>
      </div>
    </div>
  );
};

export default App;
