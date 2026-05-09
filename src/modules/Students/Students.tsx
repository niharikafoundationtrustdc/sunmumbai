import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Download, 
  MoreVertical, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Camera,
  FileText,
  ShieldAlert,
  Heart,
  GraduationCap,
  Edit2,
  Trash2,
  AlertTriangle,
  Save,
  Truck,
  Building2,
  Printer,
  Share2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, safeLocalStorageSet } from '../../lib/utils';
import { exportToPDF, exportToExcel } from '../../lib/exportUtils';
import { supabase, testSupabaseConnection } from '../../lib/supabase';

interface Student {
  id: string;
  rollNumber: string;
  title?: string;
  firstName?: string;
  middleName?: string;
  surname?: string;
  name: string;
  email: string;
  phone: string;
  courseId: string;
  courseName?: string;
  branch: string;
  batch: string;
  year: string;
  semester: string;
  session?: string;
  bloodGroup?: string;
  religion?: string;
  caste?: string;
  category?: string;
  address?: string;
  state?: string;
  pincode?: string;
  permanentAddress?: string;
  permanentState?: string;
  permanentPincode?: string;
  transportMode?: string;
  vehicleNumber?: string;
  routeName?: string;
  isHosteller?: boolean;
  hostelName?: string;
  roomNumber?: string;
  fatherName?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherOccupation?: string;
  parentPhone?: string;
  parentEmail?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyAddress?: string;
  allergy?: string;
  status: 'Active' | 'Inactive';
  photoUrl?: string;
  studentDocsUrl?: string;
  parentDocsUrl?: string;
  signatureUrl?: string;
}

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [view, setView] = useState<'list' | 'register'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState({
    branch: '',
    batch: '',
    year: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [activeDetailsTab, setActiveDetailsTab] = useState<'profile' | 'documents' | 'academic' | 'fees'>('profile');
  const [studentDocs, setStudentDocs] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [newlySavedStudent, setNewlySavedStudent] = useState<Student | null>(null);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message?: string; details?: string }>({ connected: true });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    collegeName: 'Sun Group of Institutions',
    foundationName: 'Sri Kailashnath Foundation®',
    address: 'B-10, Industrial Market, Sakinaka, Mumbai',
    logo: '',
    website: '',
    phone: '',
    email: ''
  });
  const [academicSettings, setAcademicSettings] = useState<any>({
    castes: ['General', 'OBC', 'SC', 'ST', 'EWS'],
    religions: ['Hinduism', 'Islam', 'Christianity', 'Sikhism', 'Buddhism', 'Jainism'],
    branches: ['Computer Science', 'Information Technology', 'Mechanical', 'Civil', 'Electronics', 'Physiotherapy', 'Biology', 'Medicine', 'Science'],
    batches: ['Morning', 'Evening', 'Weekend'],
    sessions: ['2023-24', '2024-25', '2025-26'],
    courses: ['B.Tech Computer Science', 'B.Tech IT', 'B.Tech Mechanical', 'B.Tech Civil', 'Bachelor of Physiotherapy'],
    semesters: ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester', '1st Year', '2nd Year', '3rd Year', '4th Years']
  });

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
    'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 
    'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 
    'Lakshadweep', 'Puducherry'
  ];

  useEffect(() => {
    const init = async () => {
      const result = await testSupabaseConnection();
      setDbStatus(result);
      await fetchAcademicSettings();
      await fetchGeneralSettings();
      const currentCourses = await fetchCourses();
      await fetchStudents(currentCourses);
    };
    init();
  }, []);

  const fetchAcademicSettings = async () => {
    try {
      const { data, error } = await supabase.from('app_settings').select('*').eq('key', 'academic').single();
      if (data && data.value) {
        // Merge with existing state to preserve defaults for missing keys
        setAcademicSettings((prev: any) => ({
          ...prev,
          ...data.value
        }));
      }
    } catch (err) {
      console.error('Error fetching academic settings:', err);
    }
  };

  const fetchGeneralSettings = async () => {
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'general').single();
    if (data?.value) setSettings(data.value);
  };

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('*');
    if (data) {
      setCourses(data);
      return data;
    }
    return [];
  };

  const fetchStudents = async (currentCourses?: any[]) => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching students:', error);
      // Fallback to local storage if supabase fails
      const saved = localStorage.getItem('edunexus_students');
      if (saved) setStudents(JSON.parse(saved));
    } else if (data) {
      if (data.length > 0) {
        setAvailableColumns(Object.keys(data[0]));
      }
      const coursesToUse = currentCourses || courses;
      const formattedStudents: Student[] = (data || []).map(s => {
        const studentCourse = (coursesToUse || []).find((c: any) => c.id === s.course_id);
        return {
          id: s.id,
          rollNumber: s.roll_no || '',
          title: s.title,
          firstName: s.first_name,
          middleName: s.middle_name,
          surname: s.surname,
          name: s.name,
          email: s.email || '',
          phone: s.phone || '',
          courseId: s.course_id || '',
          courseName: studentCourse?.name || '',
          branch: s.branch || '',
          batch: s.batch || '',
          year: s.year || '',
          semester: s.semester || '',
          bloodGroup: s.blood_group,
          religion: s.religion,
          caste: s.caste,
          category: s.category,
          address: s.residential_address,
          state: s.state,
          pincode: s.pincode,
          permanentAddress: s.permanent_address,
          permanentState: s.permanent_state,
          permanentPincode: s.permanent_pincode,
          transportMode: s.transport_mode,
          vehicleNumber: s.vehicle_number,
          routeName: s.route_name,
          isHosteller: s.is_hosteller,
          hostelName: s.hostel_name,
          roomNumber: s.room_number,
          fatherName: s.father_name,
          fatherOccupation: s.father_occupation,
          motherName: s.mother_name,
          motherOccupation: s.mother_occupation,
          parentPhone: s.parent_phone,
          parentEmail: s.parent_email,
          emergencyName: s.emergency_contact_name,
          emergencyPhone: s.emergency_phone,
          emergencyAddress: s.emergency_address,
          allergy: s.allergies,
          photoUrl: s.photo_url,
          studentDocsUrl: (s.student_documents && s.student_documents[0]) || s.student_docs_url || '',
          parentDocsUrl: (s.parent_documents && s.parent_documents[0]) || s.parent_docs_url || '',
          signatureUrl: s.signature_url,
          status: s.status as 'Active' | 'Inactive'
        };
      });
      setStudents(formattedStudents);
      safeLocalStorageSet('edunexus_students', formattedStudents);
    }
  };

  const saveStudents = async (newStudents: Student[]) => {
    setStudents(newStudents);
    safeLocalStorageSet('edunexus_students', newStudents);
  };

  const addStudentToSupabase = async (student: any) => {
    const { error } = await supabase.from('students').insert([student]);
    if (error) {
      console.error('Error adding student to Supabase:', error);
      return { success: false, error };
    }
    return { success: true };
  };

  const updateStudentInSupabase = async (student: any) => {
    const { error } = await supabase.from('students').update(student).eq('id', student.id);
    if (error) {
      console.error('Error updating student in Supabase:', error);
      return { success: false, error };
    }
    return { success: true };
  };

  const deleteStudentFromSupabase = async (id: string) => {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) console.error('Error deleting student from Supabase:', error);
  };

  const printAdmissionForm = (student: Student) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const now = new Date();
      const printDateTime = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      printWindow.document.write(`
        <html>
          <head>
            <title>Admission Confirmation - ${student.name}</title>
            <style>
              @page { size: A4 portrait; margin: 15mm; }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #ef4444; padding-bottom: 20px; margin-bottom: 30px; position: relative; }
              .logo { position: absolute; left: 0; top: 0; width: 80px; height: 80px; object-fit: contain; }
              .foundation { font-size: 14px; font-weight: bold; margin: 0; color: #666; }
              .college { font-size: 28px; font-weight: 900; margin: 5px 0; color: #ef4444; text-transform: uppercase; }
              .details { font-size: 12px; color: #666; margin: 2px 0; }
              
              .title { text-align: center; font-size: 22px; font-weight: bold; text-decoration: underline; margin: 30px 0; text-transform: uppercase; }
              
              .info-section { margin-bottom: 30px; }
              .section-title { background: #f8fafc; padding: 8px 15px; border-left: 4px solid #ef4444; font-weight: bold; font-size: 14px; margin-bottom: 15px; text-transform: uppercase; }
              
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 0 15px; }
              .item { border-bottom: 1px dotted #ccc; padding: 5px 0; display: flex; align-items: flex-end; }
              .label { font-weight: bold; font-size: 12px; color: #4b5563; min-width: 140px; }
              .value { font-size: 13px; color: #000; font-weight: 600; }

              .photo-box { position: absolute; right: 0; top: 0; width: 120px; height: 140px; border: 1px solid #ccc; display: flex; items-center; justify-content: center; font-size: 10px; color: #999; }
              .photo-img { width: 100%; height: 100%; object-fit: cover; }
              
              .declaration { font-size: 11px; line-height: 1.6; margin-top: 40px; padding: 15px; background: #f9fafb; border: 1px solid #e2e8f0; border-radius: 8px; }
              
              .footer { margin-top: 80px; display: flex; justify-content: space-between; padding: 0 40px; }
              .sig { text-align: center; border-top: 1.5px solid #000; padding-top: 8px; min-width: 180px; font-weight: bold; font-size: 13px; }
              
              .timestamp { position: fixed; bottom: 10px; right: 20px; font-size: 10px; color: #94a3b8; }
            </style>
          </head>
          <body>
            <div class="header">
              ${settings.logo ? `<img src="${settings.logo}" class="logo" referrerPolicy="no-referrer" />` : ''}
              <p class="foundation">${settings.foundationName || 'Sri Kailashnath Foundation®'}</p>
              <h1 class="college">${settings.collegeName || 'SUN GROUP OF INSTITUTIONS'}</h1>
              <p class="details">${settings.address || 'Mumbai, Maharashtra'}</p>
              <p class="details">Contact: ${settings.phone || 'N/A'} | Email: ${settings.email || 'N/A'}</p>
              <div class="photo-box">
                ${student.photoUrl ? `<img src="${student.photoUrl}" class="photo-img" />` : 'Affix Recent Passport Size Photograph'}
              </div>
            </div>

            <div class="title">Admission Confirmation Form</div>

            <div class="info-section">
              <div class="section-title">Academic Details</div>
              <div class="grid">
                <div class="item"><span class="label">Admission ID:</span> <span class="value">${student.id}</span></div>
                <div class="item"><span class="label">Roll Number:</span> <span class="value">${student.rollNumber || 'TBD'}</span></div>
                <div class="item"><span class="label">Course Name:</span> <span class="value">${student.courseName}</span></div>
                <div class="item"><span class="label">Branch:</span> <span class="value">${student.branch}</span></div>
                <div class="item"><span class="label">Academic Session:</span> <span class="value">${student.session}</span></div>
                <div class="item"><span class="label">Year / Semester:</span> <span class="value">${student.year} / ${student.semester}</span></div>
              </div>
            </div>

            <div class="info-section">
              <div class="section-title">Personal Details</div>
              <div class="grid">
                <div class="item"><span class="label">Candidate Name:</span> <span class="value">${student.name}</span></div>
                <div class="item"><span class="label">Contact Number:</span> <span class="value">${student.phone}</span></div>
                <div class="item"><span class="label">Email Address:</span> <span class="value">${student.email}</span></div>
                <div class="item"><span class="label">Blood Group:</span> <span class="value">${student.bloodGroup || 'N/A'}</span></div>
                <div class="item"><span class="label">Category / Caste:</span> <span class="value">${student.category} / ${student.caste || 'N/A'}</span></div>
                <div class="item"><span class="label">Religion:</span> <span class="value">${student.religion || 'N/A'}</span></div>
              </div>
            </div>

            <div class="info-section">
              <div class="section-title">Family Details</div>
              <div class="grid">
                <div class="item"><span class="label">Father's Name:</span> <span class="value">${student.fatherName}</span></div>
                <div class="item"><span class="label">Mother's Name:</span> <span class="value">${student.motherName}</span></div>
                <div class="item"><span class="label">Emergency Contact:</span> <span class="value">${student.emergencyPhone}</span></div>
                <div class="item"><span class="label">Parent Phone:</span> <span class="value">${student.parentPhone}</span></div>
              </div>
            </div>

            <div class="declaration">
              <strong>Declaration:</strong> I hereby declare that all the information provided above is true to the best of my knowledge. I agree to abide by the rules and regulations of the institution. My admission is subject to verification of original documents.
            </div>

            <div class="footer">
              <div class="sig">Candidate / Parent Signature</div>
              <div class="sig">Admission Officer / Principal</div>
            </div>

            <div class="timestamp">Generated on: ${printDateTime}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const shareAdmissionConfirmation = (student: Student) => {
    const message = `*Admission Confirmation - ${settings.collegeName}*\n\nDear ${student.name},\nCongratulations! Your registration is complete.\n\nStudent ID: ${student.id}\nCourse: ${student.courseName}\nBranch: ${student.branch}\n\nPlease visit the college office with your original documents for verification.\n\nRegards,\nAdmission Team`;
    const waUrl = `https://wa.me/${(student.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const INITIAL_FORM_STATE = {
    title: 'Mr.',
    firstName: '',
    middleName: '',
    surname: '',
    rollNumber: '',
    course: '',
    branch: '',
    batch: '',
    year: '',
    semester: '',
    session: '',
    phone: '',
    email: '',
    address: '',
    bloodGroup: '',
    religion: '',
    caste: '',
    category: '',
    state: '',
    pincode: '',
    permanentAddress: '',
    permanentState: '',
    permanentPincode: '',
    transportMode: 'Private/Self',
    vehicleNumber: '',
    routeName: '',
    isHosteller: false,
    hostelName: '',
    roomNumber: '',
    fatherName: '',
    fatherOccupation: '',
    motherName: '',
    motherOccupation: '',
    parentPhone: '',
    parentEmail: '',
    emergencyName: '',
    emergencyAddress: '',
    emergencyPhone: '',
    allergy: '',
    photoUrl: '',
    studentDocsUrl: '',
    parentDocsUrl: '',
    signatureUrl: '',
    aadharUrl: '',
    panUrl: '',
    passportUrl: '',
    marksheet10Url: '',
    marksheet12Url: '',
    parentAadharUrl: '',
    loginId: '',
    loginPassword: '12345',
    parentLoginId: '',
    parentLoginPassword: '12345',
  };

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  const [generatedId, setGeneratedId] = useState('');

  useEffect(() => {
    if (view === 'register') {
      const year = new Date().getFullYear();
      const random = Math.floor(1000 + Math.random() * 9000);
      const studentId = `STU${year}${random}`;
      const parentId = `P-STU${year}${random}`;
      setGeneratedId(studentId);
      setFormData(prev => ({ 
        ...prev, 
        loginId: studentId,
        parentLoginId: parentId
      }));
    }
  }, [view]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const studentData: any = {
      id: formData.loginId || editingStudent?.id || generatedId,
      roll_no: formData.rollNumber,
      title: formData.title,
      first_name: formData.firstName,
      middle_name: formData.middleName,
      surname: formData.surname,
      name: `${formData.title} ${formData.firstName} ${formData.surname}`,
      email: formData.email,
      phone: formData.phone,
      course_id: formData.course || null,
      branch: formData.branch,
      batch: formData.batch,
      year: formData.year,
      semester: formData.semester,
      session: formData.session,
      blood_group: formData.bloodGroup,
      religion: formData.religion,
      caste: formData.caste,
      category: formData.category,
      residential_address: formData.address,
      state: formData.state,
      pincode: formData.pincode,
      permanent_address: formData.permanentAddress,
      permanent_state: formData.permanentState,
      permanent_pincode: formData.permanentPincode,
      transport_mode: formData.transportMode,
      vehicle_number: formData.vehicleNumber,
      route_name: formData.routeName,
      is_hosteller: formData.isHosteller,
      hostel_name: formData.hostelName,
      room_number: formData.roomNumber,
      father_name: formData.fatherName,
      father_occupation: formData.fatherOccupation,
      mother_name: formData.motherName,
      mother_occupation: formData.motherOccupation,
      parent_phone: formData.parentPhone,
      parent_email: formData.parentEmail,
      emergency_phone: formData.emergencyPhone,
      emergency_address: formData.emergencyAddress,
      allergies: formData.allergy,
      photo_url: formData.photoUrl,
      student_documents: formData.studentDocsUrl ? [formData.studentDocsUrl] : null,
      parent_documents: formData.parentDocsUrl ? [formData.parentDocsUrl] : null,
      signature_url: formData.signatureUrl,
      status: 'Active',
      aadhar_url: formData.aadharUrl,
      pan_url: formData.panUrl,
      passport_url: formData.passportUrl,
      marksheet_10_url: formData.marksheet10Url,
      marksheet_12_url: formData.marksheet12Url,
      parent_aadhar_url: formData.parentAadharUrl
    };

    // Dynamically add columns if they exist in the DB schema
    const hasFetchedColumns = availableColumns.length > 0;
    if (!hasFetchedColumns || availableColumns.includes('emergency_contact_name')) {
      studentData.emergency_contact_name = formData.emergencyName;
    }

    let result;
    if (editingStudent) {
      result = await updateStudentInSupabase(studentData);
      
      if (result.success) {
        // Update credentials if they exist or create if not
        await Promise.all([
          supabase.from('user_credentials').upsert({
            id: studentData.id,
            password: formData.loginPassword,
            role: 'STUDENT',
            name: studentData.name,
            email: studentData.email
          }),
          supabase.from('user_credentials').upsert({
            id: formData.parentLoginId,
            password: formData.parentLoginPassword,
            role: 'PARENT',
            name: `Parent of ${studentData.name}`,
            email: formData.parentEmail || studentData.email
          })
        ]);
      }
    } else {
      result = await addStudentToSupabase(studentData);
      
      if (result.success) {
        // Create User Credentials for Login only for NEW students
        // Use student ID as the unique identifier for credentials
        await Promise.all([
          supabase.from('user_credentials').upsert({
            id: studentData.id,
            password: formData.loginPassword,
            role: 'STUDENT',
            name: studentData.name,
            email: studentData.email
          }),
          supabase.from('user_credentials').upsert({
            id: formData.parentLoginId,
            password: formData.parentLoginPassword,
            role: 'PARENT',
            name: `Parent of ${studentData.name}`,
            email: formData.parentEmail || studentData.email
          })
        ]);

        // Initialize fees for student based on course
        const studentCourse = (courses || []).find(c => c.id === formData.course);
        if (studentCourse && studentCourse.fee_amount > 0) {
          await supabase.from('fees').insert({
            student_id: studentData.id,
            amount: studentCourse.fee_amount,
            date: new Date().toISOString().split('T')[0],
            status: 'PENDING',
            description: `Admission Fee: ${studentCourse.name}`
          });
        }
      }
    }

    if (!result.success) {
      console.error('Save error details:', result.error);
      setIsSubmitting(false);
      
      const errMsg = result.error?.message || 'Unknown error';
      if (errMsg.includes('emergency_contact_name') || result.error?.code === 'PGRST204') {
        const sqlFix = "ALTER TABLE students ADD COLUMN emergency_contact_name TEXT;";
        alert(`Database Schema Error: The 'emergency_contact_name' column appears to be missing in your Supabase 'students' table.\n\nPlease run this SQL in your Supabase SQL Editor to fix it:\n\n${sqlFix}\n\nAlternatively, run the full setup script again.`);
      } else {
        alert(`Failed to save student: ${errMsg}`);
      }
      return;
    }

    await fetchStudents();
    setIsSubmitting(false);
    
    // Create a student object for the success actions
    const savedStudent: Student = {
      ...formData,
      id: studentData.id,
      name: studentData.name,
      courseName: (courses || []).find(c => c.id === formData.course)?.name || '',
      status: 'Active'
    };
    
    setNewlySavedStudent(savedStudent);
    setShowSuccess(true);
    
    // If it was an edit, we might want to just go back to list, 
    // but for New (Admission), we want to show the print option.
    if (editingStudent) {
      setTimeout(() => {
        setShowSuccess(false);
        setView('list');
        setEditingStudent(null);
        setFormData(INITIAL_FORM_STATE);
        setNewlySavedStudent(null);
      }, 2000);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student record?')) {
      await deleteStudentFromSupabase(id);
      setStudents((students || []).filter(s => s.id !== id));
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkData.trim()) {
      alert('Please enter some student data');
      return;
    }

    setIsBulkSaving(true);
    try {
      // Refresh courses first
      const currentCourses = await fetchCourses();
      
      const lines = bulkData.split('\n').filter(line => line.trim());
      const studentsToInsert = [];
      const credentialsToInsert = [];
      const feesToInsert = [];
      
      const year = new Date().getFullYear();
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Split by Tab or Comma (careful with names like "SALFIYA ,")
        const parts = line.split(/[\t,]/).map(p => p.trim());
        
        // Skip header if present
        if (parts[0].toLowerCase().includes('sr') || parts[1]?.toLowerCase().includes('student name')) continue;
        
        if (parts.length >= 3) {
          const name = parts[1];
          const courseName = parts[2];
          const branch = parts[3] || '';
          const feeStr = parts[6] || '0';
          const feeAmount = parseFloat(feeStr.replace(/[^\d.]/g, '')) || 0;
          
          if (!name) continue;

          // Find course
          let course = currentCourses.find(c => c.name.toLowerCase() === courseName.toLowerCase());
          
          // If course doesn't exist, create it
          if (!course && courseName) {
             const { data: newCourse, error: cError } = await supabase.from('courses').insert({
               name: courseName,
               branch: branch,
               duration: parts[4] || '4 Years',
               fee_amount: feeAmount
             }).select().single();
             
             if (newCourse) {
               course = newCourse;
               currentCourses.push(newCourse); // Add to local list to avoid duplicates in same batch
             }
          }

          const random = Math.floor(100000 + Math.random() * 900000);
          const studentId = `STU${year}${random}${i}`; 
          
          studentsToInsert.push({
            id: studentId,
            name: name,
            course_id: course?.id || null,
            branch: branch,
            status: 'Active',
            created_at: new Date().toISOString()
          });

          credentialsToInsert.push({
            id: studentId,
            password: '12345',
            role: 'STUDENT',
            name: name
          });

          if (feeAmount > 0) {
            feesToInsert.push({
              student_id: studentId,
              amount: feeAmount,
              date: new Date().toISOString().split('T')[0],
              status: 'PENDING',
              description: `Admission Fee: ${courseName}`
            });
          }
        }
      }

      if (studentsToInsert.length === 0) {
        alert('No valid student records found in input.');
        setIsBulkSaving(false);
        return;
      }

      const { error: sError } = await supabase.from('students').insert(studentsToInsert);
      if (sError) throw sError;

      const { error: credError } = await supabase.from('user_credentials').insert(credentialsToInsert);
      if (credError) console.error('Error inserting bulk credentials:', credError);

      if (feesToInsert.length > 0) {
        const { error: fError } = await supabase.from('fees').insert(feesToInsert);
        if (fError) console.error('Error inserting bulk fees:', fError);
      }

      alert(`Successfully uploaded ${studentsToInsert.length} students!`);
      setIsUploadModalOpen(false);
      setBulkData('');
      await fetchStudents();
    } catch (err: any) {
      console.error('Bulk upload failed:', err);
      alert('Bulk upload failed: ' + err.message);
    } finally {
      setIsBulkSaving(false);
    }
  };

  const fetchStudentDocs = async (studentId: string) => {
    setIsLoadingDocs(true);
    const { data, error } = await supabase
      .from('student_document_records')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    
    if (data) setStudentDocs(data);
    setIsLoadingDocs(false);
  };

  const handleOpenStudentView = (student: Student) => {
    setViewingStudent(student);
    setActiveDetailsTab('profile');
    fetchStudentDocs(student.id);
  };

  const handleSaveDocRecord = async (docData: any) => {
    const { error } = await supabase.from('student_document_records').insert([docData]);
    if (!error && viewingStudent) {
      await fetchStudentDocs(viewingStudent.id);
    } else if (error) {
      alert('Error saving record: ' + error.message);
    }
  };

  const handleUpdateDocRecord = async (id: string, updateData: any) => {
    const { error } = await supabase.from('student_document_records').update(updateData).eq('id', id);
    if (!error && viewingStudent) {
      await fetchStudentDocs(viewingStudent.id);
    } else if (error) {
      alert('Error updating record: ' + error.message);
    }
  };
  const handlePrintDocAcknowledgement = (doc: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !viewingStudent) return;

    const isCollection = doc.status === 'Collected' || doc.status === 'Issued';
    const recipient = isCollection ? (doc.issued_to || doc.collected_by || 'Student') : viewingStudent.name;
    const date = isCollection ? (doc.issued_date || doc.collection_date || doc.created_at) : doc.created_at;

    printWindow.document.write(`
      <html>
        <head>
          <title>Document Acknowledgement - ${viewingStudent.name}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
            .college-name { font-size: 24px; font-weight: 800; color: #4f46e5; margin: 0; }
            .doc-title { font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 10px; }
            .section { margin-bottom: 30px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .label { font-size: 10px; font-weight: 800; color: #64748b; uppercase; letter-spacing: 0.5px; }
            .value { font-size: 14px; font-weight: 600; margin-top: 4px; }
            .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .details-table td { padding: 12px; border: 1px solid #f1f5f9; }
            .footer { margin-top: 80px; display: flex; justify-content: space-between; gap: 50px; }
            .sig-box { text-align: center; flex: 1; }
            .sig-line { border-top: 1px solid #1e293b; margin-bottom: 8px; }
            .sig-label { font-size: 11px; font-weight: 700; color: #64748b; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="college-name">${settings.general?.collegeName || 'College Management System'}</h1>
            <div class="doc-title">${isCollection ? 'Document Issuance Acknowledgement' : 'Document Submission Receipt'}</div>
          </div>

          <div class="section">
            <div class="grid">
              <div>
                <div class="label">Student Name</div>
                <div class="value">${viewingStudent.name}</div>
              </div>
              <div>
                <div class="label">Roll Number</div>
                <div class="value">${viewingStudent.rollNo || viewingStudent.id}</div>
              </div>
              <div>
                <div class="label">Course / Batch</div>
                <div class="value">${viewingStudent.courseName} / ${viewingStudent.batch}</div>
              </div>
              <div>
                <div class="label">Date of ${isCollection ? 'Collection' : 'Submission'}</div>
                <div class="value">${new Date(date).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3 style="font-size: 14px; font-weight: 800; margin-bottom: 15px;">DOCUMENT DETAILS</h3>
            <table class="details-table">
              <tr>
                <td width="30%"><div class="label">Document Type</div></td>
                <td><div class="value">${doc.document_type}</div></td>
              </tr>
              <tr>
                <td><div class="label">Status</div></td>
                <td><div class="value">${doc.status}</div></td>
              </tr>
              ${isCollection ? `
              <tr>
                <td><div class="label">Received By</div></td>
                <td><div class="value">${recipient}</div></td>
              </tr>` : ''}
              <tr>
                <td><div class="label">Remarks</div></td>
                <td><div class="value">${doc.remarks || 'No remarks recorded.'}</div></td>
              </tr>
            </table>
          </div>

          <div class="section" style="margin-top: 40px; font-size: 12px; color: #64748b;">
            <p>I hereby acknowledge the ${isCollection ? 'receipt' : 'submission'} of the above mentioned document. I confirm that the information provided is accurate to the best of my knowledge.</p>
          </div>

          <div class="footer">
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-label">Authorized Signatory (College Office)</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-label">${isCollection ? 'Recipient' : 'Student'} Signature</div>
            </div>
          </div>

          <div class="no-print" style="position: fixed; bottom: 20px; right: 20px;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #4f46e5; color: white; border: none; rounded: 12px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">Print Now</button>
          </div>
          <script>window.onload = () => { setTimeout(() => window.print(), 500); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleEdit = async (student: Student) => {
    setEditingStudent(student);
    setFormData({
      ...student as any,
      course: student.courseId,
      loginId: student.id,
      loginPassword: '12345',
      parentLoginId: `P-${student.id}`,
      parentLoginPassword: '12345',
      aadharUrl: (student as any).aadhar_url || '',
      panUrl: (student as any).pan_url || '',
      passportUrl: (student as any).passport_url || '',
      marksheet10Url: (student as any).marksheet_10_url || '',
      marksheet12Url: (student as any).marksheet_12_url || '',
      parentAadharUrl: (student as any).parent_aadhar_url || '',
      signatureUrl: (student as any).signature_url || (student as any).signatureUrl || ''
    });

    // Fetch existing password if any
    const { data: studentCreds } = await supabase.from('user_credentials').select('password').eq('id', student.id).single();
    if (studentCreds) {
      setFormData(prev => ({ ...prev, loginPassword: studentCreds.password }));
    }

    const { data: parentCreds } = await supabase.from('user_credentials').select('id, password').eq('id', `P-${student.id}`).single();
    if (parentCreds) {
      setFormData(prev => ({ 
        ...prev, 
        parentLoginId: parentCreds.id,
        parentLoginPassword: parentCreds.password 
      }));
    }

    setGeneratedId(student.id);
    setView('register');
  };

  const filteredStudents = (students || []).filter(s => {
    const matchesSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (s.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (s.rollNumber && s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesBranch = !filterType.branch || s.branch === filterType.branch;
    const matchesBatch = !filterType.batch || s.batch === filterType.batch;
    const matchesYear = !filterType.year || s.year === filterType.year;
    const matchesStatus = !filterType.status || s.status === filterType.status;

    return matchesSearch && matchesBranch && matchesBatch && matchesYear && matchesStatus;
  });

  const handleExportPDF = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Course', 'Branch', 'Year', 'Status'];
    const data = (filteredStudents || []).map(s => [
      s.id, 
      s.name, 
      s.email, 
      s.phone, 
      s.courseName || '-', 
      s.branch, 
      s.year, 
      s.status
    ]);
    exportToPDF('Student List', headers, data, 'Student_List');
  };

  const handleExportExcel = () => {
    // Flatten data for excel
    const excelData = (filteredStudents || []).map(s => ({
      'ID': s.id,
      'Name': s.name,
      'Email': s.email,
      'Phone': s.phone,
      'Course': s.courseName || '-',
      'Branch': s.branch,
      'Batch': s.batch,
      'Year': s.year,
      'Semester': s.semester,
      'Status': s.status
    }));
    exportToExcel(excelData, 'Student_List');
  };

  const handlePrintList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>Student List - ${settings.collegeName}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h1 { color: #ef4444; margin-bottom: 5px; }
            h2 { color: #64748b; font-size: 14px; margin-top: 0; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; }
            th { background-color: #f8fafc; color: #1e293b; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .status-active { color: #15803d; font-weight: bold; }
            .status-inactive { color: #b91c1c; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${settings.collegeName}</h1>
          <h2>Student List - Generated on ${new Date().toLocaleDateString()}</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Course / Branch</th>
                <th>Year</th>
                <th>Contact</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${(filteredStudents || []).map(s => `
                <tr>
                  <td>${s.id}</td>
                  <td>${s.name}</td>
                  <td>${s.courseName || s.branch}</td>
                  <td>Year ${s.year}</td>
                  <td>${s.phone}</td>
                  <td><span class="status-${s.status.toLowerCase()}">${s.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleViewDocument = (dataUrl: string) => {
    if (!dataUrl) return;
    try {
      if (dataUrl.startsWith('data:')) {
        const parts = dataUrl.split(';base64,');
        if (parts.length < 2) return;
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        window.open(dataUrl, '_blank');
      }
    } catch (e) {
      console.error('Error opening document:', e);
      alert('Could not open document. It might be corrupted or in an invalid format.');
    }
  };

  const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-700">{value || '-'}</p>
    </div>
  );

  const DocCard = ({ title, url, onView, isImage }: { title: string; url?: string; onView: () => void; isImage?: boolean }) => (
    <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 flex flex-col items-center gap-4 text-center">
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center",
        url ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"
      )}>
        {url ? <CheckCircle2 className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
      </div>
      <div>
        <p className="text-sm font-black text-slate-800 mb-1">{title}</p>
        <p className={cn("text-[10px] font-bold", url ? "text-green-600" : "text-slate-400")}>
          {url ? 'Document Verified' : 'No Document Found'}
        </p>
      </div>
      {url && (
        <button 
          onClick={onView}
          className="w-full py-3 bg-white border border-slate-200 text-primary rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all shadow-sm"
        >
          View {isImage ? 'Signature' : 'Document'}
        </button>
      )}
    </div>
  );

  const DocumentUploadField = ({ label, value, onChange, isImage }: { label: string; value?: string; onChange: (url: string) => void; isImage?: boolean }) => (
    <div className="space-y-4">
      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</label>
      <div 
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = isImage ? 'image/*' : '.pdf,image/*';
          input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                onChange(event.target?.result as string);
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
        }}
        className="h-32 bg-background border-2 border-dashed border-primary/20 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-primary/40 hover:text-primary transition-all cursor-pointer group overflow-hidden"
      >
        {value ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <span className="text-[10px] font-bold text-green-600">Uploaded</span>
            </div>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDocument(value);
              }}
              className="px-4 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-bold hover:bg-primary/20 transition-all"
            >
              View Document
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold">Upload {isImage ? '(Photo/Sig)' : '(PDF/JPG)'}</span>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Database Connection Warning */}
      {!dbStatus.connected && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex flex-col gap-1 text-rose-700"
        >
          <div className="flex items-center gap-3 font-medium">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm">
              {dbStatus.message || 'Database connection failed.'}
            </p>
          </div>
          {dbStatus.details && (
            <p className="text-xs text-rose-600 ml-8 opacity-80">
              {dbStatus.details}
            </p>
          )}
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Student Management</h1>
          <p className="text-slate-500">Manage student records and registrations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-all border border-indigo-100"
          >
            <Upload className="w-5 h-5" />
            Bulk Upload
          </button>
          {view === 'list' ? (
            <button 
              onClick={() => setView('register')}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <UserPlus className="w-5 h-5" />
              Register Student
            </button>
          ) : (
            <button 
              onClick={() => setView('list')}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-primary/10 text-slate-600 rounded-xl font-bold hover:bg-background transition-all shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to List
            </button>
          )}
        </div>
      </div>

      {view === 'list' ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-primary/10 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search students by name, ID, email or roll number..." 
                className="w-full pl-12 pr-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                    showFilters || Object.values(filterType).some(v => v !== '') 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "bg-background text-slate-600 hover:bg-primary/5"
                  )}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {Object.values(filterType).some(v => v !== '') && (
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </button>

                {/* Filters Dropdown */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-primary/10 p-6 z-50 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h4 className="font-bold text-primary">Advanced Filters</h4>
                        <button 
                          onClick={() => {
                            setFilterType({ branch: '', batch: '', year: '', status: '' });
                            setShowFilters(false);
                          }}
                          className="text-xs text-rose-500 font-bold hover:underline"
                        >
                          Clear All
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Branch</label>
                          <select 
                            value={filterType.branch}
                            onChange={(e) => setFilterType(prev => ({ ...prev, branch: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-50 border-none rounded-lg text-xs font-bold outline-none ring-1 ring-slate-200 focus:ring-primary/20"
                          >
                            <option value="">All Branches</option>
                            {(academicSettings?.branches || []).map((b: string) => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Batch</label>
                          <select 
                            value={filterType.batch}
                            onChange={(e) => setFilterType(prev => ({ ...prev, batch: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-50 border-none rounded-lg text-xs font-bold outline-none ring-1 ring-slate-200 focus:ring-primary/20"
                          >
                            <option value="">All Batches</option>
                            {(academicSettings?.batches || []).map((b: string) => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Year</label>
                          <select 
                            value={filterType.year}
                            onChange={(e) => setFilterType(prev => ({ ...prev, year: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-50 border-none rounded-lg text-xs font-bold outline-none ring-1 ring-slate-200 focus:ring-primary/20"
                          >
                            <option value="">All Years</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
                          <select 
                            value={filterType.status}
                            onChange={(e) => setFilterType(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-50 border-none rounded-lg text-xs font-bold outline-none ring-1 ring-slate-200 focus:ring-primary/20"
                          >
                            <option value="">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>

                      <button 
                        onClick={() => setShowFilters(false)}
                        className="w-full py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-lg shadow-primary/20"
                      >
                        Apply Filters
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrintList}
                  className="flex items-center gap-2 px-4 py-3 bg-background text-slate-600 rounded-xl text-sm font-bold hover:bg-primary/5 transition-all"
                  title="Print Current List"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-4 py-3 bg-background text-slate-600 rounded-xl text-sm font-bold hover:bg-primary/5 transition-all"
                  title="Download as PDF"
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </button>
                <button 
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-4 py-3 bg-background text-slate-600 rounded-xl text-sm font-bold hover:bg-primary/5 transition-all"
                  title="Download as Excel"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary/5 border-b border-primary/10">
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider">Roll No</th>
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider">Branch & Year</th>
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(filteredStudents || []).map((student) => (
                    <tr key={student.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                            {(student.name || '').charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-primary">{student.name}</p>
                            <p className="text-xs text-slate-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                          {student.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-indigo-600">
                          {student.rollNumber || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-slate-700">{student.courseName || student.branch}</p>
                          <p className="text-xs text-slate-500">{student.year} • {student.batch}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Phone className="w-3 h-3" />
                            {student.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          student.status === 'Active' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                        )}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => printAdmissionForm(student)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                            title="Print Admission Form"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenStudentView(student)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                            title="View Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEdit(student)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(student.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-primary/10 shadow-xl overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12">
            {/* Login Credentials Section */}
            <div className="space-y-8 bg-indigo-50/50 p-8 rounded-[32px] border border-indigo-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-indigo-900">Login Credentials</h3>
                    <p className="text-sm text-indigo-700/70 font-medium">Manage student and parent authentication access</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Student Login */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-indigo-200/50">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-black text-primary uppercase tracking-widest">Student Login</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-indigo-900 uppercase tracking-widest">Student ID / Username</label>
                      <div className="relative">
                        <Users className="w-4 h-4 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text" 
                          name="loginId"
                          required
                          value={formData.loginId}
                          onChange={handleInputChange}
                          disabled={!!editingStudent}
                          className="w-full pl-11 pr-4 py-3 bg-white border-none rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-indigo-900 uppercase tracking-widest">Student Password</label>
                      <div className="relative">
                        <AlertCircle className="w-4 h-4 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text" 
                          name="loginPassword"
                          required
                          value={formData.loginPassword}
                          onChange={handleInputChange}
                          className="w-full pl-11 pr-4 py-3 bg-white border-none rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parent Login */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-indigo-200/50">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <h4 className="text-sm font-black text-rose-500 uppercase tracking-widest">Parent Login</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-indigo-900 uppercase tracking-widest">Parent ID / Username</label>
                      <div className="relative">
                        <Users className="w-4 h-4 text-rose-300 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text" 
                          name="parentLoginId"
                          required
                          value={formData.parentLoginId}
                          onChange={handleInputChange}
                          disabled={!!editingStudent}
                          className="w-full pl-11 pr-4 py-3 bg-white border-none rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-rose-200 outline-none transition-all disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-indigo-900 uppercase tracking-widest">Parent Password</label>
                      <div className="relative">
                        <AlertCircle className="w-4 h-4 text-rose-300 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text" 
                          name="parentLoginPassword"
                          required
                          value={formData.parentLoginPassword}
                          onChange={handleInputChange}
                          className="w-full pl-11 pr-4 py-3 bg-white border-none rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Personal Information */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 pb-4 border-b border-primary/10">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-primary">Personal Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Title</label>
                  <select 
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option>Mr.</option>
                    <option>Ms.</option>
                    <option>Mrs.</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</label>
                  <input 
                    type="text" 
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                    className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Middle Name</label>
                  <input 
                    type="text" 
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    placeholder="Enter middle name"
                    className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Surname</label>
                  <input 
                    type="text" 
                    name="surname"
                    required
                    value={formData.surname}
                    onChange={handleInputChange}
                    placeholder="Enter surname"
                    className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student ID (Auto)</label>
                  <input 
                    type="text" 
                    readOnly
                    value={generatedId}
                    className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl text-sm font-mono font-bold text-primary outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Roll Number</label>
                  <input 
                    type="text" 
                    name="rollNumber"
                    required
                    value={formData.rollNumber}
                    onChange={handleInputChange}
                    placeholder="Enter roll number"
                    className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Session</label>
                  <select 
                    name="session"
                    required
                    value={formData.session}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="">Select Session</option>
                    {(academicSettings?.sessions || []).map((s: string) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course</label>
                  <select 
                    name="course"
                    required
                    value={formData.course}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="">Select Course</option>
                    {(courses || []).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Branch</label>
                  <select 
                    name="branch"
                    required
                    value={formData.branch}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="">Select Branch</option>
                    {(academicSettings?.branches || []).map((b: string) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Batch</label>
                  <select 
                    name="batch"
                    required
                    value={formData.batch}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="">Select Batch</option>
                    {(academicSettings?.batches || []).map((b: string) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Year</label>
                  <select 
                    name="year"
                    required
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Semester</label>
                  <select 
                    name="semester"
                    required
                    value={formData.semester}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="">Select Semester</option>
                    {[1,2,3,4,5,6,7,8].map(s => (
                      <option key={s} value={s.toString()}>{s}{s === 1 ? 'st' : s === 2 ? 'nd' : s === 3 ? 'rd' : 'th'} Semester</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="tel" 
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full pl-11 pr-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="email" 
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="student@example.com"
                      className="w-full pl-11 pr-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Blood Group</label>
                  <select 
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="">Select Blood Group</option>
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>O+</option>
                    <option>O-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Religion</label>
                  <select 
                    name="religion"
                    value={formData.religion}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="">Select Religion</option>
                    {(academicSettings?.religions || []).map((r: string) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Caste</label>
                  <select 
                    name="caste"
                    value={formData.caste}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="">Select Caste</option>
                    {(academicSettings?.castes || []).map((c: string) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                  <select 
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="">Select Category</option>
                    <option>General</option>
                    <option>OBC</option>
                    <option>SC</option>
                    <option>ST</option>
                    <option>EWS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Residential Address</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                    <textarea 
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter full address"
                      rows={3}
                      className="w-full pl-11 pr-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">State</label>
                    <select 
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                      <option value="">Select State</option>
                      {indianStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pincode</label>
                    <input 
                      type="text" 
                      name="pincode"
                      required
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="XXXXXX"
                      className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Permanent Address</label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ 
                              ...prev, 
                              permanentAddress: prev.address,
                              permanentState: prev.state,
                              permanentPincode: prev.pincode
                            }));
                          }
                        }}
                        className="rounded text-primary focus:ring-primary/20" 
                      />
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-primary uppercase tracking-widest transition-colors">Same as residential</span>
                    </label>
                  </div>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                    <textarea 
                      name="permanentAddress"
                      required
                      value={formData.permanentAddress}
                      onChange={handleInputChange}
                      placeholder="Enter permanent address"
                      rows={3}
                      className="w-full pl-11 pr-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">State</label>
                    <select 
                      name="permanentState"
                      required
                      value={formData.permanentState}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                      <option value="">Select State</option>
                      {indianStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pincode</label>
                    <input 
                      type="text" 
                      name="permanentPincode"
                      required
                      value={formData.permanentPincode}
                      onChange={handleInputChange}
                      placeholder="XXXXXX"
                      className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Transport & Hostel Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                      <Truck className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-slate-700">Transport Details</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transport Mode</label>
                      <select 
                        name="transportMode"
                        value={formData.transportMode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      >
                        <option value="Private/Self">Private/Self</option>
                        <option value="College Bus">College Bus</option>
                        <option value="Public Transport">Public Transport</option>
                      </select>
                    </div>
                    {formData.transportMode === 'College Bus' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Route Name</label>
                          <input 
                            type="text" 
                            name="routeName"
                            value={formData.routeName}
                            onChange={handleInputChange}
                            placeholder="e.g. Route 01"
                            className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle No</label>
                          <input 
                            type="text" 
                            name="vehicleNumber"
                            value={formData.vehicleNumber}
                            onChange={handleInputChange}
                            placeholder="e.g. MH12AB1234"
                            className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-slate-700">Hostel Details</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-2 py-2">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          name="isHosteller"
                          checked={formData.isHosteller}
                          onChange={(e) => setFormData(prev => ({ ...prev, isHosteller: e.target.checked }))}
                          className="rounded text-primary focus:ring-primary/20" 
                        />
                        <span className="text-sm font-bold text-slate-600 group-hover:text-primary transition-colors">Accommodation Required (Hosteller)</span>
                      </label>
                    </div>
                    {formData.isHosteller && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hostel Name</label>
                          <input 
                            type="text" 
                            name="hostelName"
                            value={formData.hostelName}
                            onChange={handleInputChange}
                            placeholder="e.g. Tagore Hall"
                            className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Room No</label>
                          <input 
                            type="text" 
                            name="roomNumber"
                            value={formData.roomNumber}
                            onChange={handleInputChange}
                            placeholder="e.g. 101-A"
                            className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upload Student Photo</label>
                <div className="flex items-center gap-6">
                  <div 
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e: any) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setFormData(prev => ({ ...prev, photoUrl: event.target?.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                    className="w-32 h-32 bg-background border-2 border-dashed border-primary/20 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-primary/40 hover:text-primary transition-all cursor-pointer group overflow-hidden"
                  >
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold">Upload Photo</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p className="font-bold text-primary">Requirements:</p>
                    <p>• Passport size photo (3.5 x 4.5 cm)</p>
                    <p>• JPG, PNG format only</p>
                    <p>• Max size: 2MB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Family Details */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 pb-4 border-b border-primary/10">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-primary">Family Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Father's Information
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Father's Name</label>
                      <input 
                        type="text" 
                        name="fatherName"
                        required
                        value={formData.fatherName}
                        onChange={handleInputChange}
                        placeholder="Enter father's name"
                        className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Occupation</label>
                      <input 
                        type="text" 
                        name="fatherOccupation"
                        value={formData.fatherOccupation}
                        onChange={handleInputChange}
                        placeholder="Enter occupation"
                        className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Mother's Information
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mother's Name</label>
                      <input 
                        type="text" 
                        name="motherName"
                        required
                        value={formData.motherName}
                        onChange={handleInputChange}
                        placeholder="Enter mother's name"
                        className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Occupation</label>
                      <input 
                        type="text" 
                        name="motherOccupation"
                        value={formData.motherOccupation}
                        onChange={handleInputChange}
                        placeholder="Enter occupation"
                        className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parent's Contact Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="tel" 
                      name="parentPhone"
                      required
                      value={formData.parentPhone}
                      onChange={handleInputChange}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full pl-11 pr-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parent's Email ID</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="email" 
                      name="parentEmail"
                      value={formData.parentEmail}
                      onChange={handleInputChange}
                      placeholder="parent@example.com"
                      className="w-full pl-11 pr-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Emergency Contact */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 pb-4 border-b border-primary/10">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-primary">Emergency Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Name</label>
                  <input 
                    type="text" 
                    name="emergencyName"
                    required
                    value={formData.emergencyName}
                    onChange={handleInputChange}
                    placeholder="Enter contact name"
                    className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Emergency Phone</label>
                  <input 
                    type="tel" 
                    name="emergencyPhone"
                    required
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Any Allergies / Medical Conditions</label>
                  <input 
                    type="text" 
                    name="allergy"
                    value={formData.allergy}
                    onChange={handleInputChange}
                    placeholder="e.g. Peanuts, Asthma"
                    className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Emergency Address</label>
                <input 
                  type="text" 
                  name="emergencyAddress"
                  value={formData.emergencyAddress}
                  onChange={handleInputChange}
                  placeholder="Enter emergency address"
                  className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-3 pb-4 border-b border-primary/10">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-primary">Document Checklist</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                <DocumentUploadField 
                  label="Student Aadhar" 
                  value={formData.aadharUrl} 
                  onChange={(url) => setFormData(p => ({ ...p, aadharUrl: url }))} 
                />
                <DocumentUploadField 
                  label="Student PAN" 
                  value={formData.panUrl} 
                  onChange={(url) => setFormData(p => ({ ...p, panUrl: url }))} 
                />
                <DocumentUploadField 
                  label="Student Passport" 
                  value={formData.passportUrl} 
                  onChange={(url) => setFormData(p => ({ ...p, passportUrl: url }))} 
                />
                <DocumentUploadField 
                  label="10th Marksheet" 
                  value={formData.marksheet10Url} 
                  onChange={(url) => setFormData(p => ({ ...p, marksheet10Url: url }))} 
                />
                <DocumentUploadField 
                  label="12th Marksheet" 
                  value={formData.marksheet12Url} 
                  onChange={(url) => setFormData(p => ({ ...p, marksheet12Url: url }))} 
                />
                <DocumentUploadField 
                  label="Parent Aadhar" 
                  value={formData.parentAadharUrl} 
                  onChange={(url) => setFormData(p => ({ ...p, parentAadharUrl: url }))} 
                />
                <DocumentUploadField 
                  label="Student Signature" 
                  value={formData.signatureUrl} 
                  onChange={(url) => setFormData(p => ({ ...p, signatureUrl: url }))} 
                  isImage
                />
                <DocumentUploadField 
                  label="Other Documents" 
                  value={formData.studentDocsUrl} 
                  onChange={(url) => setFormData(p => ({ ...p, studentDocsUrl: url }))} 
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-12 border-t border-primary/10 flex items-center justify-end gap-4">
              <button 
                type="button"
                onClick={() => setView('list')}
                className="px-8 py-4 text-slate-500 font-bold hover:text-primary transition-colors"
              >
                Cancel
              </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "px-12 py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-3",
                    isSubmitting && "opacity-80 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {editingStudent ? 'Updating...' : 'Registering...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editingStudent ? 'Update Student' : 'Complete Registration'}
                    </>
                  )}
                </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Success Notification */}
      <AnimatePresence>
        {showSuccess && newlySavedStudent && (
          <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[32px] shadow-2xl p-10 max-w-lg w-full text-center space-y-6"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">Registration Successful!</h3>
                <p className="text-slate-500 mt-2 font-medium">Student record for <span className="text-primary font-bold">{newlySavedStudent.name}</span> has been created.</p>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Admission ID: {newlySavedStudent.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => printAdmissionForm(newlySavedStudent)}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-primary/10 text-primary rounded-2xl font-bold hover:bg-primary/20 transition-all"
                >
                  <Printer className="w-5 h-5" />
                  Print Form
                </button>
                <button 
                  onClick={() => shareAdmissionConfirmation(newlySavedStudent)}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-green-50 text-green-600 rounded-2xl font-bold hover:bg-green-100 transition-all"
                >
                  <Share2 className="w-5 h-5" />
                  Share PDF
                </button>
              </div>

              <button 
                onClick={() => {
                  setShowSuccess(false);
                  setView('list');
                  setEditingStudent(null);
                  setFormData(INITIAL_FORM_STATE);
                  setNewlySavedStudent(null);
                }}
                className="w-full py-4 text-slate-500 font-bold hover:text-primary transition-all underline underline-offset-4"
              >
                Go to Student List
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Legacy simple success message for edits */}
      <AnimatePresence>
        {showSuccess && !newlySavedStudent && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 z-50 bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">Execution Successful!</p>
              <p className="text-xs text-white/80">Operation completed successfully.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student Details Modal */}
      <AnimatePresence>
        {viewingStudent && (
          <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-primary/5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary font-bold text-2xl shadow-sm overflow-hidden">
                    {viewingStudent.photoUrl ? (
                      <img src={viewingStudent.photoUrl} alt={viewingStudent.name} className="w-full h-full object-cover" />
                    ) : (
                      viewingStudent.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-primary">{viewingStudent.name}</h2>
                    <p className="text-slate-500 font-medium font-mono text-sm">Student ID: {viewingStudent.id} • Roll No: {viewingStudent.rollNumber || 'N/A'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingStudent(null)}
                  className="p-3 hover:bg-white rounded-2xl transition-all"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="px-8 flex items-center gap-6 border-b border-slate-100 bg-white">
                <button 
                  onClick={() => setActiveDetailsTab('profile')}
                  className={cn(
                    "py-4 text-sm font-bold transition-all relative",
                    activeDetailsTab === 'profile' ? "text-primary" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  General Profile
                  {activeDetailsTab === 'profile' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
                </button>
                <button 
                  onClick={() => setActiveDetailsTab('documents')}
                  className={cn(
                    "py-4 text-sm font-bold transition-all relative",
                    activeDetailsTab === 'documents' ? "text-primary" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Documents Registry
                  {activeDetailsTab === 'documents' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {activeDetailsTab === 'profile' ? (
                  <div className="space-y-12">
                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                      {/* Academic Info */}
                      <div className="space-y-6">
                        <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-primary/10">
                           <GraduationCap className="w-4 h-4" /> Academic Info
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                          <DetailRow label="Course" value={viewingStudent.courseName || 'N/A'} />
                          <DetailRow label="Branch" value={viewingStudent.branch} />
                          <DetailRow label="Year / Semester" value={`${viewingStudent.year || '-'} / ${viewingStudent.semester || '-'}`} />
                          <DetailRow label="Batch / Session" value={`${viewingStudent.batch || '-'} / ${viewingStudent.session || '-'}`} />
                        </div>
                      </div>

                      {/* Personal Info */}
                      <div className="space-y-6">
                        <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-primary/10">
                           <Users className="w-4 h-4" /> Personal Info
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <DetailRow label="Blood Group" value={viewingStudent.bloodGroup || 'N/A'} />
                          <DetailRow label="Religion" value={viewingStudent.religion || 'N/A'} />
                          <DetailRow label="Caste" value={viewingStudent.caste || 'N/A'} />
                          <DetailRow label="Category" value={viewingStudent.category || 'N/A'} />
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-6">
                        <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-primary/10">
                           <Phone className="w-4 h-4" /> Contact Info
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                          <DetailRow label="Phone" value={viewingStudent.phone} />
                          <DetailRow label="Email" value={viewingStudent.email} />
                          <DetailRow label="Residential Address" value={`${viewingStudent.address || ''} ${viewingStudent.state ? ', ' + viewingStudent.state : ''} ${viewingStudent.pincode || ''}`} />
                          <DetailRow label="Permanent Address" value={`${viewingStudent.permanentAddress || ''} ${viewingStudent.permanentState ? ', ' + viewingStudent.permanentState : ''} ${viewingStudent.permanentPincode || ''}`} />
                        </div>
                      </div>

                      {/* Family Info */}
                      <div className="space-y-6">
                        <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-primary/10">
                           <Heart className="w-4 h-4" /> Family Info
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                          <DetailRow label="Father's Name" value={`${viewingStudent.fatherName || '-'} (${viewingStudent.fatherOccupation || 'N/A'})`} />
                          <DetailRow label="Mother's Name" value={`${viewingStudent.motherName || '-'} (${viewingStudent.motherOccupation || 'N/A'})`} />
                          <DetailRow label="Parent Contact" value={`${viewingStudent.parentPhone || '-'} / ${viewingStudent.parentEmail || '-'}`} />
                        </div>
                      </div>

                      {/* Emergency & Health */}
                      <div className="space-y-6">
                        <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-primary/10">
                           <AlertTriangle className="w-4 h-4" /> Emergency & Health
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                          <DetailRow label="Contact Person" value={viewingStudent.emergencyName || 'N/A'} />
                          <DetailRow label="Emergency Phone" value={viewingStudent.emergencyPhone || 'N/A'} />
                          <DetailRow label="Allergies / Notes" value={viewingStudent.allergy || 'None'} />
                        </div>
                      </div>

                      {/* Status Info */}
                      <div className="space-y-6">
                        <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-primary/10">
                           <ShieldAlert className="w-4 h-4" /> Status & Checklist
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold gap-2 w-fit ${
                            viewingStudent.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${viewingStudent.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-rose-500'}`} />
                            {viewingStudent.status} Student
                          </div>

                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Status</span>
                              <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {studentDocs.filter(d => d.status === 'Collected').length} / {studentDocs.length} Collected
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(studentDocs.filter(d => d.status === 'Collected').length / (studentDocs.length || 1)) * 100}%` }}
                                className="h-full bg-primary"
                              />
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {studentDocs.slice(0, 4).map((d, i) => (
                                <div key={i} className={cn(
                                  "px-2 py-0.5 rounded-md text-[8px] font-bold uppercase",
                                  d.status === 'Collected' ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"
                                )}>
                                  {d.document_type}
                                </div>
                              ))}
                              {studentDocs.length > 4 && <span className="text-[8px] font-bold text-slate-400">+{studentDocs.length - 4} more</span>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Transport & Hostel */}
                      <div className="space-y-6">
                        <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-primary/10">
                           <Truck className="w-4 h-4" /> Transport & Hostel
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                          <DetailRow label="Transport Mode" value={viewingStudent.transportMode || 'Private'} />
                          {viewingStudent.transportMode === 'College Bus' && (
                            <>
                              <DetailRow label="Route" value={viewingStudent.routeName || '-'} />
                              <DetailRow label="Vehicle No" value={viewingStudent.vehicleNumber || '-'} />
                            </>
                          )}
                          <DetailRow label="Hosteller" value={viewingStudent.isHosteller ? 'Yes' : 'No'} />
                          {viewingStudent.isHosteller && (
                            <>
                              <DetailRow label="Hostel" value={viewingStudent.hostelName || '-'} />
                              <DetailRow label="Room No" value={viewingStudent.roomNumber || '-'} />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 mb-1">Document Records & Tracking</h3>
                        <p className="text-sm text-slate-500 font-medium">Manage and track physical document submissions and collections.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Collected</p>
                            <p className="text-lg font-black text-primary leading-none mt-1">
                              {studentDocs.filter(d => d.status === 'Collected').length} / {studentDocs.length}
                            </p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <FileText className="w-4 h-4" />
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            const commonDocs = ['10th Marksheet', '12th Marksheet', 'TC / Migration', 'Aadhar Card', 'Category Certificate', 'Passport Size Photo (4)'];
                            const docType = prompt(`Enter Document Type (or select common: ${commonDocs.join(', ')})`);
                            if (docType) {
                              handleSaveDocRecord({
                                student_id: viewingStudent.id,
                                document_type: docType,
                                category: docType.toLowerCase().includes('marksheet') ? 'Academic' : 'Identification',
                                status: 'Submitted'
                              });
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                        >
                          <UserPlus className="w-4 h-4" /> Add Record
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {isLoadingDocs ? (
                        <div className="py-12 flex justify-center">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : studentDocs.length === 0 ? (
                        <div className="p-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
                          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                          <p className="text-slate-500 font-medium">No document records found for this student.</p>
                          <p className="text-xs text-slate-400">Click "Add Record" to start tracking marksheets, IDs, or certificates.</p>
                        </div>
                      ) : (
                        <div className="overflow-hidden bg-white border border-slate-100 rounded-[24px]">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Type</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issuance / Collection</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {studentDocs.map((doc) => (
                                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-700">{doc.document_type}</span>
                                      <span className="text-[10px] font-medium text-slate-400 uppercase">{doc.category}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <select 
                                      value={doc.status}
                                      onChange={(e) => handleUpdateDocRecord(doc.id, { status: e.target.value })}
                                      className={cn(
                                        "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border-none focus:ring-2 focus:ring-primary/20",
                                        doc.status === 'Submitted' ? "bg-blue-50 text-blue-600" :
                                        doc.status === 'Issued' ? "bg-amber-50 text-amber-600" :
                                        doc.status === 'Collected' ? "bg-green-50 text-green-600" : 
                                        "bg-rose-50 text-rose-600"
                                      )}
                                    >
                          <option value="Submitted">Submitted</option>
                                      <option value="Issued">Issued</option>
                                      <option value="Collected">Collected</option>
                                      <option value="Missing">Missing</option>
                                    </select>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <button 
                                        onClick={() => handleUpdateDocRecord(doc.id, { status: 'Submitted' })}
                                        className={cn("p-1.5 rounded-lg text-[10px] font-bold uppercase transition-all", doc.status === 'Submitted' ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200")}
                                        title="Mark as Submitted"
                                      >
                                        <Save className="w-3 h-3" />
                                      </button>
                                      <button 
                                        onClick={() => {
                                          const person = prompt("Collected by whom?");
                                          if (person) {
                                            handleUpdateDocRecord(doc.id, { 
                                              status: 'Collected', 
                                              collected_by: person, 
                                              collection_date: new Date().toISOString().split('T')[0] 
                                            });
                                          }
                                        }}
                                        className={cn("p-1.5 rounded-lg text-[10px] font-bold uppercase transition-all", doc.status === 'Collected' ? "bg-green-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200")}
                                        title="Mark as Collected"
                                      >
                                        <CheckCircle2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    {doc.status === 'Issued' || doc.status === 'Collected' ? (
                                      <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-600">
                                          {doc.status === 'Issued' ? `Issued To: ${doc.issued_to || 'N/A'}` : `Collected By: ${doc.collected_by || 'N/A'}`}
                                        </p>
                                        <p className="text-[8px] font-mono text-slate-400">
                                          Date: {doc.status === 'Issued' ? doc.issued_date : doc.collection_date}
                                        </p>
                                      </div>
                                    ) : (
                                      <button 
                                        onClick={() => {
                                          const person = prompt(`Who ${doc.status === 'Issued' ? 'is receiving' : 'collected'} this?`);
                                          if (person) {
                                            const update = doc.status === 'Issued' 
                                              ? { issued_to: person, issued_date: new Date().toISOString().split('T')[0] }
                                              : { collected_by: person, collection_date: new Date().toISOString().split('T')[0] };
                                            handleUpdateDocRecord(doc.id, update);
                                          }
                                        }}
                                        className="text-[10px] font-bold text-primary hover:underline"
                                      >
                                        Record details
                                      </button>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      {doc.file_url ? (
                                        <button 
                                          onClick={() => handleViewDocument(doc.file_url)}
                                          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all"
                                          title="View Scanned Document"
                                        >
                                          <FileText className="w-4 h-4" />
                                        </button>
                                      ) : (
                                        <button 
                                          onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.onchange = (e: any) => {
                                              const file = e.target.files[0];
                                              if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                  handleUpdateDocRecord(doc.id, { file_url: ev.target?.result as string });
                                                };
                                                reader.readAsDataURL(file);
                                              }
                                            };
                                            input.click();
                                          }}
                                          className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                                          title="Upload Scan"
                                        >
                                          <Upload className="w-4 h-4" />
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => handlePrintDocAcknowledgement(doc)}
                                        className="p-2 bg-primary/5 text-primary rounded-lg hover:bg-primary/10 transition-all"
                                        title="Print Acknowledgement Receipt"
                                      >
                                        <Printer className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={async () => {
                                          if (confirm('Delete this record?')) {
                                            await supabase.from('student_document_records').delete().eq('id', doc.id);
                                            await fetchStudentDocs(viewingStudent.id);
                                          }
                                        }}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6 pt-8 border-t border-slate-100">
                      <DocCard 
                        title="Student Aadhar" 
                        url={viewingStudent.aadhar_url} 
                        onView={() => handleViewDocument(viewingStudent.aadhar_url!)} 
                      />
                      <DocCard 
                        title="Student PAN" 
                        url={viewingStudent.pan_url} 
                        onView={() => handleViewDocument(viewingStudent.pan_url!)} 
                      />
                      <DocCard 
                        title="Student Passport" 
                        url={viewingStudent.passport_url} 
                        onView={() => handleViewDocument(viewingStudent.passport_url!)} 
                      />
                      <DocCard 
                        title="10th Marksheet" 
                        url={viewingStudent.marksheet_10_url} 
                        onView={() => handleViewDocument(viewingStudent.marksheet_10_url!)} 
                      />
                      <DocCard 
                        title="12th Marksheet" 
                        url={viewingStudent.marksheet_12_url} 
                        onView={() => handleViewDocument(viewingStudent.marksheet_12_url!)} 
                      />
                      <DocCard 
                        title="Parent Aadhar" 
                        url={viewingStudent.parent_aadhar_url} 
                        onView={() => handleViewDocument(viewingStudent.parent_aadhar_url!)} 
                      />
                      <DocCard 
                        title="Student Signature" 
                        url={viewingStudent.signature_url || viewingStudent.signatureUrl} 
                        onView={() => handleViewDocument((viewingStudent.signature_url || viewingStudent.signatureUrl)!)} 
                        isImage
                      />
                      <DocCard 
                        title="Other Documents" 
                        url={viewingStudent.studentDocsUrl} 
                        onView={() => handleViewDocument(viewingStudent.studentDocsUrl!)} 
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50 flex items-center justify-end flex-wrap gap-3 border-t border-slate-100">
                <button 
                  onClick={() => printAdmissionForm(viewingStudent)}
                  className="px-6 py-3 bg-white border border-primary/10 text-primary rounded-2xl font-bold hover:bg-primary/5 transition-all shadow-sm flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print Form
                </button>
                <button 
                  onClick={() => shareAdmissionConfirmation(viewingStudent)}
                  className="px-6 py-3 bg-green-50 text-green-600 rounded-2xl font-bold hover:bg-green-100 transition-all shadow-sm flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <div className="w-full sm:w-auto flex gap-3">
                  <button 
                    onClick={() => {
                      handleEdit(viewingStudent);
                      setViewingStudent(null);
                    }}
                    className="flex-1 sm:flex-none px-6 py-3 bg-white border border-primary/10 text-primary rounded-2xl font-bold hover:bg-primary/5 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button 
                    onClick={() => setViewingStudent(null)}
                    className="flex-1 sm:flex-none px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student Bulk Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-indigo-50/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Bulk Student Upload</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Import multiple students and link courses</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all font-bold text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-700 leading-relaxed font-bold uppercase tracking-tight">
                    Format: SR, Name, Course, Branch, Duration, Pattern, Fee. 
                    One student per line. Header row is automatically skipped if present.
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paste Content (CSV/Tab format)</label>
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">Detected {bulkData.split('\n').filter(r => r.trim()).length} lines</span>
                  </div>
                  <textarea 
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    placeholder="1, SALFIYA, Bachelor of Physiotherapy, Physiotherapy, 4 Years, Annual, 50000..."
                    className="w-full h-80 p-6 bg-slate-50 border-none rounded-3xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-4 pt-4">
                  <button 
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-6 py-3 text-slate-500 font-bold hover:text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleBulkUpload}
                    disabled={isBulkSaving || !bulkData.trim()}
                    className={cn(
                      "px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2",
                      (isBulkSaving || !bulkData.trim()) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isBulkSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Upload {bulkData.split('\n').filter(r => r.trim() && !r.toLowerCase().includes('student name')).length} Students
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
