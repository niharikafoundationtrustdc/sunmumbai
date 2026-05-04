import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  BookOpen, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  X, 
  Save, 
  Printer, 
  Edit2, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { cn, formatDate } from '../../lib/utils';

interface Exam {
  id: string;
  title: string;
  course_id: string;
  subject: string;
  date: string;
  start_time: string;
  duration: number;
  total_marks: number;
  passing_marks: number;
  paper_setter: string;
  status: 'Draft' | 'Published' | 'Completed';
}

export const Exams: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<Partial<Exam>>({
    title: '',
    course_id: '',
    subject: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    duration: 180,
    total_marks: 100,
    passing_marks: 40,
    paper_setter: '',
    status: 'Draft'
  });

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submittingExam, setSubmittingExam] = useState<Exam | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchExams();
    fetchCourses();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Check if student
      const { data: profile } = await supabase.from('students').select('role').eq('id', user.id).single();
      if (profile) {
        setUser({ ...user, role: 'STUDENT', id: user.id });
      } else {
        const { data: staff } = await supabase.from('staff').select('role').eq('id', user.id).single();
        setUser({ ...user, role: staff?.role || 'STAFF', id: user.id });
      }
    }
  };

  const handleSubmitPaper = async () => {
    if (!submissionFile || !submittingExam || !user) return;

    setIsUploading(true);
    try {
      const fileExt = submissionFile.name.split('.').pop();
      const fileName = `${user.id}_${submittingExam.id}_${Math.random()}.${fileExt}`;
      const filePath = `submissions/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, submissionFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Create a result entry with the scanned sheet
      const { error: resultError } = await supabase.from('results').insert([{
        exam_id: submittingExam.id,
        student_id: user.id,
        scanned_sheet_url: publicUrl,
        status: 'Draft',
        total_marks: submittingExam.total_marks
      }]);

      if (resultError) throw resultError;

      setIsSubmitModalOpen(false);
      setSubmissionFile(null);
      setSubmittingExam(null);
      alert('Answer sheet submitted successfully!');
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit answer sheet.');
    } finally {
      setIsUploading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase.from('exams').select('*').order('date', { ascending: true });
      if (error) {
        console.error('Error fetching exams from Supabase:', error);
        return;
      }
      if (data) {
        console.log('Exams fetched successfully:', data.length);
        setExams(data);
      }
    } catch (err) {
      console.error('Exception in fetchExams:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase.from('courses').select('id, name');
      if (error) {
        console.error('Error fetching courses in Exams:', error);
        return;
      }
      if (data) {
        setCourses(data);
      }
    } catch (err) {
      console.error('Exception fetching courses in Exams:', err);
    }
  };

  const handleSave = async () => {
    try {
      // Clean up formData - empty strings for UUIDs should be null or deleted
      const dataToSave = { ...formData };
      if (!dataToSave.course_id || dataToSave.course_id === '') {
        delete dataToSave.course_id;
      }

      // Ensure required fields are at least empty strings if null
      dataToSave.title = dataToSave.title || 'Untitled Exam';
      dataToSave.subject = dataToSave.subject || 'Generic';
      dataToSave.paper_setter = dataToSave.paper_setter || 'Unassigned';

      let error;
      if (editingExam) {
        const { error: updateError } = await supabase.from('exams').update(dataToSave).eq('id', editingExam.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('exams').insert([dataToSave]);
        error = insertError;
      }

      if (error) {
        console.error('Supabase error saving exam:', error);
        alert('Failed to save exam: ' + error.message);
        return;
      }

      setIsModalOpen(false);
      setEditingExam(null);
      setFormData({
        title: '',
        course_id: '',
        subject: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '10:00',
        duration: 180,
        total_marks: 100,
        passing_marks: 40,
        paper_setter: '',
        status: 'Draft'
      });
      await fetchExams();
      alert('Exam saved successfully!');
    } catch (error: any) {
      console.error('Exception saving exam:', error);
      alert('An unexpected error occurred: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) {
        alert('Error deleting exam: ' + error.message);
      } else {
        fetchExams();
      }
    }
  };

  const filteredExams = exams.filter(exam => {
    const search = searchQuery.toLowerCase();
    const title = (exam.title || '').toLowerCase();
    const subject = (exam.subject || '').toLowerCase();
    const setter = (exam.paper_setter || '').toLowerCase();
    
    return title.includes(search) || subject.includes(search) || setter.includes(search);
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Examination Management</h1>
          <p className="text-slate-500 font-medium">Configure exams, schedules, and paper setters.</p>
        </div>
        <button 
          onClick={() => {
            setEditingExam(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Setup New Exam
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-primary/10 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search exams by title, subject or paper setter..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExams.map(exam => (
          <motion.div 
            key={exam.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-primary/10 shadow-sm overflow-hidden hover:shadow-xl transition-all group"
          >
            <div className="p-6 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800">{exam.title}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{exam.subject}</p>
                </div>
              </div>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                exam.status === 'Completed' ? "bg-green-100 text-green-600" :
                exam.status === 'Published' ? "bg-blue-100 text-blue-600" :
                "bg-slate-100 text-slate-500"
              )}>
                {exam.status}
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-[10px] uppercase">Date</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{formatDate(exam.date)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] uppercase">Start Time</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{exam.start_time}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                      <User className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase">Paper Setter</span>
                    </div>
                    <p className="text-sm font-black text-primary">{exam.paper_setter}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold justify-end">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase">Marks</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{exam.passing_marks}/{exam.total_marks}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {user?.role === 'STUDENT' ? (
                    <button 
                      onClick={() => {
                        setSubmittingExam(exam);
                        setIsSubmitModalOpen(true);
                      }}
                      className="flex-1 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Upload Answer Sheet
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => {
                          setEditingExam(exam);
                          setFormData(exam);
                          setIsModalOpen(true);
                        }}
                        className="flex-1 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-primary/5 hover:text-primary transition-all flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(exam.id)}
                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-primary/5">
                <div>
                  <h2 className="text-2xl font-black text-primary">{editingExam ? 'Edit Exam' : 'Exam Configuration'}</h2>
                  <p className="text-slate-500 text-sm font-medium">Define exam parameters and paper setter details.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Title</label>
                    <input 
                      type="text" 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g. Mid-Semester Examination 2024"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Course</label>
                    <select 
                      value={formData.course_id}
                      onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                      <option value="">Select Course</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</label>
                    <input 
                      type="text" 
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      placeholder="e.g. Pharmacology"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paper Setter Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        value={formData.paper_setter}
                        onChange={(e) => setFormData({...formData, paper_setter: e.target.value})}
                        placeholder="Assign Faculty"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Date</label>
                    <input 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Time</label>
                    <input 
                      type="time" 
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Duration (mins)</label>
                    <input 
                      type="number" 
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Max Marks</label>
                    <input 
                      type="number" 
                      value={formData.total_marks}
                      onChange={(e) => setFormData({...formData, total_marks: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-slate-500 font-bold hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  <Save className="w-5 h-5" />
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isSubmitModalOpen && submittingExam && (
          <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Submit Answer Sheet</h2>
                  <p className="text-slate-500 text-sm font-medium">{submittingExam.title}</p>
                </div>
                <button onClick={() => setIsSubmitModalOpen(false)}>
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center relative overflow-hidden group">
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm mx-auto flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-600">
                      {submissionFile ? submissionFile.name : 'Click or Drag PDF Answer Sheet'}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Max size 10MB • Only PDF</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <p className="text-xs font-medium text-amber-800 leading-relaxed">
                    Ensure your answer sheet is clear and all pages are included in a single PDF file before submitting.
                  </p>
                </div>
              </div>
              <div className="p-8 bg-slate-50 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-6 py-3 text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button 
                  disabled={!submissionFile || isUploading}
                  onClick={handleSubmitPaper}
                  className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  {isUploading ? 'Uploading...' : 'Submit Paper'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
