export type Company = 'Seven' | 'ARQO';
export type UserRole = 'admin' | 'colaborador';
export type UserStatus = 'ativo' | 'inativo';

export interface UserProfile {
  id: string;
  email: string | null;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  company: Company;
  status: UserStatus;
}

export interface ManagedAuthUser {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  company: Company;
  status: UserStatus;
  has_profile: boolean;
}

export interface Course {
  id: string;
  company: Company;
  title: string;
  description: string | null;
  cover_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface LearningModule {
  id: string;
  course_id: string;
  company?: Company | null;
  title: string;
  description: string | null;
  duration?: string | null;
  order_index: number;
  created_at: string;
  updated_at?: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  attachment_url?: string | null;
  content: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CourseTree extends Course {
  modules: Array<LearningModule & { lessons: Lesson[] }>;
}

export interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  totalLessons: number;
  completedLessons: number;
  averageProgress: number;
}

export interface HealthIssue {
  id: string;
  label: string;
  severity: 'ok' | 'warning' | 'critical';
  action: string;
}

export interface ReadinessScore {
  score: number;
  missing: string[];
}
