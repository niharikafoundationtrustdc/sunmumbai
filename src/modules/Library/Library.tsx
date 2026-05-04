import React, { useState, useEffect } from 'react';
import { 
  Book, 
  Plus, 
  Search, 
  Library as LibraryIcon, 
  User, 
  Hash, 
  History, 
  CheckCircle2, 
  X, 
  Save, 
  Edit2, 
  Trash2,
  Bookmark,
  ArrowRightLeft,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { cn, formatDate } from '../../lib/utils';

interface BookRecord {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  quantity: number;
  available: number;
  rack_number: string;
}

interface IssueRecord {
  id: string;
  book_id: string;
  student_id: string;
  issue_date: string;
  return_date: string;
  status: 'Issued' | 'Returned' | 'Overdue';
  student_name?: string;
  book_title?: string;
}

export const Library: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'issues'>('inventory');
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Form States
  const [bookForm, setBookForm] = useState<Partial<BookRecord>>({
    title: '', author: '', isbn: '', category: '', quantity: 1, available: 1, rack_number: ''
  });
  const [issueForm, setIssueForm] = useState<Partial<IssueRecord>>({
    book_id: '', student_id: '', issue_date: new Date().toISOString().split('T')[0], status: 'Issued'
  });

  useEffect(() => {
    fetchBooks();
    fetchIssues();
  }, []);

  const fetchBooks = async () => {
    const { data } = await supabase.from('library_items').select('*').order('title');
    if (data) setBooks(data);
    setIsLoading(false);
  };

  const fetchIssues = async () => {
    const { data } = await supabase
      .from('library_issues')
      .select('*, library_items(title), students(name)')
      .order('issue_date', { ascending: false });
    
    if (data) {
      setIssues(data.map(i => ({
        ...i,
        book_title: (i as any).library_items?.title,
        student_name: i.students?.name
      })));
    }
  };

  const handleSaveBook = async () => {
    try {
      const data = {
        ...bookForm,
        available: bookForm.available ?? bookForm.quantity
      };
      const { error } = await supabase.from('library_items').upsert([data]);
      if (error) throw error;
      setIsBookModalOpen(false);
      setBookForm({ title: '', author: '', isbn: '', category: '', quantity: 1, available: 1, rack_number: '' });
      fetchBooks();
    } catch (error: any) {
      console.error('Error saving book:', error);
      alert('Error saving book: ' + error.message);
    }
  };

  const handleSaveIssue = async () => {
    try {
      if (!issueForm.book_id || !issueForm.student_id) {
        alert('Please select both a book and a student.');
        return;
      }

      const { error } = await supabase.from('library_issues').insert([issueForm]);
      if (error) throw error;

      // Update availability
      const book = books.find(b => b.id === issueForm.book_id);
      if (book) {
        await supabase.from('library_items').update({ available: Math.max(0, (book.available || 0) - 1) }).eq('id', book.id);
      }

      setIsIssueModalOpen(false);
      setIssueForm({ book_id: '', student_id: '', issue_date: new Date().toISOString().split('T')[0], status: 'Issued' });
      fetchIssues();
      fetchBooks();
    } catch (error: any) {
      console.error('Error saving issue record:', error);
      alert('Error saving issue record: ' + error.message);
    }
  };

  const handleReturn = async (id: string, bookId: string) => {
    await supabase.from('library_issues').update({ status: 'Returned', return_date: new Date().toISOString() }).eq('id', id);
    
    // Update availability
    const book = books.find(b => b.id === bookId);
    if (book) {
      await supabase.from('library_items').update({ available: (book.available || 0) + 1 }).eq('id', bookId);
    }
    
    fetchIssues();
    fetchBooks();
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.isbn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Library Management</h1>
          <p className="text-slate-500 font-medium">Manage book inventory and student issues.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab(activeTab === 'inventory' ? 'issues' : 'inventory')}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-primary/10 text-primary rounded-2xl font-bold hover:bg-primary/5 transition-all shadow-sm"
          >
            {activeTab === 'inventory' ? <History className="w-5 h-5" /> : <LibraryIcon className="w-5 h-5" />}
            {activeTab === 'inventory' ? 'View Issues' : 'View Inventory'}
          </button>
          <button 
            onClick={() => activeTab === 'inventory' ? setIsBookModalOpen(true) : setIsIssueModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            {activeTab === 'inventory' ? 'Add New Book' : 'Issue Book'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-primary/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Book className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Books</p>
            <p className="text-2xl font-black text-slate-800">{books.reduce((acc, curr) => acc + (curr.quantity || 0), 0)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-primary/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Available</p>
            <p className="text-2xl font-black text-slate-800">{books.reduce((acc, curr) => acc + (curr.available || 0), 0)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-primary/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Issued</p>
            <p className="text-2xl font-black text-slate-800">{issues.filter(i => i.status === 'Issued').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-primary/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Overdue</p>
            <p className="text-2xl font-black text-slate-800">{issues.filter(i => i.status === 'Overdue').length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-primary/10 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder={activeTab === 'inventory' ? "Search books by title, author or ISBN..." : "Search issue records..."}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <div className="bg-white rounded-3xl border border-primary/10 shadow-sm overflow-hidden text-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary/5 border-b border-primary/10">
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">Title & Author</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">ISBN / Category</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">Quantity</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">Location</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map(book => (
                  <tr key={book.id} className="hover:bg-primary/5 transition-colors group italic-links">
                    <td className="px-6 py-4 font-bold text-slate-800">
                      <div>
                        {book.title}
                        <p className="text-[10px] text-slate-400 font-medium">by {book.author}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600">{book.isbn}</span>
                        <p className="text-[10px] text-primary font-black uppercase">{book.category}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-black">{book.available}</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-400 font-bold">{book.quantity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-500">Rack {book.rack_number}</td>
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
      ) : (
        <div className="bg-white rounded-3xl border border-primary/10 shadow-sm overflow-hidden text-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary/5 border-b border-primary/10">
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">Student Details</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">Book Issued</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">Dates</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px]">Status</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-primary text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.map(issue => (
                  <tr key={issue.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{issue.student_name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">ID: {issue.student_id}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{issue.book_title}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                          <Calendar className="w-3 h-3" />
                          Issued: {formatDate(issue.issue_date)}
                        </div>
                        {issue.return_date && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-500">
                            <CheckCircle2 className="w-3 h-3" />
                            Returned: {formatDate(issue.return_date)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        issue.status === 'Returned' ? "bg-green-100 text-green-600" :
                        issue.status === 'Overdue' ? "bg-rose-100 text-rose-600 shake" :
                        "bg-primary/10 text-primary"
                      )}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {issue.status === 'Issued' && (
                        <button 
                          onClick={() => handleReturn(issue.id, issue.book_id)}
                          className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-sm"
                        >
                          Return Book
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

          {/* Modals for Book and Issue */}
      <AnimatePresence>
        {isBookModalOpen && (
          <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden">
               <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-primary/5">
                <div>
                  <h2 className="text-2xl font-black text-primary">Library Item</h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Inventory Management</p>
                </div>
                <button onClick={() => setIsBookModalOpen(false)} className="p-2 hover:bg-white rounded-xl"><X className="w-6 h-6 text-slate-400"/></button>
               </div>
               <div className="p-8 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Book Title</label>
                  <input type="text" placeholder="e.g. Clinical Pharmacology" className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold" value={bookForm.title} onChange={(e) => setBookForm({...bookForm, title: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Author</label>
                  <input type="text" placeholder="e.g. Laurence & Bennett" className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold" value={bookForm.author} onChange={(e) => setBookForm({...bookForm, author: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ISBN</label>
                    <input type="text" placeholder="978-0-..." className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold" value={bookForm.isbn} onChange={(e) => setBookForm({...bookForm, isbn: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <input type="text" placeholder="e.g. Medical" className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold" value={bookForm.category} onChange={(e) => setBookForm({...bookForm, category: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Quantity</label>
                    <input type="number" placeholder="Qty" className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold" value={bookForm.quantity} onChange={(e) => setBookForm({...bookForm, quantity: Number(e.target.value), available: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rack No.</label>
                    <input type="text" placeholder="R-101" className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold" value={bookForm.rack_number} onChange={(e) => setBookForm({...bookForm, rack_number: e.target.value})} />
                  </div>
                </div>
               </div>
               <div className="p-8 bg-slate-50 flex justify-end gap-3">
                <button onClick={() => setIsBookModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:text-primary transition-colors">Cancel</button>
                <button onClick={handleSaveBook} className="px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Inventory
                </button>
               </div>
            </motion.div>
          </div>
        )}

        {isIssueModalOpen && (
          <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden">
               <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-primary/5">
                <div>
                  <h2 className="text-2xl font-black text-primary">Issue Book</h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">New Loan Record</p>
                </div>
                <button onClick={() => setIsIssueModalOpen(false)} className="p-2 hover:bg-white rounded-xl"><X className="w-6 h-6 text-slate-400"/></button>
               </div>
               <div className="p-8 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Book</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold border-none focus:ring-2 focus:ring-primary/20" 
                    value={issueForm.book_id} 
                    onChange={(e) => setIssueForm({...issueForm, book_id: e.target.value})}
                  >
                    <option value="">Choose a book...</option>
                    {books.filter(b => b.available > 0).map(b => (
                      <option key={b.id} value={b.id}>{b.title} ({b.available} left)</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Student ID / Roll No</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Enter Student ID" 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl font-bold border-none focus:ring-2 focus:ring-primary/20" 
                      value={issueForm.student_id} 
                      onChange={(e) => setIssueForm({...issueForm, student_id: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Issue Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="date" 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl font-bold border-none focus:ring-2 focus:ring-primary/20" 
                      value={issueForm.issue_date} 
                      onChange={(e) => setIssueForm({...issueForm, issue_date: e.target.value})} 
                    />
                  </div>
                </div>
               </div>
               <div className="p-8 bg-slate-50 flex justify-end gap-3">
                <button onClick={() => setIsIssueModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:text-primary transition-colors">Cancel</button>
                <button onClick={handleSaveIssue} className="px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" />
                  Issue Now
                </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
