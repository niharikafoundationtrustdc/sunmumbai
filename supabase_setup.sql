-- =========================================================
-- CMS FULL DATABASE SETUP (Supabase SQL Editor)
-- Version: 1.4
-- Updated: 2026-04-23
-- =========================================================

-- =========================================================
-- EXTENSIONS
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- DROP TABLES (SAFE ORDER)
-- =========================================================
DROP TABLE IF EXISTS visitor_log CASCADE;
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS papers CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS expense_categories CASCADE;
DROP TABLE IF EXISTS income CASCADE;
DROP TABLE IF EXISTS income_categories CASCADE;
DROP TABLE IF EXISTS fee_transactions CASCADE;
DROP TABLE IF EXISTS fees CASCADE;
DROP TABLE IF EXISTS fee_group_items CASCADE;
DROP TABLE IF EXISTS fee_groups CASCADE;
DROP TABLE IF EXISTS student_document_records CASCADE;
DROP TABLE IF EXISTS library_issues CASCADE;
DROP TABLE IF EXISTS library_items CASCADE;
DROP TABLE IF EXISTS study_activities CASCADE;
DROP TABLE IF EXISTS syllabus CASCADE;
DROP TABLE IF EXISTS timetable CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS enquiries CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS user_credentials CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notices CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS admissions CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS semesters CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS study_logs CASCADE;
DROP TABLE IF EXISTS time_table CASCADE;
DROP TABLE IF EXISTS org_settings CASCADE;

-- =========================================================
-- CORE TABLES
-- =========================================================

-- App Settings
CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Credentials (Auth bypass helper/manual auth)
CREATE TABLE user_credentials (
    id TEXT PRIMARY KEY, -- User ID or Username
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Courses
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT,
    department TEXT,
    duration TEXT,
    semesters INTEGER DEFAULT 1,
    credits INTEGER DEFAULT 0,
    fee_pattern TEXT DEFAULT 'SEMESTER',
    fee_amount DECIMAL(10,2) DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Staff (Faculty)
CREATE TABLE staff (
    id TEXT PRIMARY KEY, -- Unified ID (e.g., FAC20261234)
    staff_id TEXT UNIQUE,
    title TEXT,
    first_name TEXT,
    middle_name TEXT,
    surname TEXT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    department TEXT,
    branch TEXT, -- Matching frontend 'branch'
    designation TEXT,
    joined_date DATE,
    joining_year TEXT,
    blood_group TEXT,
    religion TEXT,
    caste TEXT,
    category TEXT,
    address TEXT,
    state TEXT,
    pincode TEXT,
    permanent_address TEXT,
    permanent_state TEXT,
    permanent_pincode TEXT,
    transport_mode TEXT,
    photo_url TEXT,
    father_name TEXT,
    mother_name TEXT,
    parent_phone TEXT,
    emergency_name TEXT,
    emergency_phone TEXT,
    bank_name TEXT,
    ifsc_code TEXT,
    account_number TEXT,
    bank_branch TEXT,
    branch_name TEXT,
    batch TEXT,
    role TEXT,
    allergies TEXT,
    vehicle_number TEXT,
    route_name TEXT,
    father_occupation TEXT,
    mother_occupation TEXT,
    parent_email TEXT,
    emergency_address TEXT,
    emergency_contact_name TEXT,
    staff_documents TEXT[],
    nominee_documents TEXT[],
    signature_url TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Students
CREATE TABLE students (
    id TEXT PRIMARY KEY, -- Unified ID (e.g., STU20261234)
    roll_no TEXT UNIQUE,
    title TEXT,
    first_name TEXT,
    middle_name TEXT,
    surname TEXT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    course_id UUID REFERENCES courses(id),
    branch TEXT,
    batch TEXT,
    year TEXT,
    semester TEXT,
    session TEXT,
    blood_group TEXT,
    religion TEXT,
    caste TEXT,
    category TEXT,
    residential_address TEXT,
    state TEXT,
    pincode TEXT,
    permanent_address TEXT,
    permanent_state TEXT,
    permanent_pincode TEXT,
    transport_mode TEXT,
    vehicle_number TEXT,
    route_name TEXT,
    is_hosteller BOOLEAN DEFAULT FALSE,
    hostel_name TEXT,
    room_number TEXT,
    father_name TEXT,
    father_occupation TEXT,
    mother_name TEXT,
    mother_occupation TEXT,
    parent_phone TEXT,
    parent_email TEXT,
    emergency_contact_name TEXT,
    emergency_phone TEXT,
    emergency_address TEXT,
    allergies TEXT,
    photo_url TEXT,
    student_documents TEXT[],
    parent_documents TEXT[],
    signature_url TEXT,
    aadhar_url TEXT,
    pan_url TEXT,
    passport_url TEXT,
    marksheet_10_url TEXT,
    marksheet_12_url TEXT,
    parent_aadhar_url TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Front Office (Enquiries)
CREATE TABLE enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    parent_name TEXT,
    phone TEXT NOT NULL,
    course TEXT,
    branch TEXT,
    source TEXT,
    status TEXT DEFAULT 'Pending',
    assigned_to TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Visitor Log
CREATE TABLE visitor_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_no TEXT UNIQUE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    purpose TEXT,
    person_to_meet TEXT,
    in_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    out_time TIMESTAMP WITH TIME ZONE,
    photo_url TEXT,
    id_proof_type TEXT,
    id_proof_number TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Applications (Registrations)
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    course_id UUID REFERENCES courses(id),
    branch TEXT,
    score DECIMAL(5,2) DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- ACADEMIC MODULES
-- =========================================================

-- Timetable
CREATE TABLE timetable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    course_id UUID REFERENCES courses(id),
    subject TEXT NOT NULL,
    faculty TEXT,
    room TEXT,
    batch TEXT,
    type TEXT DEFAULT 'Regular',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Syllabus
CREATE TABLE syllabus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id),
    unit_number INTEGER NOT NULL,
    unit_title TEXT NOT NULL,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Study Activities (Logged activities)
CREATE TABLE study_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE DEFAULT CURRENT_DATE,
    batch TEXT,
    course_id UUID REFERENCES courses(id),
    activities TEXT[],
    topics_covered TEXT,
    assignment_subject TEXT,
    assignment_topic TEXT,
    assignment TEXT,
    remarks TEXT,
    teacher_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Attendance
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT REFERENCES students(id),
    date DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL,
    subject TEXT,
    method TEXT,
    ip_address TEXT,
    location TEXT,
    time TEXT,
    course_id UUID REFERENCES courses(id),
    branch TEXT,
    batch TEXT,
    year TEXT,
    semester TEXT,
    section TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, date, subject)
);

