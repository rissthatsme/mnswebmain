import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { supabase, testSupabaseConnection } from '../lib/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('lpk_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error('Error parsing stored user:', err);
        localStorage.removeItem('lpk_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, role: 'admin' | 'student'): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Test connection first
      const connectionTest = await testSupabaseConnection();
      if (!connectionTest.success) {
        setError(connectionTest.error || 'Database connection failed');
        setLoading(false);
        return false;
      }

      if (role === 'admin') {
        // Admin login - check against hardcoded admin credentials
        if (email === 'admin@lpk.com' && password === 'admin123') {
          const adminUser: User = {
            id: 'admin-1',
            email: 'admin@lpk.com',
            name: 'Admin LPK',
            role: 'admin',
            createdAt: new Date().toISOString()
          };
          setUser(adminUser);
          localStorage.setItem('lpk_user', JSON.stringify(adminUser));
          setLoading(false);
          return true;
        }
        setError('Email atau password admin salah');
        setLoading(false);
        return false;
      } else {
        // Student login - check if student exists in database with correct password
        console.log('Attempting student login for:', email);
        
        const { data: students, error } = await supabase
          .from('students')
          .select('*')
          .eq('email', email)
          .limit(1);

        if (error) {
          console.error('Login query error:', error);
          setError('Terjadi kesalahan saat login. Silakan coba lagi.');
          setLoading(false);
          return false;
        }

        console.log('Students found:', students);

        const student = students && students.length > 0 ? students[0] : null;

        if (!student) {
          setError('Email tidak ditemukan. Silakan daftar terlebih dahulu.');
          setLoading(false);
          return false;
        }

        console.log('Student found:', student);
        console.log('Stored password:', student.password_hash);
        console.log('Entered password:', password);

        // Check password - compare with stored password_hash
        if (student.password_hash && student.password_hash === password) {
          const studentUser: User = {
            id: student.id,
            email: student.email,
            name: student.name,
            role: 'student',
            createdAt: student.created_at
          };
          
          console.log('Login successful for student:', studentUser);
          
          setUser(studentUser);
          localStorage.setItem('lpk_user', JSON.stringify(studentUser));
          setLoading(false);
          return true;
        } else {
          console.log('Password mismatch');
          setError('Password salah. Gunakan password: student123');
          setLoading(false);
          return false;
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Terjadi kesalahan saat login. Silakan coba lagi.');
      setLoading(false);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string, phone: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Test connection first
      const connectionTest = await testSupabaseConnection();
      if (!connectionTest.success) {
        setError(connectionTest.error || 'Database connection failed');
        setLoading(false);
        return false;
      }

      // Check if student already exists
      const { data: existingStudents, error: checkError } = await supabase
        .from('students')
        .select('email')
        .eq('email', email)
        .limit(1);

      if (checkError) {
        console.error('Registration check error:', checkError);
        setError('Terjadi kesalahan saat memeriksa email. Silakan coba lagi.');
        setLoading(false);
        return false;
      }

      if (existingStudents && existingStudents.length > 0) {
        setError('Email sudah terdaftar. Silakan gunakan email lain atau login.');
        setLoading(false);
        return false;
      }

      // Insert new student with password
      const { data: newStudents, error } = await supabase
        .from('students')
        .insert({
          email,
          name,
          phone,
          password_hash: password, // Store password (in production, this should be hashed)
          status: 'pending',
          payment_status: 'pending',
          registration_date: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Registration error:', error);
        setError('Gagal mendaftar. Silakan coba lagi.');
        setLoading(false);
        return false;
      }

      if (!newStudents || newStudents.length === 0) {
        console.error('No student data returned after registration');
        setError('Gagal mendaftar. Silakan coba lagi.');
        setLoading(false);
        return false;
      }

      const newStudent = newStudents[0];

      const studentUser: User = {
        id: newStudent.id,
        email: newStudent.email,
        name: newStudent.name,
        role: 'student',
        createdAt: newStudent.created_at
      };

      setUser(studentUser);
      localStorage.setItem('lpk_user', JSON.stringify(studentUser));
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setError('Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
      setLoading(false);
      return false;
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      if (user.role === 'admin') {
        // For admin, check against hardcoded password
        if (currentPassword !== 'admin123') {
          setError('Password lama tidak benar');
          setLoading(false);
          return false;
        }
        
        // In a real app, you would update the admin password in a secure way
        // For now, we'll just show success but not actually change anything
        setLoading(false);
        return true;
      } else {
        // For students, update in database
        const { data: students, error: fetchError } = await supabase
          .from('students')
          .select('password_hash')
          .eq('id', user.id)
          .single();

        if (fetchError || !students) {
          setError('Gagal memverifikasi password lama');
          setLoading(false);
          return false;
        }

        if (students.password_hash !== currentPassword) {
          setError('Password lama tidak benar');
          setLoading(false);
          return false;
        }

        // Update password
        const { error: updateError } = await supabase
          .from('students')
          .update({ 
            password_hash: newPassword,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          setError('Gagal memperbarui password');
          setLoading(false);
          return false;
        }

        setLoading(false);
        return true;
      }
    } catch (error) {
      console.error('Password update error:', error);
      setError('Terjadi kesalahan saat memperbarui password');
      setLoading(false);
      return false;
    }
  };

  const updateProfile = async (name: string, email: string): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      if (user.role === 'admin') {
        // For admin, just update local state
        const updatedUser = { ...user, name, email };
        setUser(updatedUser);
        localStorage.setItem('lpk_user', JSON.stringify(updatedUser));
        setLoading(false);
        return true;
      } else {
        // For students, update in database
        const { error } = await supabase
          .from('students')
          .update({ 
            name,
            email,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) {
          setError('Gagal memperbarui profil');
          setLoading(false);
          return false;
        }

        // Update local user state
        const updatedUser = { ...user, name, email };
        setUser(updatedUser);
        localStorage.setItem('lpk_user', JSON.stringify(updatedUser));
        setLoading(false);
        return true;
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Terjadi kesalahan saat memperbarui profil');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('lpk_user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      updatePassword,
      updateProfile,
      logout, 
      loading, 
      error 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};