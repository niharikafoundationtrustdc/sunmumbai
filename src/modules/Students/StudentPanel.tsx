import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  FileText, 
  CreditCard, 
  Award, 
  Clock, 
  ClipboardList, 
  History,
  Play,
  Timer,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Download,
  Search,
  Filter,
  User,
  MapPin,
  LayoutDashboard,
  Megaphone,
  Bell,
  Volume2,
  Upload,
  Eye,
  File
} from 'lucide-react';
import { cn, formatCurrency, formatDate, formatEditCount } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { exportToPDF, exportToExcel } from '../../lib/exportUtils';

// import { NoticeTicker } from '../../components/NoticeTicker';

interface StudentData {
  id: string;
  name: string;
  courseId: string;
  courseName: string;
  branch: string;
  year: string;
  batch: string;
}

export const StudentPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'exams' | 'results' | 'fees' | 'courses' | 'timetable' | 'syllabus' | 'studylog' | 'documents' | 'attendance' | 'library' | 'profile'>('overview');
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [fullStudentProfile, setFullStudentProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [studyLogs, setStudyLogs] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [libraryIssues, setLibraryIssues] = useState<any[]>([]);
  const [feeSettings, setFeeSettings] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Exam Interface states
  const [activeView, setActiveView] = useState<'panel' | 'take_exam'>('panel');
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (user) {
      fetchStudentData();
      fetchNotices();

      // Real-time notices
      const channel = supabase
        .channel('notices_student')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notices' 
        }, (payload) => {
          if (payload.new.audience === 'All' || payload.new.audience === 'Students') {
            setNotices(prev => [payload.new, ...prev]);
            playNotificationSound();
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const playNotificationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log('Could not play notification sound:', e));
  };

  const fetchNotices = async () => {
    const { data } = await supabase
      .from('notices')
      .select('*')
      .or('audience.eq.All,audience.eq.Students')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setNotices(data);
  };

  const fetchStudentData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Student Profile
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*, courses(name)')
        .eq('id', user.id)
        .single();

      if (student) {
        setFullStudentProfile(student);
        setStudentData({
          id: student.id,
          name: student.name,
          courseId: student.course_id,
          courseName: student.courses?.name || 'N/A',
          branch: student.branch,
          year: student.year,
          batch: student.batch
        });

        // 2. Fetch all related data in parallel
        const courseId = student.course_id;
        const [examsRes, resultsRes, feesRes, transactionsRes, coursesRes, timetableRes, syllabusRes, studyLogsRes, documentsRes, settingsRes, attendanceRes, libraryRes] = await Promise.all([
          supabase.from('exams').select('*, papers(*)').eq('course_id', courseId).order('date', { ascending: true }),
          supabase.from('results').select('*, exams(*)').eq('student_id', student.id).eq('status', 'published').order('created_at', { ascending: false }),
          supabase.from('fees').select('*').eq('student_id', student.id).order('date', { ascending: true }),
          supabase.from('fee_transactions').select('*').eq('student_id', student.id).order('payment_date', { ascending: false }),
          supabase.from('courses').select('*'),
          supabase.from('timetable').select('*').eq('course_id', student.course_id),
          supabase.from('syllabus').select('*').eq('course_id', student.course_id).order('unit_number', { ascending: true }),
          supabase.from('study_activities').select('*').eq('course_id', student.course_id).order('date', { ascending: false }),
          supabase.from('student_document_records').select('*').eq('student_id', student.id).order('created_at', { ascending: false }),
          supabase.from('app_settings').select('*').eq('key', 'fees').single(),
          supabase.from('attendance').select('*').eq('student_id', student.id).order('date', { ascending: false }),
          supabase.from('library_issues').select('*, library_items(*)').eq('student_id', student.id).order('issue_date', { ascending: false })
        ]);

        if (examsRes.data) setExams(examsRes.data);
        if (resultsRes.data) setResults(resultsRes.data);
        if (feesRes.data) setFees(feesRes.data);
        if (transactionsRes.data) setTransactions(transactionsRes.data);
        if (coursesRes.data) setCourses(coursesRes.data);
        if (timetableRes.data) setTimetable(timetableRes.data);
        if (syllabusRes.data) setSyllabus(syllabusRes.data);
        if (studyLogsRes.data) setStudyLogs(studyLogsRes.data);
        if (documentsRes.data) setDocuments(documentsRes.data);
        if (settingsRes.data) setFeeSettings(settingsRes.data.value);
        if (attendanceRes.data) setAttendanceHistory(attendanceRes.data);
        if (libraryRes.data) setLibraryIssues(libraryRes.data);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Exam Timer Logic
  useEffect(() => {
    let timer: any;
    if (activeView === 'take_exam' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && activeView === 'take_exam') {
      handleFinishExam();
    }
    return () => clearInterval(timer);
  }, [activeView, timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartExam = (exam: any) => {
    setSelectedExam(exam);
    setTimeLeft(exam.duration * 60);
    setActiveView('take_exam');
  };

  const handleFinishExam = async () => {
    if (!selectedExam || !studentData) return;

    const resultData = {
      student_id: studentData.id,
      exam_id: selectedExam.id,
      marks_obtained: 0,
      total_marks: selectedExam.papers?.total_marks || 100,
      status: 'draft',
      evaluation_data: { submissionDate: new Date().toISOString() }
    };

    const { error } = await supabase.from('results').insert(resultData);
    
    if (error) {
      console.error('Error submitting exam:', error);
      alert('Failed to submit exam. Please try again.');
      return;
    }

    setActiveView('panel');
    setActiveTab('results');
    fetchStudentData();
    alert('Exam submitted successfully! Results will be published after evaluation.');
  };

  const handleMakePayment = async (fee: any) => {
    if (!window.confirm(`Proceed to pay ${formatCurrency(fee.amount)}?`)) return;

    const { error } = await supabase
      .from('fees')
      .update({ 
        status: 'PAID',
        payment_mode: 'Online',
        payment_method: 'Card/UPI',
        transaction_id: `TXN${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toISOString().split('T')[0]
      })
      .eq('id', fee.id);

    if (error) {
      console.error('Error making payment:', error);
      alert('Payment failed. Please try again.');
      return;
    }

    fetchStudentData();
    alert('Payment successful!');
  };

  const handleDownloadResult = (res: any) => {
    const headers = ['Examination', 'Subject', 'Marks', 'Total', 'Status'];
    const data = [[
      res.exams?.title || 'N/A',
      res.exams?.subject || 'N/A',
      res.marks_obtained.toString(),
      res.total_marks.toString(),
      res.status === 'published' ? (res.marks_obtained >= (res.total_marks * 0.4) ? 'PASSED' : 'FAILED') : 'EVALUATING'
    ]];
    const fileName = `Result_${res.exams?.title?.replace(/\s+/g, '_')}_${studentData?.name.replace(/\s+/g, '_')}`;
    exportToPDF('Examination Result Card', headers, data, fileName);
  };

  const handleDownloadFeesReceipt = (fee: any) => {
    const headers = ['Description', 'Amount', 'Status', 'Date', 'Transaction ID'];
    const data = [[
      fee.description,
      formatCurrency(fee.amount),
      fee.status,
      formatDate(fee.date || fee.created_at),
      fee.transaction_id || 'N/A'
    ]];
    const fileName = `FeeReceipt_${fee.id}`;
    exportToPDF('Fee Payment Receipt', headers, data, fileName);
  };

  const handleExportStudyLog = () => {
    if ((studyLogs || []).length === 0) return;
    const data = (studyLogs || []).map(log => ({
      Date: formatDate(log.date),
      Batch: log.batch,
      Activity: log.activity,
      Assignment: log.assignment_details || 'None',
      Status: log.status || 'Completed'
    }));
    exportToExcel(data, `Study_Log_${studentData?.name.replace(/\s+/g, '_')}`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !studentData) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentData.id}_${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('student_document_records')
        .insert({
          student_id: studentData.id,
          document_type: file.type.includes('image') ? 'Image' : 'Document',
          category: 'Personal',
          file_url: publicUrl,
          remarks: `Uploaded by student: ${file.name}`
        });

      if (dbError) throw dbError;
      
      alert('Document uploaded successfully!');
      fetchStudentData();
    } catch (err: any) {
      console.error('Error uploading document:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!studentData && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-slate-800">Student Profile Not Found</h2>
          <p className="text-slate-500">We couldn't locate your student profile in the system. Please contact the administrator.</p>
        </div>
      </div>
    );
  }

  if (activeView === 'take_exam') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white p-8 rounded-[32px] border border-primary/10 shadow-xl sticky top-4 z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">{selectedExam?.title}</h2>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{selectedExam?.subject}</p>
            </div>
          </div>
          <div className={cn(
            "px-6 py-3 rounded-2xl font-black text-2xl tabular-nums shadow-lg shadow-primary/10",
            timeLeft < 300 ? "bg-rose-500 text-white animate-pulse" : "bg-primary text-white"
          )}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="space-y-6">
          {selectedExam?.papers?.questions?.map((q: any, index: number) => (
            <div key={q.id} className="bg-white p-8 rounded-[32px] border border-primary/10 shadow-sm hover:border-primary/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-500">QUESTION {index + 1}</span>
                <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-lg">{q.marks} Marks</span>
              </div>
              
              <h3 className="text-lg font-black text-slate-800 mb-6">{q.text}</h3>

              {q.type === 'MCQ' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options?.map((opt: string, optIdx: number) => (
                    <label key={optIdx} className="flex items-center gap-3 p-4 bg-background rounded-2xl border border-transparent hover:border-primary/20 cursor-pointer transition-all group">
                      <input type="radio" name={`q-${q.id}`} className="w-5 h-5 text-primary focus:ring-primary/20" />
                      <span className="text-sm font-bold text-slate-600 group-hover:text-primary transition-colors">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea 
                  rows={q.type === 'LONG_ANSWER' ? 8 : 4}
                  placeholder="Type your answer here..."
                  className="w-full px-6 py-4 bg-background border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                />
              )}
            </div>
          ))}
          {(!selectedExam?.papers?.questions || selectedExam.papers.questions.length === 0) && (
            <div className="bg-white p-12 rounded-[32px] border border-primary/10 text-center">
              <p className="text-slate-500 font-bold">No questions found for this paper.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4 pb-12">
          <button 
            onClick={handleFinishExam}
            className="px-12 py-4 bg-primary text-white rounded-2xl font-black hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
          >
            Submit Exam
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Live Notice Ticker */}
      {/* <NoticeTicker audience="Students" /> */}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Student Panel</h1>
          <p className="text-slate-500 font-medium">Welcome back, {studentData?.name}. Here's your academic overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-primary/10 rounded-xl shadow-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-slate-700">{studentData?.courseName}</span>
          </div>
          <div className="px-4 py-2 bg-white border border-primary/10 rounded-xl shadow-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-slate-700">{studentData?.year}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1 bg-primary/5 rounded-2xl overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'profile', label: 'My Profile', icon: User },
          { id: 'exams', label: 'Exams', icon: FileText },
          { id: 'results', label: 'Results', icon: Award },
          { id: 'fees', label: 'Fees', icon: CreditCard },
          { id: 'courses', label: 'My Course', icon: BookOpen },
          { id: 'timetable', label: 'Time Table', icon: Calendar },
          { id: 'syllabus', label: 'Syllabus', icon: ClipboardList },
          { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
          { id: 'studylog', label: 'Study Log', icon: History },
          { id: 'library', label: 'Library Materials', icon: BookOpen },
          { id: 'documents', label: 'Documents', icon: File }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === tab.id ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-primary"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Stats */}
            <div className="lg:col-span-2 space-y-8">
              {/* Broadcast Notices */}
              {notices.length > 0 && (
                <div className="bg-white p-8 rounded-[32px] border border-primary/10 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-indigo-600" />
                      Important Notices
                    </h3>
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg">Recent</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(notices || []).slice(0, 2).map((notice, i) => (
                      <div key={`notice-${i}`} className="p-5 bg-indigo-50/30 rounded-3xl border border-indigo-100 group relative overflow-hidden transition-all hover:bg-indigo-50/50">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                            <Bell className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold text-indigo-400">{formatDate(notice.created_at)}</span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm truncate">{notice.title}</h4>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-1 font-medium">{notice.content}</p>
                          </div>
                          <Volume2 className="w-10 h-10 absolute -right-3 -bottom-3 text-indigo-200/20 group-hover:scale-110 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-primary/10 shadow-sm">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                    <Award className="w-6 h-6" />
                  </div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Latest Score</p>
                  <p className="text-3xl font-black text-slate-900">
                    {results[0] ? `${results[0].marks_obtained}/${results[0].total_marks}` : 'N/A'}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-primary/10 shadow-sm">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Pending Fees</p>
                  <p className="text-3xl font-black text-slate-900">
                    {formatCurrency((fees || []).filter(f => f.status === 'PENDING').reduce((acc, f) => acc + f.amount, 0))}
                  </p>
                </div>
              </div>

              {/* Upcoming Exams */}
              <div className="bg-white p-8 rounded-[32px] border border-primary/10 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-slate-800">Upcoming Exams</h3>
                  <button onClick={() => setActiveTab('exams')} className="text-xs font-bold text-primary hover:underline">View All</button>
                </div>
                <div className="space-y-4">
                  {(exams || []).filter(e => e.status !== 'COMPLETED').slice(0, 3).map((exam) => (
                    <div key={exam.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group hover:bg-white hover:border-primary/10 border border-transparent transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center border border-slate-100 group-hover:border-primary/10">
                          <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(exam.date).toLocaleString('default', { month: 'short' })}</span>
                          <span className="text-sm font-black text-slate-800">{new Date(exam.date).getDate()}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{exam.title}</h4>
                          <p className="text-xs text-slate-500">{exam.subject} • {exam.time}</p>
                        </div>
                      </div>
                      {exam.status === 'ONGOING' ? (
                        <button 
                          onClick={() => handleStartExam(exam)}
                          className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Start Now
                        </button>
                      ) : (
                        <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                          Upcoming
                        </span>
                      )}
                    </div>
                  ))}
                  {((exams || []).filter(e => e.status !== 'COMPLETED')).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-slate-400 font-bold">No upcoming exams scheduled.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Overview */}
            <div className="space-y-8">
              {/* Today's Schedule */}
              <div className="bg-white p-8 rounded-[32px] border border-primary/10 shadow-sm">
                <h3 className="text-xl font-black text-slate-800 mb-6">Today's Schedule</h3>
                <div className="space-y-6">
                  {(timetable || []).filter(t => t.day === new Date().toLocaleDateString('en-US', { weekday: 'long' })).map((slot) => (
                    <div key={slot.id} className="flex gap-4">
                      <div className="w-px bg-slate-100 relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full"></div>
                      </div>
                      <div className="pb-6">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{slot.startTime}</p>
                        <h4 className="font-bold text-slate-800">{slot.subject}</h4>
                        <p className="text-xs text-slate-500">{slot.faculty} • {slot.room}</p>
                      </div>
                    </div>
                  ))}
                  {(timetable || []).filter(t => t.day === new Date().toLocaleDateString('en-US', { weekday: 'long' })).length === 0 && (
                    <p className="text-slate-400 font-bold text-center py-4">No classes scheduled for today.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'exams' && (
          <motion.div 
            key="exams"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(exams || []).map((exam) => (
                <div key={exam.id} className="bg-white p-6 rounded-[32px] border border-primary/10 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        exam.status === 'UPCOMING' ? "bg-amber-50 text-amber-600" : 
                        exam.status === 'ONGOING' ? "bg-indigo-50 text-indigo-600" : "bg-green-50 text-green-600"
                      )}>
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800">{exam.title}</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{exam.subject}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      exam.status === 'UPCOMING' ? "bg-amber-50 text-amber-600" : 
                      exam.status === 'ONGOING' ? "bg-indigo-50 text-indigo-600" : "bg-green-50 text-green-600"
                    )}>
                      {exam.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date & Time</p>
                      <p className="text-sm font-bold text-slate-800">{formatDate(exam.date)}</p>
                      <p className="text-xs text-slate-500">{exam.time}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                      <p className="text-sm font-bold text-slate-800">{exam.duration} Minutes</p>
                      <p className="text-xs text-slate-500">Online Exam</p>
                    </div>
                  </div>

                  {exam.status === 'ONGOING' ? (
                    <button 
                      onClick={() => handleStartExam(exam)}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-black hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Start Examination
                    </button>
                  ) : exam.status === 'COMPLETED' ? (
                    <button className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black cursor-not-allowed flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Exam Completed
                    </button>
                  ) : (
                    <div className="w-full py-4 bg-amber-50 text-amber-600 rounded-2xl font-black flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" />
                      Starts in {formatDate(exam.date)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'results' && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[32px] border border-primary/10 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary/5 border-b border-primary/10">
                    <th className="px-8 py-5 text-[10px] font-black text-primary uppercase tracking-widest">Examination</th>
                    <th className="px-8 py-5 text-[10px] font-black text-primary uppercase tracking-widest">Subject</th>
                    <th className="px-8 py-5 text-[10px] font-black text-primary uppercase tracking-widest">Score</th>
                    <th className="px-8 py-5 text-[10px] font-black text-primary uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-primary uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(results || []).map((res) => (
                    <tr key={res.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-slate-800">{res.exams?.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(res.created_at)}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-slate-700">{res.exams?.subject}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900">{res.marks_obtained}/{res.total_marks}</span>
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full",
                                res.marks_obtained >= (res.total_marks * 0.4) ? "bg-emerald-500" : "bg-rose-500"
                              )}
                              style={{ width: `${(res.marks_obtained/res.total_marks) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center w-fit gap-1.5",
                          res.marks_obtained >= (res.total_marks * 0.4) ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                          {res.status === 'published' ? (res.marks_obtained >= (res.total_marks * 0.4) ? 'PASSED' : 'FAILED') : 'EVALUATING'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(res.evaluated_sheet_url || res.scanned_sheet_url) && (
                            <button 
                              onClick={() => {
                                setSelectedResult(res);
                                setIsResultModalOpen(true);
                              }}
                              className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
                              title="View Answer Sheet"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline">Sheet</span>
                            </button>
                          )}
                          <button 
                            onClick={() => handleDownloadResult(res)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {results.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold">No results published yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'fees' && (
          <motion.div 
            key="fees"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Fees Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-[32px] border border-primary/10 shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                  <CreditCard className="w-6 h-6" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Fee Amount</p>
                <p className="text-3xl font-black text-slate-800">
                  {formatCurrency((fees || []).reduce((acc, f) => acc + f.amount, 0))}
                </p>
              </div>
              <div className="bg-white p-6 rounded-[32px] border border-emerald-100 shadow-sm bg-emerald-50/10">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Paid</p>
                <p className="text-3xl font-black text-slate-800">
                  {formatCurrency((fees || []).filter(f => f.status === 'PAID').reduce((acc, f) => acc + f.amount, 0))}
                </p>
              </div>
              <div className="bg-white p-6 rounded-[32px] border border-rose-100 shadow-sm bg-rose-50/10">
                <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mb-4">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Overdue / Pending</p>
                <p className="text-3xl font-black text-slate-800">
                  {formatCurrency((fees || []).filter(f => f.status !== 'PAID').reduce((acc, f) => acc + f.amount, 0))}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Fee Schedules */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-[32px] border border-primary/10 shadow-sm overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="font-black text-slate-800">Fee Installments / Dues</h3>
                    <button 
                      onClick={() => setShowQR(true)}
                      className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-black hover:bg-primary/20 transition-all flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      View QR Code
                    </button>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                        <th className="px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                        <th className="px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(fees || []).map((fee) => (
                        <tr key={fee.id}>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-black text-slate-800">{fee.description}</p>
                              {fee.edit_count > 0 && (
                                <span className="text-[9px] font-black text-rose-500 italic flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded-full">
                                  <AlertCircle className="w-2.5 h-2.5" />
                                  {formatEditCount(fee.edit_count).toUpperCase().trim()}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Due: {formatDate(fee.due_date)}</p>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-sm font-black text-slate-900">{formatCurrency(fee.amount)}</p>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                              fee.status === 'PAID' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                            )}>
                              {fee.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Transaction History */}
                <div className="bg-white rounded-[32px] border border-primary/10 shadow-sm overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-50">
                    <h3 className="font-black text-slate-800">Transaction History</h3>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                        <th className="px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</th>
                        <th className="px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(transactions || []).map((txn) => (
                        <tr key={txn.id}>
                          <td className="px-8 py-5">
                            <p className="text-sm font-bold text-slate-800">{formatDate(txn.payment_date)}</p>
                            <p className="text-[10px] font-medium text-slate-400 truncate w-32">{txn.id}</p>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-sm font-black text-emerald-600">{formatCurrency(txn.amount_paid)}</p>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-sm font-bold text-slate-600">{txn.payment_mode}</p>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                              <Download className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold">No transactions recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* QR Code / Payment Detail Sidebar */}
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[32px] border border-primary/10 shadow-sm sticky top-8">
                  <h3 className="text-lg font-black text-slate-800 mb-6">Payment Options</h3>
                  
                  {feeSettings?.qr_code && (
                    <div className="space-y-6">
                      <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 p-6">
                        <img 
                          src={feeSettings.qr_code} 
                          alt="Payment QR" 
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 font-bold">UPI ID</p>
                        <p className="text-sm font-black text-primary">{feeSettings.upi_id || 'N/A'}</p>
                      </div>
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <p className="text-[10px] font-bold text-primary uppercase text-center leading-relaxed">
                          Scan the QR code or use the UPI ID to make a payment. Send the screenshot along with your Student ID to the college accountant.
                        </p>
                      </div>
                    </div>
                  )}
                  {!feeSettings?.qr_code && (
                    <div className="text-center py-12 space-y-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                        <CreditCard className="w-8 h-8" />
                      </div>
                      <p className="text-sm text-slate-500 font-bold">QR Payment not configured by administration.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* QR Modal */}
            <AnimatePresence>
              {showQR && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowQR(false)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-white w-full max-w-md p-8 rounded-[40px] shadow-2xl"
                  >
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-black text-slate-800">Scan & Pay</h3>
                      <p className="text-slate-500 font-medium">Use any UPI app to pay your fees</p>
                    </div>

                    <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 p-8 mb-8">
                      {feeSettings?.qr_code ? (
                        <img src={feeSettings.qr_code} alt="QR Code" className="w-full h-full object-contain mix-blend-multiply" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">QR NOT FOUND</div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Merchant UPI ID</p>
                        <p className="text-lg font-black text-slate-800 break-all">{feeSettings?.upi_id || 'N/A'}</p>
                      </div>
                      <button 
                        onClick={() => setShowQR(false)}
                        className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black hover:bg-slate-700 transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {activeTab === 'attendance' && (
          <motion.div 
            key="attendance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Attendance Overview Card */}
            <div className="bg-white p-8 rounded-[32px] border border-primary/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black text-2xl">
                  {attendanceHistory.length > 0 
                    ? `${Math.round((attendanceHistory.filter(a => a.status === 'Present' || a.status === 'PRESENT' || a.status === 'Late' || a.status === 'LATE').length / attendanceHistory.length) * 100)}%`
                    : '100%'}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Cumulative Attendance</h3>
                  <p className="text-slate-500 font-medium">Tracking your presence since session start</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="px-6 py-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Present</p>
                  <p className="text-xl font-black text-emerald-700">
                    {attendanceHistory.filter(a => a.status === 'Present' || a.status === 'PRESENT' || a.status === 'Late' || a.status === 'LATE').length} Days
                  </p>
                </div>
                <div className="px-6 py-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Absent</p>
                  <p className="text-xl font-black text-rose-700">
                    {attendanceHistory.filter(a => a.status === 'Absent' || a.status === 'ABSENT').length} Days
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[32px] border border-primary/10 shadow-sm overflow-hidden">
               <div className="px-8 py-6 border-b border-slate-50">
                  <h3 className="font-black text-slate-800">Attendance Log</h3>
               </div>
               <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject / Course</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {attendanceHistory.map((att, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="px-8 py-4 text-sm font-bold text-slate-700">{formatDate(att.date)}</td>
                        <td className="px-8 py-4 text-sm font-bold text-slate-800">{att.subject || 'N/A'}</td>
                        <td className="px-8 py-4 text-xs font-bold text-slate-500">{att.method || 'Auto'}</td>
                        <td className="px-8 py-4 text-right">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            (att.status === 'Present' || att.status === 'PRESENT') && "bg-emerald-50 text-emerald-600",
                            (att.status === 'Absent' || att.status === 'ABSENT') && "bg-rose-50 text-rose-600",
                            (att.status === 'Late' || att.status === 'LATE') && "bg-amber-50 text-amber-600"
                          )}>
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {attendanceHistory.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold">No detailed attendance records found.</td>
                      </tr>
                    )}
                  </tbody>
               </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="bg-white p-8 rounded-[32px] border border-primary/10 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">My Profile & Own Details</h3>
                  <p className="text-sm text-slate-500 font-medium">Verified student record (Read Only)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Section 1: Basic Info */}
                <div className="space-y-4 bg-slate-50/55 p-6 rounded-3xl border border-slate-100">
                  <h4 className="text-xs font-black text-primary uppercase tracking-widest px-2 mb-3">Academic Identity</h4>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-2">Full Name</label>
                    <p className="px-2 py-1 text-sm font-black text-slate-800">{fullStudentProfile?.name || studentData?.name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-2">Student ID / Roll No</label>
                    <p className="px-2 py-1 text-sm font-black text-slate-800">{fullStudentProfile?.roll_no || fullStudentProfile?.id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-2">Course Enrolled</label>
                    <p className="px-2 py-1 text-sm font-black text-slate-800">{studentData?.courseName}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-2">Branch & Batch</label>
                    <p className="px-2 py-1 text-sm font-black text-slate-800">{studentData?.branch} ({studentData?.batch})</p>
                  </div>
                </div>

                {/* Section 2: Contact Info */}
                <div className="space-y-4 bg-slate-50/55 p-6 rounded-3xl border border-slate-100">
                  <h4 className="text-xs font-black text-primary uppercase tracking-widest px-2 mb-3">Contact Details</h4>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-2">Personal Email</label>
                    <p className="px-2 py-1 text-sm font-black text-slate-800 break-all">{fullStudentProfile?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-2">Phone Number</label>
                    <p className="px-2 py-1 text-sm font-black text-slate-800">{fullStudentProfile?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-2">Date of Birth</label>
                    <p className="px-2 py-1 text-sm font-black text-slate-800">{fullStudentProfile?.dob ? formatDate(fullStudentProfile.dob) : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-2">Gender & Blood Group</label>
                    <p className="px-2 py-1 text-sm font-black text-slate-800">
                      {fullStudentProfile?.gender || 'N/A'} {fullStudentProfile?.blood_group ? `• ${fullStudentProfile.blood_group}` : ''}
                    </p>
                  </div>
                </div>

                {/* Section 3: Parent & Address */}
                <div className="space-y-4 bg-slate-50/55 p-6 rounded-3xl border border-slate-100 md:col-span-2 lg:col-span-1">
                  <h4 className="text-xs font-black text-primary uppercase tracking-widest px-2 mb-3">Parent Info & Address</h4>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-2">Father / Mother / Guardian</label>
                    <p className="px-2 py-1 text-sm font-black text-slate-800">
                      {fullStudentProfile?.father_name || fullStudentProfile?.mother_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-2">Parent Phone</label>
                    <p className="px-2 py-1 text-sm font-black text-slate-800">{fullStudentProfile?.parent_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-2">Residential Address</label>
                    <p className="px-2 py-1 text-sm font-black text-slate-805 leading-relaxed">
                      {fullStudentProfile?.address || 'N/A'} 
                      {fullStudentProfile?.state ? `, ${fullStudentProfile.state}` : ''}
                      {fullStudentProfile?.pincode ? ` - ${fullStudentProfile.pincode}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'library' && (
          <motion.div 
            key="library"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="bg-white p-8 rounded-[32px] border border-primary/10 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Library Materials Borrowed</h3>
                  <p className="text-sm text-slate-500 font-medium">Real-time textbook issues and return status details (Read Only)</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Book Title / Author</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issued Date</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Returned Date</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {libraryIssues.map((issue, i) => (
                      <tr key={i} className="hover:bg-slate-55/40">
                        <td className="px-8 py-5">
                          <p className="font-bold text-slate-800 text-sm">{issue.library_items?.title || 'N/A'}</p>
                          <p className="text-[10px] font-medium text-slate-400">{issue.library_items?.author || 'Unknown Author'}</p>
                        </td>
                        <td className="px-8 py-5 text-slate-600 text-sm font-bold">{formatDate(issue.issue_date)}</td>
                        <td className="px-8 py-5 text-slate-600 text-sm font-bold">{formatDate(issue.due_date)}</td>
                        <td className="px-8 py-5 text-slate-500 text-sm font-medium">
                          {issue.return_date ? formatDate(issue.return_date) : '--'}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            issue.status === 'Returned' && "bg-emerald-50 text-emerald-600",
                            issue.status === 'Issued' && "bg-indigo-50 text-indigo-600",
                            issue.status === 'Overdue' && "bg-rose-50 text-rose-600"
                          )}>
                            {issue.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {libraryIssues.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold">
                          No library materials borrowed or issued yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'documents' && (
          <motion.div 
            key="documents"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Official / College Documents */}
              <div className="lg:col-span-3 bg-white p-8 rounded-[32px] border border-primary/10 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Award className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-xl font-black text-slate-800">Documents Submitted & Official Records</h3>
                </div>

                <div className="divide-y divide-slate-100">
                  {/* Official Documents Received */}
                  <div className="pb-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Official Certificates & Notices</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(documents || []).filter(d => d.category === 'Official').map((doc) => (
                        <div key={doc.id} className="p-5 bg-indigo-55/10 rounded-2xl border border-indigo-100 flex items-center justify-between hover:bg-indigo-55/20 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                              <File className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800">{doc.remarks || 'College Document'}</p>
                              <p className="text-[10px] font-bold text-slate-400">{formatDate(doc.created_at)} • {doc.document_type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a 
                              href={doc.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                              <Eye className="w-5 h-5" />
                            </a>
                            <a 
                              href={doc.file_url} 
                              download 
                              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                              <Download className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      ))}
                      {documents.filter(d => d.category === 'Official').length === 0 && (
                        <div className="col-span-full py-6 text-center text-slate-400 font-bold text-xs">No official certificates received.</div>
                      )}
                    </div>
                  </div>

                  {/* Personal Documents Submitted */}
                  <div className="pt-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 font-bold">Personal Document Records Submitted</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(documents || []).filter(d => d.category !== 'Official').map((doc) => (
                        <div key={doc.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-slate-100 transition-all">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              doc.document_type === 'Image' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                            )}>
                              {doc.document_type === 'Image' ? <User className="w-5 h-5" /> : <File className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800 truncate max-w-[200px]">{doc.remarks || 'Personal Document'}</p>
                              <p className="text-[10px] font-bold text-slate-400">{formatDate(doc.created_at)} • {doc.document_type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a 
                              href={doc.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                              <Eye className="w-5 h-5" />
                            </a>
                            <a 
                              href={doc.file_url} 
                              download 
                              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                              <Download className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      ))}
                      {documents.filter(d => d.category !== 'Official').length === 0 && (
                        <div className="col-span-full py-6 text-center text-slate-400 font-bold text-xs">No documents submitted yet.</div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'courses' && (
          <motion.div 
            key="courses"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {(courses || []).map((course) => (
              <div key={course.id} className={cn(
                "bg-white p-8 rounded-[32px] border transition-all group",
                course.id === studentData?.courseId ? "border-primary shadow-xl ring-4 ring-primary/5" : "border-primary/10 shadow-sm"
              )}>
                <div className="flex items-center justify-between mb-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    course.id === studentData?.courseId ? "bg-primary text-white" : "bg-primary/10 text-primary"
                  )}>
                    <BookOpen className="w-6 h-6" />
                  </div>
                  {course.id === studentData?.courseId && (
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">Enrolled</span>
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">{course.name}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-6">{course.description}</p>
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                    <p className="text-sm font-bold text-slate-700">{course.duration}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Credits</p>
                    <p className="text-sm font-bold text-slate-700">{course.credits}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'timetable' && (
          <motion.div 
            key="timetable"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[32px] border border-primary/10 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-primary/5 border-b border-primary/10">
                    <th className="px-8 py-5 text-[10px] font-black text-primary uppercase tracking-widest">Time Slot</th>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                      <th key={day} className="px-8 py-5 text-[10px] font-black text-primary uppercase tracking-widest text-center">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[
                    '09:00 AM - 10:00 AM',
                    '10:00 AM - 11:00 AM',
                    '11:00 AM - 12:00 PM',
                    '12:00 PM - 01:00 PM',
                    '02:00 PM - 03:00 PM',
                    '03:00 PM - 04:00 PM'
                  ].map(slot => (
                    <tr key={slot} className="group hover:bg-primary/5 transition-colors">
                      <td className="px-8 py-8 text-sm font-black text-slate-500 border-r border-slate-50 bg-white group-hover:bg-primary/5">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {slot}
                        </div>
                      </td>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                        const startTime = slot.split(' - ')[0];
                        const daySlots = (timetable || []).filter(s => s.day === day && s.startTime === startTime);
                        return (
                          <td key={day} className="px-4 py-4 min-w-[180px]">
                            {(daySlots || []).map(s => (
                              <div 
                                key={s.id} 
                                className={cn(
                                  "p-4 border rounded-2xl shadow-sm",
                                  s.type === 'Holiday' ? "bg-rose-50 border-rose-100" :
                                  s.type === 'Event' ? "bg-amber-50 border-amber-100" :
                                  "bg-white border-primary/10"
                                )}
                              >
                                <div className="flex items-center gap-1.5 mb-1">
                                  {s.type === 'Holiday' && <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[8px] font-black uppercase rounded shrink-0">Holiday</span>}
                                  {s.type === 'Event' && <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase rounded shrink-0">Event</span>}
                                  <p className={cn(
                                    "text-xs font-black uppercase tracking-tight truncate",
                                    s.type === 'Holiday' ? "text-rose-600" :
                                    s.type === 'Event' ? "text-amber-600" : "text-primary"
                                  )}>{s.subject}</p>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                                  <User className="w-3 h-3" />
                                  {s.faculty}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {s.room}
                                </div>
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'syllabus' && (
          <motion.div 
            key="syllabus"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-[32px] border border-primary/10 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Course Syllabus</h3>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">{studentData?.courseName}</p>
                </div>
              </div>
              <div className="space-y-4">
                {(syllabus || []).map((item) => (
                  <div key={item.id} className="flex items-start gap-6 p-6 bg-slate-50 rounded-[24px] group hover:bg-white hover:border-primary/10 border border-transparent transition-all">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary font-black text-lg shadow-sm shrink-0 group-hover:border-primary/10 border border-slate-100">
                      {item.unit_number || item.unitNumber || '1'}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800 mb-1">{item.unit_title || item.title || 'Introduction'}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
                {syllabus.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-slate-400 font-bold">Syllabus not yet updated for this course.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'studylog' && (
          <motion.div 
            key="studylog"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {(studyLogs || []).map((log) => (
              <div key={log.id} className="bg-white rounded-[32px] border border-primary/10 shadow-sm overflow-hidden hover:shadow-md transition-all">
                <div className="p-6 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800">{formatDate(log.date)}</h3>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{log.batch}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activities Covered</p>
                    <div className="space-y-2">
                      {(log.activities || []).map((activity: string, i: number) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-slate-600 font-bold">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          {activity}
                        </div>
                      ))}
                    </div>
                  </div>
                  {(log.assignment_subject || log.assignment_topic) && (
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <p className="text-xs font-black text-primary uppercase tracking-widest">Assignment</p>
                      </div>
                      <p className="text-sm font-black text-slate-800">{log.assignment_subject}</p>
                      <p className="text-xs text-slate-500 font-bold mt-1">{log.assignment_topic}</p>
                    </div>
                  )}
                  {log.remarks && (
                    <div className="pt-4 border-t border-slate-50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Teacher's Remarks</p>
                      <p className="text-xs text-slate-500 font-medium italic">"{log.remarks}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {studyLogs.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-[32px] border border-primary/10">
                <p className="text-slate-400 font-bold">No study logs entered by faculty yet.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Detail Modal */}
      <AnimatePresence>
        {isResultModalOpen && selectedResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsResultModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800">Exam Performance</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedResult.exams?.title} • {selectedResult.exams?.subject}</p>
                  </div>
                </div>
                <button onClick={() => setIsResultModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                   <AlertCircle className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left: Summary */}
                    <div className="space-y-8">
                       <div className="grid grid-cols-2 gap-6">
                          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Marks Obtained</p>
                             <p className="text-4xl font-black text-slate-900">{selectedResult.marks_obtained} <span className="text-lg text-slate-400">/ {selectedResult.total_marks}</span></p>
                          </div>
                          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Percentage</p>
                             <p className="text-4xl font-black text-primary">{Math.round((selectedResult.marks_obtained/selectedResult.total_marks) * 100)}%</p>
                          </div>
                       </div>

                       <div className="p-8 bg-indigo-50 rounded-[40px] border border-indigo-100">
                          <h4 className="font-black text-indigo-900 mb-4">Feedback & Remarks</h4>
                          <p className="text-sm font-medium text-indigo-700 leading-relaxed italic">
                             {selectedResult.evaluation_comment || "No specific comments provided. Great effort!"}
                          </p>
                          <div className="mt-8 pt-6 border-t border-indigo-100 flex items-center justify-between">
                            <span className={cn(
                              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                              selectedResult.marks_obtained >= (selectedResult.total_marks * 0.4) ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-rose-500 text-white shadow-lg shadow-rose-200"
                            )}>
                              {selectedResult.marks_obtained >= (selectedResult.total_marks * 0.4) ? "Passed" : "Not Qualified"}
                            </span>
                            <p className="text-[10px] font-black text-indigo-400 uppercase">Evaluated on: {formatDate(selectedResult.created_at)}</p>
                          </div>
                       </div>
                    </div>

                    {/* Right: Answer Sheet */}
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                             <FileText className="w-4 h-4 text-primary" />
                             {selectedResult.evaluated_sheet_url ? 'Evaluated Sheet' : 'Scanned Sheet'}
                          </h4>
                          {(selectedResult.evaluated_sheet_url || selectedResult.scanned_sheet_url) && (
                            <a 
                              href={selectedResult.evaluated_sheet_url || selectedResult.scanned_sheet_url} 
                              download
                              className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:underline"
                            >
                               <Download className="w-3 h-3" /> Download
                            </a>
                          )}
                       </div>
                       <div className="aspect-[3/4] bg-slate-100 rounded-[40px] border-4 border-slate-50 overflow-hidden shadow-inner relative group">
                          {selectedResult.evaluated_sheet_url || selectedResult.scanned_sheet_url ? (
                            (selectedResult.evaluated_sheet_url || selectedResult.scanned_sheet_url || '').toLowerCase().endsWith('.pdf') ? (
                              <iframe 
                                src={selectedResult.evaluated_sheet_url || selectedResult.scanned_sheet_url} 
                                className="w-full h-full border-none"
                                title="Sheet Preview"
                              />
                            ) : (
                              <img 
                                src={selectedResult.evaluated_sheet_url || selectedResult.scanned_sheet_url} 
                                alt="Evaluated Sheet" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            )
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50">
                               <FileText className="w-12 h-12 mb-4 opacity-10" />
                               <p className="text-sm font-black">No Preview Available</p>
                               <p className="text-[10px] mt-1 font-bold uppercase tracking-widest">Digital Entry</p>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