-- =========================================================
-- FINANCIAL MODULES
-- =========================================================

-- Fee Groups (Fee Pattern Definitions)
CREATE TABLE fee_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    course_id UUID REFERENCES courses(id),
    total_amount DECIMAL(10,2) NOT NULL,
    items JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fee Group Items
CREATE TABLE fee_group_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES fee_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Individual Student Fees (Outstanding/Paid)
CREATE TABLE fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT REFERENCES students(id),
    amount DECIMAL(10,2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'PENDING',
    description TEXT,
    edit_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fee Transactions (Student Payments)
CREATE TABLE fee_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT REFERENCES students(id),
    fee_id UUID REFERENCES fees(id),
    category TEXT, -- Added category
    amount DECIMAL(10,2) NOT NULL, -- Renamed from amount_paid
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method TEXT, -- Renamed from payment_mode
    transaction_id TEXT,
    remarks TEXT,
    status TEXT NOT NULL DEFAULT 'Completed',
    receipt_no TEXT UNIQUE,
    edit_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Income Categories
CREATE TABLE income_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Income Records
CREATE TABLE income (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    category TEXT DEFAULT 'Other',
    amount DECIMAL(10,2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    remarks TEXT,
    reference_no TEXT,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Expense Categories
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Expense Records
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name TEXT NOT NULL,
    category TEXT DEFAULT 'Utilities',
    amount DECIMAL(10,2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    payee TEXT,
    payment_method TEXT,
    receipt_no TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- EXAMINATION SYSTEM
-- =========================================================

-- Exam Papers
CREATE TABLE papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    course_id UUID REFERENCES courses(id),
    subject TEXT,
    set_code TEXT,
    total_marks INTEGER,
    instructions TEXT,
    duration INTEGER,
    questions JSONB,
    created_by TEXT,
    edit_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled Exams
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    session TEXT,
    course_id UUID REFERENCES courses(id),
    subject TEXT,
    date DATE,
    start_time TEXT,
    duration INTEGER,
    total_marks INTEGER DEFAULT 100,
    passing_marks INTEGER DEFAULT 40,
    paper_id UUID REFERENCES papers(id),
    paper_setter TEXT,
    edit_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exam Results
CREATE TABLE results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id),
    student_id TEXT REFERENCES students(id),
    marks_obtained DECIMAL(5,2),
    total_marks INTEGER,
    evaluation_comment TEXT,
    evaluation_data JSONB, -- For detailed question-wise marks
    scanned_sheet_url TEXT, -- Original answer sheet
    evaluated_sheet_url TEXT, -- Evaluated answer sheet with marks
    status TEXT DEFAULT 'Draft', -- Draft, Evaluated, Published
    edit_count INTEGER DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE,
    evaluated_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- COMMUNICATION
-- =========================================================

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notices / Ticker
CREATE TABLE notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'Notice',
    audience TEXT DEFAULT 'All',
    priority TEXT DEFAULT 'Normal',
    is_template BOOLEAN DEFAULT FALSE,
    created_by TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- LIBRARY & INVENTORY MANAGEMENT
-- =========================================================

-- Library Items (Formerly library_books)
CREATE TABLE library_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author TEXT,
    isbn TEXT UNIQUE,
    category TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    available INTEGER DEFAULT 1,
    rack_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Item Issues
CREATE TABLE library_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES library_items(id),
    student_id TEXT REFERENCES students(id),
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    return_date DATE,
    status TEXT DEFAULT 'Issued',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- DOCUMENT RECORDS MANAGEMENT
-- =========================================================

CREATE TABLE student_document_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT REFERENCES students(id),
    document_type TEXT NOT NULL,
    document_number TEXT,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'Submitted',
    issued_to TEXT,
    issued_date DATE,
    collected_by TEXT,
    collection_date DATE,
    file_url TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ORGANIZATIONAL SETTINGS (Seeded as defaults)
-- (Any additional organizational settings can go here)

-- =========================================================
-- RLS POLICIES (UNIVERSAL PERMISSIVE ACCESS FOR DEMO)
-- =========================================================

-- Enable RLS and set completely open policies for ALL roles (anon, authenticated, etc)
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        
        -- Drop any existing policies first to avoid "already exists" errors
        EXECUTE format('DROP POLICY IF EXISTS "Public Read %I" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Public Insert %I" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Public Update %I" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Public Delete %I" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow All" ON %I', t);
        
        -- Create broad policies to allow full functionality in the preview environment
        -- 1. Public Read 
        EXECUTE format('CREATE POLICY "Public Read %I" ON %I FOR SELECT USING (true)', t, t);
        
        -- 2. Public Insert
        EXECUTE format('CREATE POLICY "Public Insert %I" ON %I FOR INSERT TO anon, authenticated WITH CHECK (true)', t, t);
        
        -- 3. Public Update
        EXECUTE format('CREATE POLICY "Public Update %I" ON %I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)', t, t);
        
        -- 4. Public Delete
        EXECUTE format('CREATE POLICY "Public Delete %I" ON %I FOR DELETE TO anon, authenticated USING (true)', t, t);
    END LOOP;
END $$;

-- STORAGE SETUP (Supabase Storage)
-- =========================================================

-- Create a bucket for documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public Read Documents" ON storage.objects;
    DROP POLICY IF EXISTS "Public List Documents" ON storage.objects;
    DROP POLICY IF EXISTS "Public Upload Documents" ON storage.objects;
    DROP POLICY IF EXISTS "Public Update Documents" ON storage.objects;
    DROP POLICY IF EXISTS "Public Delete Documents" ON storage.objects;

    -- Standard storage policies
    CREATE POLICY "Public Read Documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
    CREATE POLICY "Public Upload Documents" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'documents');
    CREATE POLICY "Public Update Documents" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'documents');
    CREATE POLICY "Public Delete Documents" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'documents');
