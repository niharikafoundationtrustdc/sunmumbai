import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
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
  Filter,
  Download,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { cn, formatDate } from '../../lib/utils';

interface IncomeRecord {
  id: string;
  source: string;
  category: string;
  amount: number;
  date: string;
  payment_method: string;
  reference_no: string;
  remarks: string;
}

export const Income: React.FC = () => {
  const [incomeList, setIncomeList] = useState<IncomeRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<Partial<IncomeRecord>>({
    source: '',
    category: 'Other',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    reference_no: '',
    remarks: ''
  });

  useEffect(() => {
    fetchIncome();
  }, []);

  const fetchIncome = async () => {
    const { data } = await supabase.from('income').select('*').order('date', { ascending: false });
    if (data) setIncomeList(data);
    setIsLoading(false);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('income').upsert([formData]);
      if (error) throw error;
      setIsModalOpen(false);
      fetchIncome();
    } catch (error) {
      console.error('Error saving income:', error);
    }
  };

  const filteredIncome = incomeList.filter(i => 
    i.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.reference_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Income Tracking</h1>
          <p className="text-slate-500 font-medium">Monitor all non-fee revenue sources.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Add New Income
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-primary/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Monthly Income</p>
            <p className="text-2xl font-black text-slate-800">₹{(incomeList || []).reduce((acc, curr) => acc + (curr.amount || 0), 0)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-primary/10 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search income by source or category..." 
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
                <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">Source</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">Category</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">Amount</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">Date</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIncome.map(income => (
                <tr key={income.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{income.source}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{income.reference_no}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black uppercase text-slate-500">{income.category}</span>
                  </td>
                  <td className="px-6 py-4 font-black text-green-600">₹{income.amount}</td>
                  <td className="px-6 py-4 font-bold text-slate-500">{formatDate(income.date)}</td>
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
                <h2 className="text-2xl font-black text-primary">Add Income Record</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl"><X className="w-6 h-6 text-slate-400"/></button>
               </div>
               <div className="p-8 space-y-4">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Income Source</label>
                   <input type="text" className="w-full px-4 py-3 bg-slate-50 rounded-xl" value={formData.source} onChange={(e) => setFormData({...formData, source: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
                    <select className="w-full px-4 py-3 bg-slate-50 rounded-xl" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                      <option>Donation</option>
                      <option>Grant</option>
                      <option>Rent</option>
                      <option>Sales</option>
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
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
                    <select className="w-full px-4 py-3 bg-slate-50 rounded-xl" value={formData.payment_method} onChange={(e) => setFormData({...formData, payment_method: e.target.value})}>
                      <option>Cash</option>
                      <option>Bank</option>
                      <option>UPI</option>
                    </select>
                  </div>
                 </div>
               </div>
               <div className="p-8 bg-slate-50 flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-500">Cancel</button>
                <button onClick={handleSave} className="px-8 py-3 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20">Save Income</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
