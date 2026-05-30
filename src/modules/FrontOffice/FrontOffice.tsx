import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  Trash2, 
  Edit2, 
  X,
  Save,
  MessageSquare,
  AlertCircle,
  Camera,
  UserCheck,
  Clock,
  LogOut,
  MapPin,
  RefreshCw,
  IdCard,
  UserPlus,
  Book,
  FileText,
  Send,
  Filter,
  CheckCircle2,
  Archive,
  Inbox,
  Key,
  Copy,
  Check,
  Smartphone,
  Share2
} from 'lucide-react';
import Webcam from 'react-webcam';
import { supabase, testSupabaseConnection } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

export const FrontOffice: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'enquiries' | 'visitors' | 'registration' | 'communication' | 'documents' | 'library' | 'students'>('enquiries');
  const [registrationSubTab, setRegistrationSubTab] = useState<'student' | 'staff'>('student');
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  // Custom Front Office student details & credentials states
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any>(null);
  const [credentialsStudent, setCredentialsStudent] = useState<any>(null);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [fetchedCreds, setFetchedCreds] = useState<{
    studentId: string;
    studentPass: string;
    parentId: string;
    parentPass: string;
  } | null>(null);
  const [copiedType, setCopiedType] = useState<'student' | 'parent' | null>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [libraryBooks, setLibraryBooks] = useState<any[]>([]);
  const [documentRecords, setDocumentRecords] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [librarySearch, setLibrarySearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<any>(null);
  const [editingVisitor, setEditingVisitor] = useState<any>(null);
  
  const [enquiryForm, setEnquiryForm] = useState<any>({
    status: 'Pending'
  });

  const [visitorForm, setVisitorForm] = useState<any>({
    name: '',
    phone: '',
    purpose: '',
    person_to_meet: '',
    id_proof_type: 'Aadhaar',
    id_proof_number: '',
    remarks: ''
  });

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const webcamRef = React.useRef<Webcam>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [dbStatus, setDbStatus] = useState({ connected: true, message: '' });

  const [studentForm, setStudentForm] = useState<any>({
    first_name: '',
    surname: '',
    email: '',
    phone: '',
    course_id: '',
    parent_name: '',
    parent_phone: '',
    status: 'Active'
  });

  const [staffForm, setStaffForm] = useState<any>({
    name: '',
    email: '',
    phone: '',
    role: 'FACULTY',
    status: 'Active'
  });

  const [libraryIssueForm, setLibraryIssueForm] = useState<any>({
    book_id: '',
    student_id: '',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [documentForm, setDocumentForm] = useState<any>({
    student_id: '',
    document_type: '',
    category: 'Academic',
    status: 'Submitted'
  });

  const [communicationForm, setCommunicationForm] = useState<any>({
    title: '',
    message: '',
    type: 'INFO',
    audience: 'All'
  });

  const handleIssueBookFromList = (book: any) => {
    setLibraryIssueForm({
      ...libraryIssueForm,
      book_id: book.id
    });
    setActiveTab('library');
    setIsModalOpen(true);
  };

  const handleSaveCommunication = async () => {
    if (!communicationForm.title || !communicationForm.message) {
      alert('Title and Message are required');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('notices').insert([{
        title: communicationForm.title,
        content: communicationForm.message,
        type: communicationForm.type === 'ALERT' ? 'Notice' : 'Circular',
        audience: communicationForm.audience
      }]);
      if (error) throw error;
      alert('Notice/Alert published!');
      setIsModalOpen(false);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const result = await testSupabaseConnection();
      setDbStatus(result);
      if (result.connected) {
        await Promise.all([
          fetchEnquiries(),
          fetchVisitors(),
          fetchStudents(),
          fetchStaff(),
          fetchCourses(),
          fetchLibraryBooks(),
          fetchDocumentRecords()
        ]);
      }
    };
    init();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('*').order('name');
    if (data) setStudents(data);
  };

  const handleViewCredentials = async (student: any) => {
    setCredentialsStudent(student);
    setIsCredentialsModalOpen(true);
    setFetchedCreds(null);
    setCopiedType(null);
    try {
      const { data: studentCreds } = await supabase
        .from('user_credentials')
        .select('password')
        .eq('id', student.id)
        .maybeSingle();

      const { data: parentCreds } = await supabase
        .from('user_credentials')
        .select('password')
        .eq('id', `P-${student.id}`)
        .maybeSingle();

      setFetchedCreds({
        studentId: student.id,
        studentPass: studentCreds?.password || '12345',
        parentId: `P-${student.id}`,
        parentPass: parentCreds?.password || '12345'
      });
    } catch (err) {
      console.error('Error fetching student credentials:', err);
      setFetchedCreds({
        studentId: student.id,
        studentPass: '12345',
        parentId: `P-${student.id}`,
         parentPass: '12345'
      });
    }
  };

  const fetchStaff = async () => {
    const { data } = await supabase.from('staff').select('*').order('name');
    if (data) setStaff(data);
  };

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('id, name');
    if (data) setCourses(data);
  };

  const fetchLibraryBooks = async () => {
    const { data } = await supabase.from('library_items').select('*').order('title');
    if (data) setLibraryBooks(data);
  };

  const fetchDocumentRecords = async () => {
    const { data } = await supabase.from('student_document_records').select('*, students(name)').order('created_at', { ascending: false });
    if (data) setDocumentRecords(data);
  };

  const fetchVisitors = async () => {
    const { data, error } = await supabase
      .from('visitor_log')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching visitors:', error);
    } else if (data) {
      setVisitors(data);
    }
  };

  const fetchEnquiries = async () => {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching enquiries:', error);
    } else if (data) {
      setEnquiries(data);
    }
  };

  const handleSaveEnquiry = async () => {
    if (!enquiryForm.student_name || !enquiryForm.phone) {
      alert('Student Name and Phone are required');
      return;
    }
    setIsSaving(true);

    const enquiryData: any = {
      student_name: enquiryForm.student_name.trim(),
      parent_name: enquiryForm.parent_name?.trim() || '',
      phone: enquiryForm.phone.trim(),
      status: enquiryForm.status || 'Pending'
    };

    try {
      let error;
      if (editingEnquiry) {
        const { error: err } = await supabase
          .from('enquiries')
          .update(enquiryData)
          .eq('id', editingEnquiry.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from('enquiries')
          .insert([enquiryData]);
        error = err;
      }

      if (error) throw error;

      setIsModalOpen(false);
      setEditingEnquiry(null);
      setEnquiryForm({ status: 'Pending' });
      await fetchEnquiries();
    } catch (error: any) {
      alert(`Error saving enquiry: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVisitor = async () => {
    if (!visitorForm.name || !visitorForm.phone) {
      alert('Name and Phone are required');
      return;
    }
    if (!capturedPhoto && !editingVisitor) {
      alert('Visitor photo is mandatory for check-in');
      return;
    }
    setIsSaving(true);

    const visitorId = capturedPhoto ? `VIS-${Date.now()}` : `VIS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const visitorData: any = {
      visitor_no: editingVisitor?.visitor_no || visitorId,
      name: visitorForm.name.trim(),
      phone: visitorForm.phone.trim(),
      purpose: visitorForm.purpose || '',
      person_to_meet: visitorForm.person_to_meet || '',
      photo_url: capturedPhoto,
      id_proof_type: visitorForm.id_proof_type,
      id_proof_number: visitorForm.id_proof_number,
      remarks: visitorForm.remarks || ''
    };

    try {
      let error;
      if (editingVisitor) {
        const { error: err } = await supabase
          .from('visitor_log')
          .update(visitorData)
          .eq('id', editingVisitor.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from('visitor_log')
          .insert([visitorData]);
        error = err;
      }

      if (error) throw error;

      setIsModalOpen(false);
      setEditingVisitor(null);
      setCapturedPhoto(null);
      setVisitorForm({
        name: '',
        phone: '',
        purpose: '',
        person_to_meet: '',
        id_proof_type: 'Aadhaar',
        id_proof_number: '',
        remarks: ''
      });
      await fetchVisitors();
    } catch (error: any) {
      alert(`Error saving visitor: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVisitorCheckOut = async (id: string) => {
    if (window.confirm('Mark visitor as checked out?')) {
      const { error } = await supabase
        .from('visitor_log')
        .update({ out_time: new Date().toISOString() })
        .eq('id', id);
      
      if (error) {
        alert(`Error checking out: ${error.message}`);
      } else {
        await fetchVisitors();
      }
    }
  };

  const handleSaveStudentRegistration = async () => {
    if (!studentForm.first_name || !studentForm.surname || !studentForm.phone) {
      alert('First Name, Surname and Phone are required');
      return;
    }
    setIsSaving(true);
    try {
      const studentId = `STU${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;
      const { error } = await supabase.from('students').insert([{
        id: studentId,
        first_name: studentForm.first_name,
        surname: studentForm.surname,
        name: `${studentForm.first_name} ${studentForm.surname}`,
        email: studentForm.email || null,
        phone: studentForm.phone,
        course_id: studentForm.course_id || null,
        parent_name: studentForm.parent_name || null,
        parent_phone: studentForm.parent_phone || null,
        status: 'Active'
      }]);
      if (error) throw error;
      alert('Student registered successfully!');
      setIsModalOpen(false);
      await fetchStudents();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStaffRegistration = async () => {
    if (!staffForm.name || !staffForm.phone) {
      alert('Name and Phone are required');
      return;
    }
    setIsSaving(true);
    try {
      const staffId = `FAC${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;
      const { error } = await supabase.from('staff').insert([{
        id: staffId,
        name: staffForm.name,
        email: staffForm.email,
        phone: staffForm.phone,
        role: staffForm.role,
        status: 'Active'
      }]);
      if (error) throw error;
      alert('Staff registered successfully!');
      setIsModalOpen(false);
      await fetchStaff();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLibraryIssue = async () => {
    if (!libraryIssueForm.book_id || !libraryIssueForm.student_id) {
      alert('Book and Student selection is required');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('library_issues').insert([libraryIssueForm]);
      if (error) throw error;

      // Update book availability
      const book = libraryBooks.find(b => b.id === libraryIssueForm.book_id);
      if (book) {
        await supabase.from('library_items')
          .update({ available: Math.max(0, (book.available || 1) - 1) })
          .eq('id', book.id);
      }

      alert('Book issued successfully!');
      setIsModalOpen(false);
      await fetchLibraryBooks();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDocumentRecord = async () => {
    if (!documentForm.student_id || !documentForm.document_type) {
      alert('Student and Document Type are required');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('student_document_records').insert([documentForm]);
      if (error) throw error;
      alert('Document record saved!');
      setIsModalOpen(false);
      await fetchDocumentRecords();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEnquiry = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this enquiry?')) {
      const { error } = await supabase.from('enquiries').delete().eq('id', id);
      if (error) alert(`Error deleting enquiry: ${error.message}`);
      else fetchEnquiries();
    }
  };

  const deleteVisitor = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this visitor log?')) {
      const { error } = await supabase.from('visitor_log').delete().eq('id', id);
      if (error) alert(`Error deleting record: ${error.message}`);
      else fetchVisitors();
    }
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedPhoto(imageSrc);
      setIsCameraActive(false);
    }
  };

  const filteredEnquiries = enquiries.filter(e => 
    (e.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.phone || '').includes(searchQuery)
  );

  const filteredVisitors = visitors.filter(v => 
    (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.phone || '').includes(searchQuery) ||
    (v.visitor_no || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Database Connection Warning */}
      {!dbStatus.connected && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm font-medium">Database connection issue: {dbStatus.message}. Please check your Supabase configuration.</p>
        </motion.div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Front Office</h1>
          <p className="text-slate-500 font-medium mt-1">Manage student enquiries and follow-ups.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (activeTab === 'enquiries') {
                setEditingEnquiry(null);
                setEnquiryForm({ status: 'Pending' });
              } else {
                setEditingVisitor(null);
                setVisitorForm({
                  name: '',
                  phone: '',
                  purpose: '',
                  person_to_meet: '',
                  id_proof_type: 'Aadhaar',
                  id_proof_number: '',
                  remarks: ''
                });
                setCapturedPhoto(null);
              }
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            {activeTab === 'enquiries' ? 'Add Enquiry' : 'Log Visitor'}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by student name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-50 rounded-2xl w-full">
          {[
            { id: 'enquiries', label: 'Enquiries', icon: MessageSquare },
            { id: 'visitors', label: 'Visitors', icon: UserCheck },
            { id: 'registration', label: 'Registration', icon: UserPlus },
            { id: 'students', label: 'Student Details & Credentials', icon: Users },
            { id: 'communication', label: 'Communication', icon: Send },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'library', label: 'Library', icon: Book }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        {activeTab === 'enquiries' ? (
          <table className="w-full text-left">
            {/* Existing Enquiries Table Content */}
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Details</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Parent Name</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-bold">No enquiries found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                (filteredEnquiries || []).map((enquiry) => (
                  <tr key={enquiry.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                          <Users className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-slate-700">{enquiry.student_name}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-medium text-slate-600">{enquiry.parent_name || '-'}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {enquiry.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        enquiry.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600' :
                        enquiry.status === 'Follow-up' ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-50 text-slate-600'
                      }`}>
                        {enquiry.status}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(enquiry.created_at)}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingEnquiry(enquiry);
                            setEnquiryForm(enquiry);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all shadow-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteEnquiry(enquiry.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : activeTab === 'visitors' ? (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Visitor Info</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Purpose / Meeting</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">IN Time</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">OUT Time</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Photo</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <UserCheck className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-bold">No visitors found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                (filteredVisitors || []).map((visitor) => (
                  <tr key={visitor.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                          <IdCard className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-700">{visitor.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{visitor.visitor_no}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold mt-0.5">
                            <Phone className="w-3 h-3" />
                            {visitor.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-bold text-slate-700">{visitor.purpose || '-'}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
                          <Users className="w-3 h-3 text-primary/60" />
                          To meet: <span className="text-primary">{visitor.person_to_meet || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-medium">{formatDate(visitor.in_time)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {visitor.out_time ? (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-rose-500" />
                          <span className="font-medium">{formatDate(visitor.out_time)}</span>
                        </div>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-black tracking-widest uppercase">
                          Inside
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      {visitor.photo_url ? (
                        <div className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                          <img 
                            src={visitor.photo_url} 
                            alt={visitor.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-200">
                          <Camera className="w-5 h-5 text-slate-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        {!visitor.out_time && (
                          <button 
                            onClick={() => handleVisitorCheckOut(visitor.id)}
                            title="Check Out"
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm border border-emerald-100"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setEditingVisitor(visitor);
                            setVisitorForm(visitor);
                            setCapturedPhoto(visitor.photo_url);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all shadow-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteVisitor(visitor.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : activeTab === 'registration' ? (
          <div className="p-8 space-y-8">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <button 
                onClick={() => setRegistrationSubTab('student')}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-black transition-all ${
                  registrationSubTab === 'student' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Users className="w-4 h-4" />
                Student Admission
              </button>
              <button 
                onClick={() => setRegistrationSubTab('staff')}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-black transition-all ${
                  registrationSubTab === 'staff' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Staff/Faculty Entry
              </button>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 border-dashed text-center">
              <Plus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-black text-slate-800">
                Register New {registrationSubTab === 'student' ? 'Student' : 'Staff Member'}
              </h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                Quick registration process for new {registrationSubTab === 'student' ? 'admissions' : 'staff members'}. 
                Full profile and credentials can be managed in the respective modules.
              </p>
              <button 
                onClick={() => {
                  if (registrationSubTab === 'student') {
                    setStudentForm({
                      first_name: '',
                      surname: '',
                      email: '',
                      phone: '',
                      course_id: '',
                      parent_name: '',
                      parent_phone: '',
                      status: 'Active'
                    });
                  } else {
                    setStaffForm({
                      name: '',
                      email: '',
                      phone: '',
                      role: 'FACULTY',
                      status: 'Active'
                    });
                  }
                  setIsModalOpen(true);
                }}
                className="bg-white px-8 py-3 rounded-2xl font-black text-primary border-2 border-primary/20 hover:border-primary transition-all shadow-sm"
              >
                Launch Registration Form
              </button>
            </div>
          </div>
        ) : activeTab === 'communication' ? (
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex flex-col gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800">Call Logs</h4>
                  <p className="text-xs text-slate-500 font-medium">Record telephonic enquiries.</p>
                </div>
                <button className="mt-2 w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all">
                  Log Call
                </button>
              </div>
              <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 flex flex-col gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800">Message Alerts</h4>
                  <p className="text-xs text-slate-500 font-medium">Send SMS or Email alerts.</p>
                </div>
                <button className="mt-2 w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all">
                  Send Alert
                </button>
              </div>
              <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 flex flex-col gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                  <Inbox className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800">Enquiry Response</h4>
                  <p className="text-xs text-slate-500 font-medium">Respond to open queries.</p>
                </div>
                <button className="mt-2 w-full py-2 bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-all">
                  View Queries
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'documents' ? (
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800">Document Records</h3>
                <p className="text-sm text-slate-500 font-medium tracking-wide">Manage student document submissions and releases.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Add Record
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documentRecords.map((doc) => (
                <div key={doc.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 group hover:border-primary/40 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      doc.status === 'Submitted' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg leading-tight">{doc.document_type}</h4>
                    <p className="text-sm font-bold text-primary mt-1">{doc.students?.name || 'N/A'}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">No: {doc.document_number || 'N/A'}</p>
                  </div>
                  {doc.remarks && (
                    <p className="text-xs font-medium text-slate-500 mt-4 pt-4 border-t border-slate-200/60 line-clamp-2">
                      {doc.remarks}
                    </p>
                  )}
                </div>
              ))}
              {documentRecords.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 font-bold bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 italic">
                  No document records logged yet.
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'library' ? (
          <div className="p-8">
             <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800">Library Quick Issue</h3>
                <p className="text-sm text-slate-500 font-medium">Search and issue books to students instantly.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-3 py-1.5 rounded-lg">
                  {libraryBooks.length} Total Books
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search books by title or ISBN..."
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-primary/20 rounded-[24px] text-sm font-bold focus:ring-0 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {libraryBooks
                    .filter(b => 
                      b.title.toLowerCase().includes(librarySearch.toLowerCase()) || 
                      b.isbn?.toLowerCase().includes(librarySearch.toLowerCase()) ||
                      b.author?.toLowerCase().includes(librarySearch.toLowerCase())
                    )
                    .slice(0, 10)
                    .map((book) => (
                    <div key={book.id} className="p-5 bg-white border border-slate-100 rounded-3xl hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Book className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800">{book.title}</h4>
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest">{book.author}</p>
                          <p className="text-[9px] font-bold text-slate-400 mt-0.5">ISBN: {book.isbn}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                          book.available > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {book.available > 0 ? `${book.available} Instock` : 'Out of Stock'}
                        </span>
                        {book.available > 0 && (
                          <button 
                            onClick={() => handleIssueBookFromList(book)}
                            className="block mt-2 text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                          >
                            Issue Now
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/30 transition-all" />
                <div className="relative z-10 space-y-8">
                  <div className="w-16 h-16 bg-white/10 rounded-[24px] flex items-center justify-center border border-white/20">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Recent Returns</h3>
                    <p className="text-white/50 text-sm font-medium mt-1">Real-time library activity from front office.</p>
                  </div>
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-[10px] font-black">ST</div>
                          <div>
                            <p className="text-xs font-black">Student Name</p>
                            <p className="text-[10px] text-white/40">Book Title...</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg uppercase tracking-widest">Returned</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'students' ? (
          <div className="p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800">Student Profiles & Credentials</h3>
                <p className="text-sm text-slate-500 font-medium mt-0.5">Search students, view administrative details, and share/view portal login credentials.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-150/40 px-3 py-1.5 rounded-lg font-mono">
                  {students.length} Total Students
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Info</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Course & Batch</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Parent Details</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.filter(s => 
                    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (s.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (s.roll_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (s.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (s.phone || '').includes(searchQuery)
                  ).map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                            {student.name ? student.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'ST'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID: {student.id}</p>
                            {student.roll_no && (
                              <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Roll: {student.roll_no}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div>
                          <p className="text-sm font-bold text-slate-700">{student.course || 'N/A'}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{student.branch || 'N/A'} • {student.batch || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div>
                          <p className="text-sm font-bold text-slate-700">{student.father_name || student.mother_name || student.parent_name || 'N/A'}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{student.parent_phone || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div>
                          <p className="text-sm font-semibold text-slate-700 select-all">{student.phone || 'N/A'}</p>
                          <p className="text-[10px] text-slate-400 font-semibold select-all leading-tight max-w-[150px] truncate">{student.email || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleViewCredentials(student)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-650 rounded-xl text-xs font-bold hover:bg-indigo-100 hover:text-indigo-700 transition"
                            title="Share Credentials"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Share Logins</span>
                          </button>
                          <button 
                            onClick={() => setSelectedStudentDetail(student)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                            title="View Full Profile"
                          >
                            <IdCard className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.filter(s => 
                    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (s.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (s.roll_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (s.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (s.phone || '').includes(searchQuery)
                  ).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold bg-slate-50/50 italic">
                        No students found matching your search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      {/* Student Details modal */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[32px] border border-slate-100 shadow-xl w-full max-w-4xl overflow-hidden my-auto"
          >
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Student Detailed Record</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{selectedStudentDetail.name} • Internal Directory Details</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudentDetail(null)} 
                className="p-3 hover:bg-white rounded-2xl transition shadow-sm border border-slate-100"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Academic Profile */}
              <div className="space-y-4 bg-slate-50/80 p-6 rounded-[24px] border border-slate-100">
                <h4 className="text-xs font-black text-primary uppercase tracking-widest">Academic Record</h4>
                
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Student ID</span>
                  <p className="text-sm font-black text-slate-800">{selectedStudentDetail.id}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Roll No</span>
                  <p className="text-sm font-black text-slate-800">{selectedStudentDetail.roll_no || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Course / Program</span>
                  <p className="text-sm font-black text-slate-800">{selectedStudentDetail.course || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Year / Semester</span>
                  <p className="text-sm font-black text-slate-800">{selectedStudentDetail.year || '1st'} / {selectedStudentDetail.semester || '1st Semester'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Batch & Branch</span>
                  <p className="text-sm font-black text-slate-800">{selectedStudentDetail.batch || 'N/A'} ({selectedStudentDetail.branch || 'N/A'})</p>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4 bg-slate-50/80 p-6 rounded-[24px] border border-slate-100">
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Personal Details</h4>
                
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Date of Birth</span>
                  <p className="text-sm font-black text-slate-800">{selectedStudentDetail.dob ? formatDate(selectedStudentDetail.dob) : 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Gender</span>
                  <p className="text-sm font-black text-slate-800">{selectedStudentDetail.gender || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Blood Group</span>
                  <p className="text-sm font-black text-slate-800">{selectedStudentDetail.blood_group || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Category</span>
                  <p className="text-sm font-black text-slate-800">{selectedStudentDetail.category || 'General'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Email Address</span>
                  <p className="text-sm font-black text-slate-850 break-all">{selectedStudentDetail.email || 'N/A'}</p>
                </div>
              </div>

              {/* Parent & Contact Profile */}
              <div className="space-y-4 bg-slate-50/80 p-6 rounded-[24px] border border-slate-100">
                <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest">Guardians & Locations</h4>
                
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Father Name</span>
                  <p className="text-sm font-black text-slate-800">{selectedStudentDetail.father_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Mother Name</span>
                  <p className="text-sm font-black text-slate-800">{selectedStudentDetail.mother_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Parent Phone</span>
                  <p className="text-sm font-black text-slate-800">{selectedStudentDetail.parent_phone || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Parent Email</span>
                  <p className="text-sm font-black text-slate-800">{selectedStudentDetail.parent_email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Mailing Address</span>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed max-h-16 overflow-y-auto">{selectedStudentDetail.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => {
                  const student = selectedStudentDetail;
                  setSelectedStudentDetail(null);
                  handleViewCredentials(student);
                }}
                className="px-6 py-3 bg-indigo-650 text-white rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition"
              >
                <Key className="w-4 h-4" />
                View & Share Logins
              </button>
              <button 
                onClick={() => setSelectedStudentDetail(null)}
                className="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-2xl text-sm font-bold hover:bg-slate-50 transition"
              >
                Close Record
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Credentials Share Modal */}
      {isCredentialsModalOpen && credentialsStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[32px] shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg">Portal Login Credentials</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{credentialsStudent.name}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsCredentialsModalOpen(false);
                  setFetchedCreds(null);
                }} 
                className="p-2 hover:bg-white rounded-xl transition"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {!fetchedCreds ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Fetching secure credentials...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Student Account */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 relative group">
                    <span className="absolute right-4 top-4 text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Student Portal</span>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Student Logins</h4>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-[9px] font-medium text-slate-400 block">Login ID</span>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <code className="text-xs font-black text-slate-800 font-mono">{fetchedCreds.studentId}</code>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(fetchedCreds.studentId);
                              setCopiedType('student');
                              setTimeout(() => setCopiedType(null), 2000);
                            }}
                            className="text-slate-400 hover:text-indigo-600 transition p-1 hover:bg-white rounded-lg"
                            title="Copy ID"
                          >
                            {copiedType === 'student' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] font-medium text-slate-400 block">Password</span>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <code className="text-xs font-black text-slate-800 font-mono">{fetchedCreds.studentPass}</code>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(fetchedCreds.studentPass);
                              setCopiedType('student-pass');
                              setTimeout(() => setCopiedType(null), 2000);
                            }}
                            className="text-slate-400 hover:text-indigo-600 transition p-1 hover:bg-white rounded-lg"
                            title="Copy Password"
                          >
                            {copiedType === 'student-pass' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Parent Account */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 relative group">
                    <span className="absolute right-4 top-4 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Parent Portal</span>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Parent Logins</h4>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-[9px] font-medium text-slate-400 block">Login ID</span>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <code className="text-xs font-black text-slate-800 font-mono">{fetchedCreds.parentId}</code>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(fetchedCreds.parentId);
                              setCopiedType('parent');
                              setTimeout(() => setCopiedType(null), 2000);
                            }}
                            className="text-slate-400 hover:text-indigo-600 transition p-1 hover:bg-white rounded-lg"
                            title="Copy ID"
                          >
                            {copiedType === 'parent' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] font-medium text-slate-400 block">Password</span>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <code className="text-xs font-black text-slate-800 font-mono">{fetchedCreds.parentPass}</code>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(fetchedCreds.parentPass);
                              setCopiedType('parent-pass');
                              setTimeout(() => setCopiedType(null), 2000);
                            }}
                            className="text-slate-400 hover:text-indigo-600 transition p-1 hover:bg-white rounded-lg"
                            title="Copy Password"
                          >
                            {copiedType === 'parent-pass' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick share actions */}
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => {
                        const text = `Hello *${credentialsStudent.name}*,\n\nHere are your login details for the EduNexus College Portal:\n\n*Student Login*:\nID: \`${fetchedCreds.studentId}\`\nPassword: \`${fetchedCreds.studentPass}\`\n\n*Parent Login*:\nID: \`${fetchedCreds.parentId}\`\nPassword: \`${fetchedCreds.parentPass}\`\n\nLink: ${window.location.origin}\n\nDo not share your passwords with anyone.`;
                        const url = `https://api.whatsapp.com/send?phone=${credentialsStudent.phone || credentialsStudent.parent_phone || ''}&text=${encodeURIComponent(text)}`;
                        window.open(url, '_blank');
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-600 transition shadow-md shadow-green-500/10"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>WhatsApp Share</span>
                    </button>

                    <button 
                      onClick={() => {
                        const text = `Hello ${credentialsStudent.name},\n\nHere are your portal login credentials:\n\nStudent Login:\nID: ${fetchedCreds.studentId}\nPassword: ${fetchedCreds.studentPass}\n\nParent Login:\nID: ${fetchedCreds.parentId}\nPassword: ${fetchedCreds.parentPass}\n\nLink: ${window.location.origin}`;
                        const subject = encodeURIComponent("EduNexus College Portal: Credentials");
                        const body = encodeURIComponent(text);
                        window.open(`mailto:${credentialsStudent.email || ''}?subject=${subject}&body=${body}`, '_blank');
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-md shadow-indigo-600/10"
                    >
                      <Send className="w-4 h-4" />
                      <span>Email Share</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-150 flex justify-end">
              <button 
                onClick={() => {
                  setIsCredentialsModalOpen(false);
                  setFetchedCreds(null);
                }}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* General Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden my-auto"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-primary/5">
                <div>
                  <h2 className="text-2xl font-black text-primary">
                    {activeTab === 'enquiries' 
                      ? (editingEnquiry ? 'Edit Enquiry' : 'Add Enquiry')
                      : activeTab === 'visitors'
                      ? (editingVisitor ? 'Edit Visitor Record' : 'New Visitor Entry')
                      : activeTab === 'registration'
                      ? (registrationSubTab === 'student' ? 'Student Registration' : 'Staff Onboarding')
                      : activeTab === 'library'
                      ? 'Issue Library Item'
                      : activeTab === 'documents'
                      ? 'Log Document'
                      : activeTab === 'communication'
                      ? 'Send Alert/Notice'
                      : 'New Record'
                    }
                  </h2>
                  <p className="text-slate-500 text-sm">
                    {activeTab === 'enquiries' 
                      ? 'Log a new student enquiry details below.' 
                      : activeTab === 'visitors'
                      ? 'Capture visitor details with a mandatory entry photo.'
                      : 'Complete the form below to save details.'
                    }
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-8">
                {activeTab === 'enquiries' ? (
                  <div className="space-y-6">
                    {/* Enquiry Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</label>
                        <input 
                          type="text" 
                          value={enquiryForm.student_name || ''}
                          onChange={(e) => setEnquiryForm({...enquiryForm, student_name: e.target.value})}
                          placeholder="Enter student name"
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parent Name</label>
                        <input 
                          type="text" 
                          value={enquiryForm.parent_name || ''}
                          onChange={(e) => setEnquiryForm({...enquiryForm, parent_name: e.target.value})}
                          placeholder="Enter parent name"
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                        <input 
                          type="tel" 
                          value={enquiryForm.phone || ''}
                          onChange={(e) => setEnquiryForm({...enquiryForm, phone: e.target.value})}
                          placeholder="Enter contact number"
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                        <select 
                          value={enquiryForm.status || 'Pending'}
                          onChange={(e) => setEnquiryForm({...enquiryForm, status: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Follow-up">Follow-up</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : activeTab === 'visitors' ? (
                  <div className="space-y-6">
                    {/* Visitor Form */}
                    <div className="flex flex-col md:flex-row gap-8">
                      {/* Photo Section */}
                      <div className="w-full md:w-64 space-y-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Live Photo</label>
                        <div className="w-full aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200 relative group shadow-inner">
                          {isCameraActive ? (
                            <Webcam
                              audio={false}
                              ref={webcamRef as any}
                              screenshotFormat="image/jpeg"
                              className="w-full h-full object-cover"
                              {...({
                                videoConstraints: { width: 1280, height: 720, facingMode: "user" }
                              } as any)}
                            />
                          ) : capturedPhoto ? (
                            <img src={capturedPhoto} className="w-full h-full object-cover" alt="Visitor" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                              <Camera className="w-8 h-8 opacity-40" />
                              <p className="text-[10px] font-black uppercase">No photo captured</p>
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {isCameraActive ? (
                              <button 
                                onClick={capturePhoto}
                                className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg hover:bg-emerald-600 transition-all font-bold text-xs flex items-center gap-1"
                              >
                                <Camera className="w-4 h-4" />
                                Capture
                              </button>
                            ) : (
                              <button 
                                onClick={() => setIsCameraActive(true)}
                                className="p-3 bg-primary text-white rounded-xl shadow-lg hover:bg-primary/90 transition-all font-bold text-xs flex items-center gap-1"
                              >
                                <RefreshCw className="w-4 h-4" />
                                {capturedPhoto ? 'Retake' : 'Start Camera'}
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold text-center">Capture a clear front-facing photo of the visitor.</p>
                      </div>

                      {/* Details Section */}
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Visitor Name</label>
                            <input 
                              type="text" 
                              value={visitorForm.name}
                              onChange={(e) => setVisitorForm({...visitorForm, name: e.target.value})}
                              placeholder="Full Name"
                              className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mobile Number</label>
                            <input 
                              type="tel" 
                              value={visitorForm.phone}
                              onChange={(e) => setVisitorForm({...visitorForm, phone: e.target.value})}
                              placeholder="10-digit number"
                              className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Purpose</label>
                            <input 
                              type="text" 
                              value={visitorForm.purpose}
                              onChange={(e) => setVisitorForm({...visitorForm, purpose: e.target.value})}
                              placeholder="e.g. Admission"
                              className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Person to Meet</label>
                            <input 
                              type="text" 
                              value={visitorForm.person_to_meet}
                              onChange={(e) => setVisitorForm({...visitorForm, person_to_meet: e.target.value})}
                              placeholder="Name/Dept"
                              className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ID Proof Type</label>
                            <select 
                              value={visitorForm.id_proof_type}
                              onChange={(e) => setVisitorForm({...visitorForm, id_proof_type: e.target.value})}
                              className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                              <option value="Aadhaar">Aadhaar Card</option>
                              <option value="Driving License">Driving License</option>
                              <option value="PAN Card">PAN Card</option>
                              <option value="Voter ID">Voter ID</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ID Number</label>
                            <input 
                              type="text" 
                              value={visitorForm.id_proof_number}
                              onChange={(e) => setVisitorForm({...visitorForm, id_proof_number: e.target.value})}
                              placeholder="Last 4 digits or Full"
                              className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Remarks</label>
                        <textarea 
                          value={visitorForm.remarks}
                          onChange={(e) => setVisitorForm({...visitorForm, remarks: e.target.value})}
                          placeholder="Any additional notes..."
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none resize-none h-20"
                        />
                    </div>
                  </div>
                ) : activeTab === 'registration' ? (
                  registrationSubTab === 'student' ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</label>
                          <input 
                            type="text" 
                            value={studentForm.first_name}
                            onChange={(e) => setStudentForm({...studentForm, first_name: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Surname</label>
                          <input 
                            type="text" 
                            value={studentForm.surname}
                            onChange={(e) => setStudentForm({...studentForm, surname: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
                          <input 
                            type="email" 
                            value={studentForm.email}
                            onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</label>
                          <input 
                            type="tel" 
                            value={studentForm.phone}
                            onChange={(e) => setStudentForm({...studentForm, phone: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course / Program</label>
                        <select 
                          value={studentForm.course_id}
                          onChange={(e) => setStudentForm({...studentForm, course_id: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none"
                        >
                          <option value="">Select Course...</option>
                          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parent Name</label>
                          <input 
                            type="text" 
                            value={studentForm.parent_name}
                            onChange={(e) => setStudentForm({...studentForm, parent_name: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parent Phone</label>
                          <input 
                            type="tel" 
                            value={studentForm.parent_phone}
                            onChange={(e) => setStudentForm({...studentForm, parent_phone: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                        <input 
                          type="text" 
                          value={staffForm.name}
                          onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
                          <input 
                            type="email" 
                            value={staffForm.email}
                            onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
                          <select 
                            value={staffForm.role}
                            onChange={(e) => setStaffForm({...staffForm, role: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none"
                          >
                            <option value="FACULTY">Faculty</option>
                            <option value="STAFF">Administrative Staff</option>
                            <option value="LIBRARIAN">Librarian</option>
                            <option value="ACCOUNTANT">Accountant</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )
                ) : activeTab === 'library' ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Student</label>
                      <select 
                        value={libraryIssueForm.student_id}
                        onChange={(e) => setLibraryIssueForm({...libraryIssueForm, student_id: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none"
                      >
                        <option value="">Select Student...</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Book</label>
                      <select 
                        value={libraryIssueForm.book_id}
                        onChange={(e) => setLibraryIssueForm({...libraryIssueForm, book_id: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none"
                      >
                        <option value="">Select Book...</option>
                        {libraryBooks.filter(b => (b.available || 0) > 0).map(b => <option key={b.id} value={b.id}>{b.title} - {b.author}</option>)}
                      </select>
                    </div>
                     <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</label>
                      <input 
                        type="date" 
                        value={libraryIssueForm.due_date}
                        onChange={(e) => setLibraryIssueForm({...libraryIssueForm, due_date: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none"
                      />
                    </div>
                  </div>
                ) : activeTab === 'documents' ? (
                  <div className="space-y-6">
                     <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Student</label>
                      <select 
                        value={documentForm.student_id}
                        onChange={(e) => setDocumentForm({...documentForm, student_id: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none"
                      >
                        <option value="">Choose Student...</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Document Type</label>
                      <input 
                        type="text" 
                        value={documentForm.document_type}
                        onChange={(e) => setDocumentForm({...documentForm, document_type: e.target.value})}
                        placeholder="e.g. Original 10th Marksheet"
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none"
                      />
                    </div>
                     <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                      <select 
                        value={documentForm.category}
                        onChange={(e) => setDocumentForm({...documentForm, category: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none"
                      >
                        <option value="Academic">Academic</option>
                        <option value="Identity">Identity</option>
                        <option value="Finance">Finance</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                ) : activeTab === 'communication' ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Title</label>
                      <input 
                        type="text" 
                        value={communicationForm.title}
                        onChange={(e) => setCommunicationForm({...communicationForm, title: e.target.value})}
                        placeholder="Subject of notice..."
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</label>
                        <select 
                          value={communicationForm.type}
                          onChange={(e) => setCommunicationForm({...communicationForm, type: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none"
                        >
                          <option value="INFO">Information</option>
                          <option value="ALERT">Important Alert</option>
                          {user?.role === 'ACCOUNTANT' && (
                            <option value="REMINDER">Fee Reminder</option>
                          )}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Audience</label>
                        <select 
                          value={communicationForm.audience}
                          onChange={(e) => setCommunicationForm({...communicationForm, audience: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none"
                        >
                          <option value="All">All Staff & Students</option>
                          <option value="Students">All Students</option>
                          <option value="Staff">All Staff</option>
                          <option value="Parents">All Parents</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message Content</label>
                      <textarea 
                        value={communicationForm.message}
                        onChange={(e) => setCommunicationForm({...communicationForm, message: e.target.value})}
                        placeholder="Type your message here..."
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none h-32 resize-none"
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="p-8 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-slate-500 font-bold hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (activeTab === 'enquiries') handleSaveEnquiry();
                    else if (activeTab === 'visitors') handleSaveVisitor();
                    else if (activeTab === 'registration') {
                      if (registrationSubTab === 'student') handleSaveStudentRegistration();
                      else handleSaveStaffRegistration();
                    }
                    else if (activeTab === 'library') handleSaveLibraryIssue();
                    else if (activeTab === 'documents') handleSaveDocumentRecord();
                    else if (activeTab === 'communication') handleSaveCommunication();
                  }}
                  disabled={isSaving || (activeTab === 'visitors' && !capturedPhoto)}
                  className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                >
                  {isSaving ? (
                    'Processing...'
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {activeTab === 'enquiries' 
                        ? (editingEnquiry ? 'Update Enquiry' : 'Save Enquiry')
                        : activeTab === 'visitors'
                        ? (editingVisitor ? 'Update Entry' : 'Check-In Visitor')
                        : 'Submit Details'
                      }
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
