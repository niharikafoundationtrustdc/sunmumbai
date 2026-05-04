import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  UserCheck,
  Calendar,
  FileText,
  Scan,
  Settings as SettingsIcon,
  History,
  QrCode,
  Camera,
  Globe,
  MapPin,
  MoreVertical,
  User
} from 'lucide-react';
import { cn, formatDate, safeLocalStorageSet } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { exportToPDF, exportToExcel } from '../../lib/exportUtils';
import { AttendanceScanner } from './AttendanceScanner';
import { AttendanceSettings } from './AttendanceSettings';
import { supabase } from '../../lib/supabase';

interface AttendanceRecord {
  id: string;
  student_id: string;
  name: string;
  roll: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'INVALID_ENTRY';
  time?: string;
  ip?: string;
  location?: string;
  method?: string;
  course: string;
  course_id?: string;
  year: string;
  branch: string;
  batch: string;
  section: string;
  subject?: string;
}

export const Attendance: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filters, setFilters] = useState({
    course: 'All',
    year: 'All',
    branch: 'All',
    batch: 'All',
    section: 'All',
    subject: 'All',
    search: ''
  });
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [academicSettings, setAcademicSettings] = useState<any>({
    sessions: [],
    courses: [],
    branches: [],
    semesters: [],
    batches: []
  });
  const [showScanner, setShowScanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('attendance_settings');
    return saved ? JSON.parse(saved) : {
      startTime: '09:00',
      lateThreshold: '09:15',
      absentThreshold: '09:45'
    };
  });

  useEffect(() => {
    const init = async () => {
      await fetchAcademicSettings();
      await fetchCourses();
    };
    init();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedDate, filters.course, filters.branch, filters.year, filters.section, filters.batch, courses]);

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('id, name, code').order('name');
    if (data) setCourses(data);
  };

  const fetchAcademicSettings = async () => {
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'academic').single();
    if (data?.value) setAcademicSettings(data.value);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch students based on filters
      let studentQuery = supabase.from('students').select('*');
      
      if (filters.course !== 'All') {
        // Find course ID if we have the name
        const course = (courses || []).find(c => c.name === filters.course || c.id === filters.course);
        if (course) {
          studentQuery = studentQuery.or(`course_id.eq.${course.id},branch.eq.${filters.course}`);
        } else {
          studentQuery = studentQuery.eq('branch', filters.course);
        }
      }
      
      if (filters.branch !== 'All') studentQuery = studentQuery.eq('branch', filters.branch);
      if (filters.year !== 'All') studentQuery = studentQuery.eq('year', filters.year);
      if (filters.batch !== 'All') studentQuery = studentQuery.eq('batch', filters.batch);
      if (filters.section !== 'All') studentQuery = studentQuery.eq('section', filters.section);

      const { data: studentList, error: studentError } = await studentQuery;
      if (studentError) throw studentError;

      // Fetch attendance for the selected date
      const { data: attendanceList, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', selectedDate);
      if (attendanceError) throw attendanceError;

      const mergedData = (studentList || []).map(student => {
        const record = (attendanceList || []).find(a => a.student_id === student.id);
        const course = courses.find(c => c.id === student.course_id);
        
        return {
          id: record?.id || `temp-${student.id}`,
          student_id: student.id,
          name: student.name || 'Unknown',
          roll: student.roll_no || 'N/A',
          status: (record?.status?.toUpperCase() || 'ABSENT') as any,
          time: record?.time || '--:--',
          method: record?.method || 'N/A',
          course: course?.name || student.branch || 'N/A',
          course_id: student.course_id,
          year: student.year || '1st Year',
          branch: student.branch || 'N/A',
          batch: student.batch || 'N/A',
          section: student.section || 'A',
          subject: record?.subject || (filters.subject !== 'All' ? filters.subject : 'General')
        };
      });

      setStudents(studentList || []);
      setAttendanceData(mergedData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    safeLocalStorageSet('attendance_settings', settings);
  }, [settings]);

  const handleStatusChange = async (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'INVALID_ENTRY', customData?: any) => {
    try {
      const student = (students || []).find(s => s.id === studentId);
      const existingRecord = (attendanceData || []).find(a => a.student_id === studentId && !a.id.startsWith('temp-'));

      const recordData = {
        student_id: studentId,
        date: selectedDate,
        status: (status || '').charAt(0) + (status || '').slice(1).toLowerCase(),
        time: customData?.time || new Date().toTimeString().split(' ')[0],
        method: customData?.method || 'MANUAL',
        subject: customData?.subject || filters.subject !== 'All' ? filters.subject : 'General',
        course_id: student?.course_id,
        branch: student?.branch,
        batch: student?.batch,
        year: student?.year,
        semester: student?.semester,
        section: student?.section
      };

      const { error } = await supabase
        .from('attendance')
        .upsert([recordData], { onConflict: 'student_id,date,subject' });
      
      if (error) throw error;

      setEditingRecord(null);
      fetchData();
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      const studentIdDisplay = studentId;
      alert(`Error updating attendance for student ID: ${studentIdDisplay}\n\nError: ${error.message || 'Unknown error'}\n\nPlease ensure this student is correctly registered in the system.`);
    }
  };

  const handleScanSuccess = async (record: any) => {
    try {
      // Find student in current list or fetch from DB
      let targetStudent = (students || []).find(s => 
        s.id === record.studentId || 
        (s.roll_no && s.roll_no === record.studentId) ||
        (s.name && s.name === record.studentName)
      );
      
      if (!targetStudent) {
        // Try direct lookup if not in loaded list
        const { data: studentFromDb } = await supabase
          .from('students')
          .select('*')
          .or(`id.eq.${record.studentId},roll_no.eq.${record.studentId},name.eq.${record.studentName}`)
          .maybeSingle();
        
        if (studentFromDb) {
          targetStudent = studentFromDb;
        }
      }

      if (!targetStudent) {
        alert('Student not found! Please check if the student is registered.');
        return;
      }

      const recordData = {
        student_id: targetStudent.id,
        date: selectedDate,
        status: (record.status || 'Present').charAt(0).toUpperCase() + (record.status || 'Present').slice(1).toLowerCase(),
        time: record.time || new Date().toTimeString().split(' ')[0],
        method: record.method || 'QR',
        subject: record.subject || 'General',
        ip_address: record.ip || '0.0.0.0',
        location: record.location || 'Unknown',
        course_id: targetStudent.course_id,
        branch: targetStudent.branch,
        batch: targetStudent.batch,
        year: targetStudent.year,
        semester: targetStudent.semester,
        section: targetStudent.section
      };

      const { error } = await supabase
        .from('attendance')
        .upsert([recordData], { onConflict: 'student_id,date,subject' });
      
      if (error) {
        console.error('Upsert failed, trying manual update:', error);
        const { data: existing } = await supabase
          .from('attendance')
          .select('id')
          .eq('student_id', targetStudent.id)
          .eq('date', selectedDate)
          .maybeSingle();
        
        if (existing) {
          await supabase.from('attendance').update(recordData).eq('id', existing.id);
        } else {
          await supabase.from('attendance').insert([recordData]);
        }
      }

      fetchData();
    } catch (error: any) {
      console.error('Error saving scanned attendance:', error);
      alert('Error saving scanned attendance: ' + (error.message || 'Unknown error'));
    }
  };

  const filteredData = (attendanceData || []).filter(student => {
    const matchesSearch = (student.name || '').toLowerCase().includes(filters.search.toLowerCase()) || 
                         (student.roll || '').toLowerCase().includes(filters.search.toLowerCase());
    return matchesSearch;
  });

  const handleMarkAll = async (status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    if (filteredData.length === 0) return;
    
    setIsLoading(true);
    try {
      const records = (filteredData || []).map(student => ({
        student_id: student.student_id,
        date: selectedDate,
        status: (status || '').charAt(0) + (status || '').slice(1).toLowerCase(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        method: 'MANUAL',
        subject: student.subject || 'General',
        course_id: student.course_id,
        branch: student.branch,
        batch: student.batch,
        year: student.year,
        semester: student.year, // Fallback mapping
        section: student.section
      }));

      for (const record of records) {
        const { error } = await supabase
          .from('attendance')
          .upsert([record], { onConflict: 'student_id,date,subject' });
        
        if (error) {
          console.error('Bulk mark error for:', record.student_id, error);
        }
      }
      
      fetchData();
    } catch (error) {
      console.error('Error marking all:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    const headers = ['ID', 'Name', 'Roll No', 'Course', 'Year', 'Branch', 'Batch', 'Section', 'Status', 'Time', 'Method'];
    const data = (filteredData || []).map(s => [s.student_id, s.name, s.roll, s.course, s.year, s.branch, s.batch, s.section, s.status, s.time || '-', s.method || '-']);
    exportToPDF('Attendance Report', headers, data, `Attendance_${selectedDate}_Batch_${filters.batch}`);
  };

  const handleExportExcel = () => {
    exportToExcel(filteredData, `Attendance_${selectedDate}_Batch_${filters.batch}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Management</h1>
          <p className="text-slate-500">Mark daily or subject-wise attendance for your classes.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold transition-all shadow-sm",
                showSettings ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <SettingsIcon className="w-4 h-4" />
              Settings
            </button>
            <button 
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
            >
              <Scan className="w-4 h-4" />
              Scan Attendance
            </button>
          </div>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <AttendanceSettings 
              settings={settings} 
              onSave={(newSettings) => { setSettings(newSettings); setShowSettings(false); }} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Search */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Date</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Course</label>
            <select 
              value={filters.course}
              onChange={(e) => setFilters({...filters, course: e.target.value})}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Courses</option>
              {academicSettings.courses?.map((c: string) => <option key={c} value={c}>{c}</option>)}
              {(courses || []).filter(c => !academicSettings.courses?.includes(c.name)).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Year/Sem</label>
            <select 
              value={filters.year}
              onChange={(e) => setFilters({...filters, year: e.target.value})}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Years/Sem</option>
              {(academicSettings.semesters || []).map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Branch</label>
            <select 
              value={filters.branch}
              onChange={(e) => setFilters({...filters, branch: e.target.value})}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Branches</option>
              {(academicSettings.branches || []).map((b: string) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Subject</label>
            <select 
              value={filters.subject}
              onChange={(e) => setFilters({...filters, subject: e.target.value})}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Subjects</option>
              <option value="General">General</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Batch</label>
            <select 
              value={filters.batch}
              onChange={(e) => setFilters({...filters, batch: e.target.value})}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Batches</option>
              {(academicSettings.batches || []).map((b: string) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Section</label>
            <select 
              value={filters.section}
              onChange={(e) => setFilters({...filters, section: e.target.value})}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={fetchData}
              className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <History className="w-4 h-4" />
              Fetch
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by Name or Roll Number..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Present</p>
            <p className="text-2xl font-bold text-slate-900">{(filteredData || []).filter(s => s.status === 'PRESENT').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Absent</p>
            <p className="text-2xl font-bold text-slate-900">{(filteredData || []).filter(s => s.status === 'ABSENT').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Late</p>
            <p className="text-2xl font-bold text-slate-900">{(filteredData || []).filter(s => s.status === 'LATE').length}</p>
          </div>
        </div>
      </div>

      {/* Attendance Table & Detailed Report */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <h3 className="font-black text-slate-800">Attendance Log & Report</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => handleMarkAll('PRESENT')}
              className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-all"
            >
              Mark All Present
            </button>
            <button 
              onClick={() => handleMarkAll('ABSENT')}
              className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
            >
              Mark All Absent
            </button>
            <button 
              onClick={() => handleMarkAll('LATE')}
              className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all"
            >
              Mark All Late
            </button>
            <div className="h-4 w-px bg-slate-200 mx-2 hidden sm:block" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Auto-Refresh: ON</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time & Method</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Network & Location</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(filteredData || []).map((student, i) => (
                <motion.tr 
                  key={student.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{student.name}</p>
                        <p className="text-xs text-slate-400">{student.roll} • {student.course} {student.branch}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleStatusChange(student.id, 'PRESENT')}
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                          student.status === 'PRESENT' ? "bg-green-100 text-green-600 shadow-sm" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        )}
                      >
                        Present
                      </button>
                      <button 
                        onClick={() => handleStatusChange(student.id, 'LATE')}
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                          student.status === 'LATE' ? "bg-amber-100 text-amber-600 shadow-sm" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        )}
                      >
                        Late
                      </button>
                      <button 
                        onClick={() => handleStatusChange(student.id, 'ABSENT')}
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                          student.status === 'ABSENT' ? "bg-red-100 text-red-600 shadow-sm" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        )}
                      >
                        Absent
                      </button>
                      <button 
                        onClick={() => handleStatusChange(student.id, 'INVALID_ENTRY')}
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                          student.status === 'INVALID_ENTRY' ? "bg-rose-100 text-rose-600 shadow-sm" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        )}
                      >
                        Invalid
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {student.time || '--:--'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                        {student.method === 'QR' ? <QrCode className="w-3 h-3" /> : student.method === 'FACE' ? <Camera className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {student.method || 'MANUAL'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <Globe className="w-3 h-3 text-indigo-400" />
                        {student.ip || '0.0.0.0'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <MapPin className="w-3 h-3 text-rose-400" />
                        <span className="truncate max-w-[120px]">{student.location || 'Unknown'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setEditingRecord(student)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {editingRecord && (
          <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30">
                <div>
                  <h2 className="text-2xl font-black text-indigo-900">Edit Attendance</h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{editingRecord.name} • {editingRecord.roll}</p>
                </div>
                <button onClick={() => setEditingRecord(null)} className="p-2 hover:bg-white rounded-xl"><XCircle className="w-6 h-6 text-slate-400"/></button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['PRESENT', 'LATE', 'ABSENT', 'INVALID_ENTRY'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setEditingRecord({...editingRecord, status: s as any})}
                          className={cn(
                            "px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                            editingRecord.status === s 
                              ? "bg-indigo-50 border-indigo-600 text-indigo-600 shadow-inner" 
                              : "bg-white border-slate-100 text-slate-400 hover:border-indigo-200"
                          )}
                        >
                          {s.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Time</label>
                      <input 
                        type="time" 
                        value={editingRecord.time || ''} 
                        onChange={(e) => setEditingRecord({...editingRecord, time: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold border-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Method</label>
                      <select 
                        value={editingRecord.method || 'MANUAL'} 
                        onChange={(e) => setEditingRecord({...editingRecord, method: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold border-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="MANUAL">Manual</option>
                        <option value="QR">QR Scan</option>
                        <option value="FACE">Face Recognition</option>
                        <option value="APP">Mobile App</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                  <input 
                    type="text" 
                    value={editingRecord.subject || ''} 
                    onChange={(e) => setEditingRecord({...editingRecord, subject: e.target.value})}
                    placeholder="e.g. Mathematics"
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold border-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="p-8 bg-slate-50 flex justify-end gap-3">
                <button 
                  onClick={() => setEditingRecord(null)} 
                  className="px-6 py-3 font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleStatusChange(editingRecord.student_id, editingRecord.status, editingRecord)} 
                  className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform flex items-center gap-2"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showScanner && (
        <AttendanceScanner 
          settings={settings}
          selectedDate={selectedDate}
          onClose={() => setShowScanner(false)}
          onScanSuccess={handleScanSuccess}
        />
      )}
    </div>
  );
};
