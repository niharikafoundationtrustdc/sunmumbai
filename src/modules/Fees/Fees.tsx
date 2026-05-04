import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Plus, 
  Receipt, 
  DollarSign, 
  Calendar, 
  User, 
  Hash, 
  CheckCircle2, 
  X, 
  Save, 
  Printer, 
  Edit2, 
  Trash2,
  AlertCircle,
  FileText,
  Download,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { cn, formatDate } from '../../lib/utils';
import { exportToPDF } from '../../lib/exportUtils';

interface FeeTransaction {
  id: string;
  student_id: string;
  student_name?: string;
  roll_no?: string;
  category: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id: string;
  remarks: string;
  status: 'Completed' | 'Pending' | 'Failed';
  receipt_no: string;
}

interface FeeStructure {
  course_id: string;
  fee_pattern: 'SEMESTER' | 'ANNUAL';
  fee_amount: number;
}

export const Fees: React.FC = () => {
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<FeeTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<Partial<FeeTransaction>>({
    category: 'Tuition Fee',
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    transaction_id: '',
    remarks: '',
    status: 'Completed'
  });

  useEffect(() => {
    fetchTransactions();
    fetchStudents();
  }, []);

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('fee_transactions')
      .select('*, students(name, roll_no)')
      .order('payment_date', { ascending: false });
    
    if (data) {
      setTransactions(data.map(t => ({
        ...t,
        student_name: t.students?.name,
        roll_no: t.students?.roll_no
      })));
    }
    setIsLoading(false);
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('id, name, roll_no, branch').order('name');
    if (data) setStudents(data);
  };

  const handleSave = async () => {
    try {
      if (!selectedStudent) {
        alert('Please select a student');
        return;
      }
      
      const receiptNo = `R-${Date.now()}`;
      const { error } = await supabase.from('fee_transactions').insert([{
        ...formData,
        student_id: selectedStudent.id,
        receipt_no: receiptNo
      }]);
      
      if (error) throw error;
      
      setIsModalOpen(false);
      fetchTransactions();
    } catch (error) {
      console.error('Error saving fee transaction:', error);
    }
  };

  const handlePrintReceipt = (transaction: FeeTransaction) => {
    setCurrentReceipt(transaction);
    setIsReceiptModalOpen(true);
  };

  const filteredTransactions = transactions.filter(t => 
    (t.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.roll_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.receipt_no || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Fee Management</h1>
          <p className="text-slate-500 font-medium">Record payments and generate fee receipts.</p>
        </div>
        <button 
          onClick={() => {
            setSelectedStudent(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Collect New Fee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-primary/10 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Collected</p>
              <p className="text-2xl font-black text-slate-800">₹{(transactions || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-primary/10 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Transactions</p>
              <p className="text-2xl font-black text-slate-800">{transactions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-primary/10 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending (Approx)</p>
              <p className="text-2xl font-black text-slate-800">₹4.5L</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-primary/10 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by student name, roll no or receipt no..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           <button className="flex items-center gap-2 px-4 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100"><Filter className="w-4 h-4"/> Filters</button>
           <button className="flex items-center gap-2 px-4 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100"><Download className="w-4 h-4"/> Export</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-primary/10 shadow-sm overflow-hidden text-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary/5 border-b border-primary/10">
                <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">Receipt No</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">Student / Roll</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">Category</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">Amount</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">Date</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map(t => (
                <tr key={t.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-6 py-4 font-bold text-primary font-mono text-[11px]">{t.receipt_no}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{t.student_name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{t.roll_no}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black uppercase text-slate-500">{t.category}</span>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-800">₹{t.amount}</td>
                  <td className="px-6 py-4 font-bold text-slate-500">{formatDate(t.payment_date)}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handlePrintReceipt(t)}
                      className="p-2 text-primary hover:bg-white rounded-lg transition-all"
                      title="Print Receipt"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
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
                <h2 className="text-2xl font-black text-primary">Collect Fee</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl"><X className="w-6 h-6 text-slate-400"/></button>
               </div>
               <div className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Student (Roll No/Name)</label>
                   <div className="relative">
                     <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                     <input 
                       type="text" 
                       placeholder="e.g. RJ001"
                       className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                       onKeyUp={(e: any) => {
                         const val = e.target.value.toLowerCase();
                         if (val.length > 2) {
                           const s = students.find(st => st.roll_no?.toLowerCase().includes(val) || st.name.toLowerCase().includes(val));
                           if (s) setSelectedStudent(s);
                         }
                       }}
                     />
                   </div>
                   {selectedStudent && (
                     <div className="p-4 bg-primary/5 rounded-2xl flex items-center justify-between animate-in zoom-in-95">
                       <div>
                         <p className="text-sm font-black text-primary">{selectedStudent.name}</p>
                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{selectedStudent.roll_no} • {selectedStudent.branch}</p>
                       </div>
                       <button onClick={() => setSelectedStudent(null)} className="text-rose-500"><X className="w-4 h-4"/></button>
                     </div>
                   )}
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fee Category</label>
                    <select className="w-full px-4 py-3 bg-slate-50 rounded-xl" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                      <option>Tuition Fee</option>
                      <option>Exam Fee</option>
                      <option>Admission Fee</option>
                      <option>Library Fee</option>
                      <option>Hostel Fee</option>
                      <option>Transport Fee</option>
                      <option>Miscellaneous</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount Paid (₹)</label>
                    <input type="number" className="w-full px-4 py-3 bg-slate-50 rounded-xl" value={formData.amount} onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} />
                  </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
                    <select className="w-full px-4 py-3 bg-slate-50 rounded-xl" value={formData.payment_method} onChange={(e) => setFormData({...formData, payment_method: e.target.value})}>
                      <option>Cash</option>
                      <option>Bank Transfer</option>
                      <option>UPI</option>
                      <option>Cheque</option>
                      <option>Card</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Date</label>
                    <input type="date" className="w-full px-4 py-3 bg-slate-50 rounded-xl" value={formData.payment_date} onChange={(e) => setFormData({...formData, payment_date: e.target.value})} />
                  </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction ID / Ref</label>
                   <input type="text" placeholder="e.g. UPI-123456" className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" value={formData.transaction_id} onChange={(e) => setFormData({...formData, transaction_id: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Remarks</label>
                   <textarea rows={2} className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm resize-none" value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} />
                 </div>
               </div>
               <div className="p-8 bg-slate-50 flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:text-primary">Cancel</button>
                <button onClick={handleSave} className="px-10 py-3 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2">
                  <Save className="w-4 h-4"/> Save & Generate Receipt
                </button>
               </div>
            </motion.div>
          </div>
        )}

        {isReceiptModalOpen && currentReceipt && (
          <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] shadow-3xl w-full max-w-2xl overflow-hidden overflow-y-auto">
              <div className="p-8 space-y-8" id="fee-receipt">
                <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-3xl font-black">S</div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900">EduNexus Academy</h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fee Payment Receipt</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-primary uppercase tracking-widest">Receipt No</p>
                    <p className="text-lg font-mono font-bold text-slate-900">{currentReceipt.receipt_no}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Details</p>
                      <p className="font-bold text-slate-800">{currentReceipt.student_name}</p>
                      <p className="text-xs font-bold text-slate-500">Roll No: {currentReceipt.roll_no}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Info</p>
                      <p className="text-sm font-bold text-slate-700">Method: {currentReceipt.payment_method}</p>
                      <p className="text-sm font-bold text-slate-700">Ref: {currentReceipt.transaction_id || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-3xl p-6 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Date</p>
                      <p className="text-lg font-bold text-slate-900">{formatDate(currentReceipt.payment_date)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">Total Amount Paid</p>
                      <p className="text-3xl font-black text-primary">₹{currentReceipt.amount}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-8">
                   <div className="flex justify-between items-center bg-primary/5 p-4 rounded-2xl">
                     <p className="font-bold text-primary">{currentReceipt.category}</p>
                     <p className="font-black text-primary">₹{currentReceipt.amount}.00</p>
                   </div>
                   <p className="text-[10px] text-slate-400 mt-4 italic">Remarks: {currentReceipt.remarks || 'No remarks provided.'}</p>
                </div>

                <div className="pt-12 flex justify-between items-end">
                   <div className="space-y-1">
                     <div className="w-32 h-px bg-slate-300"></div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase">Student Signature</p>
                   </div>
                   <div className="space-y-1 text-right">
                     <div className="w-32 h-px bg-slate-300 ml-auto"></div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authorized Signatory</p>
                   </div>
                </div>
              </div>
              <div className="p-8 bg-slate-50 flex justify-end gap-3 no-print">
                <button onClick={() => setIsReceiptModalOpen(false)} className="px-6 py-3 font-bold text-slate-500">Close</button>
                <button onClick={() => window.print()} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-2"><Printer className="w-4 h-4"/> Print Receipt</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
