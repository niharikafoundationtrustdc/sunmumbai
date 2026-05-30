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
import { useAuth } from '../../hooks/useAuth';

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
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [matchingStudents, setMatchingStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [academicSettings, setAcademicSettings] = useState<any>(null);
  const [generalSettings, setGeneralSettings] = useState<any>(null);
  
  const [filterCourse, setFilterCourse] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  
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
    fetchSettingsData();
  }, []);

  const fetchSettingsData = async () => {
    const { data: cData } = await supabase.from('courses').select('id, name');
    if (cData) setCourses(cData);

    const { data: sData } = await supabase.from('app_settings').select('*').eq('key', 'academic').single();
    if (sData) setAcademicSettings(sData.value);

    const { data: gData } = await supabase.from('app_settings').select('*').eq('key', 'general').single();
    if (gData) setGeneralSettings(gData.value);
  };

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
      if (user?.role !== 'ACCOUNTANT') {
        alert('Permission Denied: Only Accountants can collect fees.');
        return;
      }

      if (!selectedStudent) {
        alert('Please select a student');
        return;
      }

      if (!formData.amount || formData.amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }
      
      const receiptNo = `R-${Date.now()}`;
      const { error } = await supabase.from('fee_transactions').insert([{
        category: formData.category,
        amount: formData.amount,
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        transaction_id: formData.transaction_id,
        remarks: formData.remarks,
        status: formData.status,
        student_id: selectedStudent.id,
        receipt_no: receiptNo
      }]);
      
      if (error) throw error;
      
      setIsModalOpen(false);
      setStudentSearchInput('');
      setMatchingStudents([]);
      setSelectedStudent(null);
      setFilterCourse('');
      setFilterBatch('');
      fetchTransactions();
      alert('Fee collected successfully!');
    } catch (error: any) {
      console.error('Error saving fee transaction:', error);
      alert('Failed to collect fee: ' + (error.message || 'Unknown error'));
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
    <div className="space-y-6 md:space-y-8 pb-10 md:pb-0">
      {user?.role !== 'ACCOUNTANT' && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-black">Access Restricted to Accountant Role Only</p>
              <p className="text-xs font-bold text-amber-700 mt-0.5">Under institutional guidelines, only the assigned Accountant can collect fees and log payments.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-primary tracking-tight">Fee Management</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Record payments and generate fee receipts.</p>
        </div>
        <button 
          onClick={() => {
            if (user?.role !== 'ACCOUNTANT') {
              alert('Permission Denied: Only Accountants can collect fees.');
              return;
            }
            setSelectedStudent(null);
            setStudentSearchInput('');
            setMatchingStudents([]);
            setFilterCourse('');
            setFilterBatch('');
            setIsModalOpen(true);
          }}
          disabled={user?.role !== 'ACCOUNTANT'}
          className={cn(
            "w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 md:py-3 rounded-2xl font-bold transition-all shadow-xl active:scale-[0.98]",
            user?.role === 'ACCOUNTANT' 
              ? "bg-primary text-white shadow-primary/20 hover:bg-primary/90" 
              : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200"
          )}
        >
          <Plus className="w-5 h-5" />
          Collect New Fee
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-3xl border border-primary/10 shadow-sm transition-transform hover:scale-[1.02]">
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

      <div className="bg-white p-4 rounded-2xl border border-primary/10 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400 font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"><Filter className="w-4 h-4"/> Filter</button>
           <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"><Download className="w-4 h-4"/> Export</button>
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
              {filteredTransactions.map((t, i) => (
                <tr key={t.id || `tx-${i}`} className="hover:bg-primary/5 transition-colors group">
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
          <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden border border-white"
            >
               <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-primary/5">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-primary">Collect Fee</h2>
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Record new payment</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-2xl transition-colors shadow-sm"><X className="w-6 h-6 text-slate-400"/></button>
               </div>
               
               <div className="p-6 md:p-8 space-y-6 max-h-[85vh] md:max-h-[70vh] overflow-y-auto custom-scrollbar">
                 <div className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter by Course</label>
                        <select 
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                          value={filterCourse}
                          onChange={(e) => setFilterCourse(e.target.value)}
                        >
                          <option value="">All Courses</option>
                          {courses.map((c, i) => <option key={c.id || `course-${i}`} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter by Batch</label>
                        <select 
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                          value={filterBatch}
                          onChange={(e) => setFilterBatch(e.target.value)}
                        >
                          <option value="">All Batches</option>
                          {academicSettings?.batches?.map((b: string, i: number) => <option key={b || `batch-${i}`} value={b}>{b}</option>)}
                        </select>
                      </div>
                   </div>

                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search Student (Name / Roll No)</label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Search student..."
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-300"
                        value={studentSearchInput}
                        onChange={async (e) => {
                          const val = e.target.value;
                          setStudentSearchInput(val);
                          
                          if (val.length > 1) {
                            let query = supabase.from('students').select('id, name, roll_no, branch, batch, course_id');
                            
                            if (filterCourse) query = query.eq('course_id', filterCourse);
                            if (filterBatch) query = query.eq('batch', filterBatch);
                            
                            query = query.or(`name.ilike.%${val}%,roll_no.ilike.%${val}%`).limit(10);
                            
                            const { data } = await query;
                            if (data) setMatchingStudents(data);
                          } else {
                            setMatchingStudents([]);
                          }
                        }}
                      />
                      
                      {matchingStudents.length > 0 && !selectedStudent && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[24px] shadow-2xl border border-slate-100 z-[110] overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-64 overflow-y-auto custom-scrollbar">
                          <div className="p-3 bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest px-6">Found {matchingStudents.length} Students</div>
                          {matchingStudents.map((s, i) => (
                            <button
                              key={s.id || `student-${i}`}
                              onClick={() => {
                                setSelectedStudent(s);
                                setMatchingStudents([]);
                                setStudentSearchInput(s.name);
                              }}
                              className="w-full p-4 md:p-5 text-left hover:bg-primary/5 border-b border-slate-50 last:border-0 transition-colors flex flex-col gap-1 px-6 active:bg-primary/10"
                            >
                              <div className="font-bold text-slate-800 text-sm">{s.name}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-2">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded">{s.roll_no}</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span>{s.branch}</span>
                                {s.batch && <>
                                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                  <span>{s.batch}</span>
                                </>}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                   </div>

                    {selectedStudent && (
                      <div className="p-5 bg-primary/5 rounded-[24px] flex items-center justify-between animate-in zoom-in-95 border border-primary/10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                            <User className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-primary">{selectedStudent.name}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{selectedStudent.roll_no} • {selectedStudent.branch}</p>
                          </div>
                        </div>
                        <button onClick={() => {
                          setSelectedStudent(null);
                          setStudentSearchInput('');
                        }} className="p-2 bg-white text-rose-500 rounded-xl shadow-sm hover:bg-rose-50 transition-colors">
                          <X className="w-5 h-5"/>
                        </button>
                      </div>
                    )}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fee Category</label>
                    <select 
                      className="w-full px-4 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none" 
                      value={formData.category} 
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Paid (₹)</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                      value={formData.amount || ''} 
                      placeholder="Enter amount"
                      onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} 
                    />
                  </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</label>
                    <select 
                      className="w-full px-4 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none" 
                      value={formData.payment_method} 
                      onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                    >
                      <option>Cash</option>
                      <option>Bank Transfer</option>
                      <option>UPI</option>
                      <option>Cheque</option>
                      <option>Card</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Date</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                      value={formData.payment_date} 
                      onChange={(e) => setFormData({...formData, payment_date: e.target.value})} 
                    />
                  </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction ID / Reference</label>
                   <input 
                    type="text" 
                    placeholder="e.g. UPI-123456" 
                    className="w-full px-4 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-300" 
                    value={formData.transaction_id} 
                    onChange={(e) => setFormData({...formData, transaction_id: e.target.value})} 
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</label>
                   <textarea 
                    rows={2} 
                    placeholder="Optional notes..."
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-[24px] text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-300 resize-none" 
                    value={formData.remarks} 
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})} 
                   />
                 </div>
               </div>
               <div className="p-6 md:p-8 bg-slate-50 flex flex-col md:flex-row justify-end gap-3 md:gap-4 border-t border-slate-100">
                <button onClick={() => setIsModalOpen(false)} className="order-2 md:order-1 px-8 py-4 md:py-3 font-bold text-slate-400 hover:text-primary transition-colors">Discard</button>
                <button onClick={handleSave} className="order-1 md:order-2 px-10 py-5 md:py-3 bg-primary text-white rounded-[20px] md:rounded-2xl font-black shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 active:scale-95 group">
                  <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform"/> Save & Print Receipt
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
                    {generalSettings?.logo ? (
                      <img src={generalSettings.logo} alt="Logo" className="w-16 h-16 object-contain rounded-2xl" />
                    ) : (
                      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-3xl font-black">
                        {generalSettings?.collegeName ? generalSettings.collegeName.charAt(0) : 'S'}
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-black text-slate-900">{generalSettings?.collegeName || 'EduNexus Academy'}</h2>
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
