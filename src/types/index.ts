export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'student';
  createdAt: string;
}

export interface Student {
  id: string;
  email: string;
  name: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  paymentStatus: 'pending' | 'confirmed';
  registrationDate: string;
  paymentProof?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CV {
  id: string;
  studentId: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    dateOfBirth: string;
    placeOfBirth: string;
  };
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startYear: string;
    endYear: string;
    gpa?: string;
  }>;
  experience: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateRequest {
  id: string;
  studentId: string;
  studentName: string;
  type: 'cv_update' | 'personal_info' | 'payment_confirmation';
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  paymentProof?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: 'admin' | 'student') => Promise<boolean>;
  register: (email: string, password: string, name: string, phone: string) => Promise<boolean>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  updateProfile: (name: string, email: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

export interface DataContextType {
  students: Student[];
  updateRequests: UpdateRequest[];
  cvs: CV[];
  loading: boolean;
  error: string | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  
  // Student operations
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateStudentStatus: (studentId: string, status: 'pending' | 'approved' | 'rejected') => Promise<boolean>;
  updateStudentPaymentProof: (studentId: string, paymentProofUrl: string) => Promise<boolean>;
  
  // CV operations
  updateCV: (cv: Omit<CV, 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  getStudentCV: (studentId: string) => CV | undefined;
  
  // Update request operations
  addUpdateRequest: (request: Omit<UpdateRequest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateRequestStatus: (requestId: string, status: 'pending' | 'approved' | 'rejected') => Promise<boolean>;
  
  // File operations
  uploadPaymentProof: (studentId: string, file: File) => Promise<string | null>;
  
  // Data management
  refreshData: () => Promise<void>;
  retryConnection: () => Promise<void>;
}