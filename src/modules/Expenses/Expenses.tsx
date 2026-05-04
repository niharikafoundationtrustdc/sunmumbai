import React, { useState, useEffect } from 'react';
import { 
  TrendingDown, 
  Plus, 
  Search, 
  Calendar, 
  DollarSign, 
  Tag, 
  FileText, 
  X, 
  Save, 
  Edit2, 
  Trash2,
  AlertCircle,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { cn, formatDate } from '../../lib/utils';

interface ExpenseRecord {
  id: string;
  item_name: string;
  category: string;
  amount: number;
  date: string;
  payee: string;
  payment_method: string;
  receipt_no: string;
  remarks: string;
}

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<Partial<ExpenseRecord>>({
    item_name: '',
    category: 'Utilities',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    payee: '',
    payment_method: 'Cash',
    receipt_no: '',
    remarks: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (data) setExpenses(data);
    setIsLoading(false);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('expenses').upsert([formData]);
      if (error) throw error;
      setIsModalOpen(false);
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const filteredExpenses = expenses.filter(e => 
    e.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.payee.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Expense Management</h1>
          <p className="text-slate-500 font-medium">Track operational costs and expenditures.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Log New Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-primary/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Monthly Expenses</p>
            <p className="text-2xl font-black text-slate-800">₹{(expenses || []).reduce((acc, curr) => acc + (curr.amount || 0), 0)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-primary/10 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search expenses by item, category or payee..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-primary/10 shadow-sm overflow-hidden text-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary/5 border-b border-primary/10">
                <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">Item / Payee</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">Category</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">Amount</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">Date</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map(expense => (
                <tr key={expense.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{expense.item_name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">to: {expense.payee}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black uppercase text-slate-500">{expense.category}</span>
                  </td>
                  <td className="px-6 py-4 font-black text-rose-600">₹{expense.amount}</td>
                  <td className="px-6 py-4 font-bold text-slate-500">{formatDate(expense.date)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-primary hover:bg-white rounded-lg"><Edit2 className="w-4 h-4"/></button>
                      <button className="p-2 text-rose-500 hover:bg-white rounded-lg"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden">
               <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-primary/5">
                <h2 className="text-2xl font-black text-primary">Log New Expense</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl"><X className="w-6 h-6 text-slate-400"/></button>
               </div>
               <div className="p-8 space-y-4">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Item / Service Name</label>
                   <input type="text" placeholder="e.g. Electricity Bill Jul 2024" className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold text-sm" value={formData.item_name} onChange={(e) => setFormData({...formData, item_name: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
                    <select className="w-full px-4 py-3 bg-slate-50 rounded-xl" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                      <option>Utilities</option>
                      <option>Salaries</option>
                      <option>Maintenance</option>
                      <option>Marketing</option>
                      <option>Inventory</option>
                      <option>Rent</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount (₹)</label>
                    <input type="number" className="w-full px-4 py-3 bg-slate-50 rounded-xl" value={formData.amount} onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} />
                  </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</label>
                    <input type="date" className="w-full px-4 py-3 bg-slate-50 rounded-xl" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payee Name</label>
                    <input type="text" placeholder="e.g. JVVNL Rajasthan" className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold text-sm" value={formData.payee} onChange={(e) => setFormData({...formData, payee: e.target.value})} />
                  </div>
                 </div>
               </div>
               <div className="p-8 bg-slate-50 flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-500">Cancel</button>
                <button onClick={handleSave} className="px-8 py-3 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-rose-600 transition-all">Record Expense</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
