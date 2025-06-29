import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 1
    }
  }
});

// Test connection function
export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        success: false,
        error: 'Supabase configuration is missing. Please check your environment variables.'
      };
    }

    const { data, error } = await supabase
      .from('students')
      .select('count')
      .limit(1);
    
    if (error) {
      return {
        success: false,
        error: `Database connection failed: ${error.message}`
      };
    }
    
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown connection error'
    };
  }
};

// Database types
export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string;
          password_hash: string;
          status: 'pending' | 'approved' | 'rejected';
          payment_status: 'pending' | 'confirmed';
          payment_proof?: string;
          registration_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          phone: string;
          password_hash: string;
          status?: 'pending' | 'approved' | 'rejected';
          payment_status?: 'pending' | 'confirmed';
          payment_proof?: string;
          registration_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string;
          password_hash?: string;
          status?: 'pending' | 'approved' | 'rejected';
          payment_status?: 'pending' | 'confirmed';
          payment_proof?: string;
          registration_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      cvs: {
        Row: {
          id: string;
          student_id: string;
          personal_info: any;
          education: any;
          experience: any;
          skills: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          personal_info?: any;
          education?: any;
          experience?: any;
          skills?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          personal_info?: any;
          education?: any;
          experience?: any;
          skills?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      update_requests: {
        Row: {
          id: string;
          student_id: string;
          student_name: string;
          type: 'cv_update' | 'personal_info' | 'payment_confirmation';
          description: string;
          status: 'pending' | 'approved' | 'rejected';
          payment_proof?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          student_name: string;
          type: 'cv_update' | 'personal_info' | 'payment_confirmation';
          description: string;
          status?: 'pending' | 'approved' | 'rejected';
          payment_proof?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          student_name?: string;
          type?: 'cv_update' | 'personal_info' | 'payment_confirmation';
          description?: string;
          status?: 'pending' | 'approved' | 'rejected';
          payment_proof?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}