END $$;

-- =========================================================
-- SEED DATA
-- =========================================================

-- Default Settings
INSERT INTO app_settings (key, value) VALUES 
('general', '{"collegeName": "Sun Group of Institutions", "foundationName": "Sri Kailashnath Foundation®", "address": "B-10, Industrial Market, Sakinaka, Mumbai", "logo": "", "email": "info@sungroup.edu", "phone": "9833057189"}'),
('academic', '{"sessions": ["2024-25", "2025-26"], "semesters": ["1st Semester", "2nd Semester", "1st Year", "2nd Year"], "branches": ["Computer Science", "Information Technology", "Mechanical", "Physiotherapy"], "batches": ["Morning", "Evening", "Weekend"], "religions": ["Hinduism", "Islam", "Christianity", "Sikhism", "Buddhism", "Jainism"], "castes": ["General", "OBC", "SC", "ST", "EWS"]}'),
('fees', '{"paymentSchemes": ["Cash", "UPI", "Card", "Cheque", "DD", "Bank Transfer"]}');

-- Seed Courses
INSERT INTO courses (name, code, department, duration, semesters, credits, fee_pattern, fee_amount, description) VALUES
('Computer Science & Engineering', 'CSE', 'Engineering', '4 Years', 8, 160, 'SEMESTER', 25000, 'Core computer science principles and applications.'),
('Information Technology', 'IT', 'Engineering', '4 Years', 8, 158, 'SEMESTER', 24000, 'Focus on information systems and network technologies.'),
('Electronics & Communication', 'ECE', 'Engineering', '4 Years', 8, 162, 'SEMESTER', 26000, 'Study of electronic circuits and communication systems.');

-- Default Admin User
INSERT INTO user_credentials (id, password, role, name, email) VALUES 
('admin', 'Sungroup@123admin', 'SUPER_ADMIN', 'System Administrator', 'admin@sungroup.edu');



