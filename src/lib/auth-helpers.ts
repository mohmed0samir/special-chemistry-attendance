import { AdminProfile, DoctorProfile } from '../types';
import { api } from './api';

export const ADMIN_INITIAL_NAME = 'محمد سمير عبدالعاطي';
export const ADMIN_DEFAULT_EMAIL = 'admin.specialchem@faculty.edu';

/**
 * Generate a strong, unpredictable random string part
 */
export function generateRandomPart(length: number = 4): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate Doctor Password matching the formula:
 * Prefix (CHEM or CH) + CourseCode + RandomPart
 * Example: CHEM203-K7P4
 */
export function generateDoctorPassword(courseCode: string): string {
  const cleanCode = (courseCode || '203').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const randomPart = generateRandomPart(4);
  return `CHEM${cleanCode}-${randomPart}`;
}

/**
 * Create a new Doctor account via server API
 */
export async function createDoctorAccount(data: {
  name: string;
  courseName: string;
  courseCode: string;
  groupNumbers: string;
  days: string;
  startTime: string;
  endTime: string;
  location: string;
}): Promise<{ doctor: DoctorProfile; rawPassword: string; loginEmail: string }> {
  const res = await api.createDoctor(data);
  return {
    doctor: res.doctor,
    rawPassword: res.rawPassword,
    loginEmail: res.doctor.name,
  };
}

/**
 * Reset Doctor Password via server API
 */
export async function resetDoctorPassword(doctorId: string): Promise<{ newPassword: string }> {
  const res = await api.resetDoctorPassword(doctorId);
  return { newPassword: res.newPassword };
}

/**
 * Update Admin Password via server API
 */
export async function changeCurrentUserPassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.adminChangePassword(currentPassword, newPassword);
}
