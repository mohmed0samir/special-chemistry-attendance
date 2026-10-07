import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminProfile, DoctorProfile, Student, UserRole } from '../types';
import { api } from '../lib/api';

export const ADMIN_INITIAL_NAME = 'محمد سمير عبدالعاطي';

interface AuthContextType {
  role: UserRole | null;
  adminProfile: AdminProfile | null;
  doctorProfile: DoctorProfile | null;
  studentProfile: Student | null;
  loading: boolean;
  loginAdmin: (name: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginDoctor: (name: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginStudent: (name: string, groupNumber: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType>({
  role: null,
  adminProfile: null,
  doctorProfile: null,
  studentProfile: null,
  loading: true,
  loginAdmin: async () => ({ success: false }),
  loginDoctor: async () => ({ success: false }),
  loginStudent: async () => ({ success: false }),
  logout: () => {},
  refreshProfile: () => {},
});

const SESSION_KEY = 'chem_active_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load stored session on boot
  useEffect(() => {
    try {
      const storedStr = sessionStorage.getItem(SESSION_KEY);
      if (storedStr) {
        const parsed = JSON.parse(storedStr);
        if (parsed.role === 'admin') {
          setRole('admin');
          setAdminProfile(parsed.profile);
        } else if (parsed.role === 'doctor') {
          setRole('doctor');
          setDoctorProfile(parsed.profile);
        } else if (parsed.role === 'student') {
          setRole('student');
          setStudentProfile(parsed.profile);
        }
      }
    } catch (e) {
      sessionStorage.removeItem(SESSION_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const loginAdmin = async (name: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const res = await api.adminLogin(name, password);
      setRole('admin');
      setAdminProfile(res.user);
      setDoctorProfile(null);
      setStudentProfile(null);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ role: 'admin', profile: res.user }));
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'فشل تسجيل دخول المشرف.' };
    }
  };

  const loginDoctor = async (name: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const res = await api.doctorLogin(name, password);
      setRole('doctor');
      setDoctorProfile(res.doctor);
      setAdminProfile(null);
      setStudentProfile(null);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ role: 'doctor', profile: res.doctor }));
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'اسم الدكتور أو كلمة المرور غير صحيحة.' };
    }
  };

  const loginStudent = async (name: string, groupNumber: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const res = await api.studentLogin(name, groupNumber);
      setRole('student');
      setStudentProfile(res.student);
      setAdminProfile(null);
      setDoctorProfile(null);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ role: 'student', profile: res.student }));
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'بيانات الطالب غير موجودة في قائمة الدفعة.' };
    }
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setRole(null);
    setAdminProfile(null);
    setDoctorProfile(null);
    setStudentProfile(null);
  };

  const refreshProfile = () => {
    // re-check session
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        adminProfile,
        doctorProfile,
        studentProfile,
        loading,
        loginAdmin,
        loginDoctor,
        loginStudent,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
