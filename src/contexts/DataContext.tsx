import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student, UpdateRequest, CV, DataContextType } from '../types';
import { supabase, testSupabaseConnection } from '../lib/supabase';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [updateRequests, setUpdateRequests] = useState<UpdateRequest[]>([]);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedStudents: Student[] = data.map(student => ({
        id: student.id,
        email: student.email,
        name: student.name,
        phone: student.phone,
        status: student.status,
        paymentStatus: student.payment_status,
        registrationDate: student.registration_date,
        paymentProof: student.payment_proof,
        createdAt: student.created_at,
        updatedAt: student.updated_at
      }));

      setStudents(formattedStudents);
      setConnectionStatus('connected');
      setError(null);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students data');
      setConnectionStatus('disconnected');
    }
  };

  const fetchUpdateRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('update_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRequests: UpdateRequest[] = data.map(request => ({
        id: request.id,
        studentId: request.student_id,
        studentName: request.student_name,
        type: request.type,
        description: request.description,
        status: request.status,
        paymentProof: request.payment_proof,
        createdAt: request.created_at,
        updatedAt: request.updated_at
      }));

      setUpdateRequests(formattedRequests);
    } catch (error) {
      console.error('Error fetching update requests:', error);
      setError('Failed to fetch update requests');
    }
  };

  const fetchCVs = async () => {
    try {
      const { data, error } = await supabase
        .from('cvs')
        .select('*');

      if (error) throw error;

      const formattedCVs: CV[] = data.map(cv => ({
        id: cv.id,
        studentId: cv.student_id,
        personalInfo: cv.personal_info || {
          fullName: '',
          email: '',
          phone: '',
          address: '',
          dateOfBirth: '',
          placeOfBirth: ''
        },
        education: cv.education || [],
        experience: cv.experience || [],
        skills: cv.skills || [],
        createdAt: cv.created_at,
        updatedAt: cv.updated_at
      }));

      setCvs(formattedCVs);
    } catch (error) {
      console.error('Error fetching CVs:', error);
      setError('Failed to fetch CVs');
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setConnectionStatus('connecting');
    
    try {
      // Test connection first
      const connectionTest = await testSupabaseConnection();
      if (!connectionTest.success) {
        setError(connectionTest.error || 'Connection failed');
        setConnectionStatus('disconnected');
        setLoading(false);
        return;
      }

      await Promise.all([
        fetchStudents(),
        fetchUpdateRequests(),
        fetchCVs()
      ]);
      
      setConnectionStatus('connected');
      setError(null);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data');
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  const retryConnection = async () => {
    await refreshData();
  };

  useEffect(() => {
    refreshData();
    
    // Set up real-time subscriptions with better error handling
    const studentsSubscription = supabase
      .channel('students_realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'students' 
        },
        (payload) => {
          console.log('Students table changed:', payload);
          fetchStudents(); // Refresh students data
        }
      )
      .subscribe((status) => {
        console.log('Students subscription status:', status);
      });

    const requestsSubscription = supabase
      .channel('requests_realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'update_requests' 
        },
        (payload) => {
          console.log('Update requests table changed:', payload);
          fetchUpdateRequests(); // Refresh requests data
        }
      )
      .subscribe((status) => {
        console.log('Requests subscription status:', status);
      });

    const cvsSubscription = supabase
      .channel('cvs_realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'cvs' 
        },
        (payload) => {
          console.log('CVs table changed:', payload);
          fetchCVs(); // Refresh CVs data
        }
      )
      .subscribe((status) => {
        console.log('CVs subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from real-time channels');
      studentsSubscription.unsubscribe();
      requestsSubscription.unsubscribe();
      cvsSubscription.unsubscribe();
    };
  }, []);

  const addStudent = async (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('students')
        .insert({
          email: student.email,
          name: student.name,
          phone: student.phone,
          password_hash: 'student123', // Default password for new students
          status: student.status,
          payment_status: student.paymentStatus,
          registration_date: student.registrationDate,
          payment_proof: student.paymentProof
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error adding student:', error);
      return false;
    }
  };

  const updateStudentStatus = async (studentId: string, status: 'pending' | 'approved' | 'rejected'): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) throw error;

      // Update local state immediately for better UX
      setStudents(prev =>
        prev.map(student =>
          student.id === studentId ? { ...student, status } : student
        )
      );

      return true;
    } catch (error) {
      console.error('Error updating student status:', error);
      return false;
    }
  };

  const updateStudentPaymentProof = async (studentId: string, paymentProofUrl: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ 
          payment_proof: paymentProofUrl,
          payment_status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating student payment proof:', error);
      return false;
    }
  };

  const addUpdateRequest = async (request: Omit<UpdateRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('update_requests')
        .insert({
          student_id: request.studentId,
          student_name: request.studentName,
          type: request.type,
          description: request.description,
          status: request.status,
          payment_proof: request.paymentProof
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error adding update request:', error);
      return false;
    }
  };

  const updateRequestStatus = async (requestId: string, status: 'pending' | 'approved' | 'rejected'): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('update_requests')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state immediately for better UX
      setUpdateRequests(prev =>
        prev.map(request =>
          request.id === requestId ? { ...request, status } : request
        )
      );

      return true;
    } catch (error) {
      console.error('Error updating request status:', error);
      return false;
    }
  };

  const uploadPaymentProof = async (studentId: string, file: File): Promise<string | null> => {
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentId}-${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      console.log('Uploading file:', { fileName, filePath, fileSize: file.size });

      // Try to upload the file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        
        // If bucket doesn't exist, try to create it first
        if (uploadError.message?.includes('Bucket not found')) {
          console.log('Bucket not found, trying to create...');
          
          // Try to create the bucket (this might fail if we don't have permissions)
          const { error: bucketError } = await supabase.storage.createBucket('payment-proofs', {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
          });

          if (bucketError) {
            console.error('Failed to create bucket:', bucketError);
            throw new Error('Storage bucket tidak tersedia. Silakan hubungi admin.');
          }

          // Retry upload after creating bucket
          const { data: retryData, error: retryError } = await supabase.storage
            .from('payment-proofs')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (retryError) {
            throw retryError;
          }
          
          console.log('Retry upload successful:', retryData);
        } else {
          throw uploadError;
        }
      } else {
        console.log('Upload successful:', uploadData);
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      console.log('Public URL generated:', urlData.publicUrl);
      return urlData.publicUrl;

    } catch (error) {
      console.error('Error uploading payment proof:', error);
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('row-level security')) {
          throw new Error('Tidak dapat mengupload file. Silakan coba lagi atau hubungi admin.');
        } else if (error.message.includes('Bucket not found')) {
          throw new Error('Storage belum dikonfigurasi. Silakan hubungi admin.');
        } else {
          throw new Error(`Upload gagal: ${error.message}`);
        }
      }
      
      return null;
    }
  };

  const updateCV = async (cv: Omit<CV, 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const cvData = {
        student_id: cv.studentId,
        personal_info: cv.personalInfo,
        education: cv.education,
        experience: cv.experience,
        skills: cv.skills
      };

      // Check if CV exists
      const { data: existingCV } = await supabase
        .from('cvs')
        .select('id')
        .eq('student_id', cv.studentId)
        .single();

      if (existingCV) {
        // Update existing CV
        const { error } = await supabase
          .from('cvs')
          .update(cvData)
          .eq('student_id', cv.studentId);

        if (error) throw error;
      } else {
        // Insert new CV
        const { error } = await supabase
          .from('cvs')
          .insert(cvData);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error updating CV:', error);
      return false;
    }
  };

  const getStudentCV = (studentId: string): CV | undefined => {
    return cvs.find(cv => cv.studentId === studentId);
  };

  return (
    <DataContext.Provider value={{
      students,
      updateRequests,
      cvs,
      loading,
      error,
      connectionStatus,
      addStudent,
      updateStudentStatus,
      updateStudentPaymentProof,
      addUpdateRequest,
      updateRequestStatus,
      updateCV,
      getStudentCV,
      uploadPaymentProof,
      refreshData,
      retryConnection
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};