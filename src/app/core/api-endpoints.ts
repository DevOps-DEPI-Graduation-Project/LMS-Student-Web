import { environment } from '../../environments/environment';

const BASE_URL = environment.baseUrl;

export const API_ENDPOINTS = {

  // ── Auth ──────────────────────────────────────────────────────────────────
  login: `${BASE_URL}api/auth/login/`,
  register: `${BASE_URL}api/auth/register/`,
  logout: `${BASE_URL}api/auth/logout/`,
  verifyEmail: `${BASE_URL}api/auth/verify-email/`,
  forgotPassword: `${BASE_URL}api/auth/forgot-password/`,
  changePassword: `${BASE_URL}api/auth/change-password/`,
  resetPassword: `${BASE_URL}api/auth/reset-password/`,
  resendOtp: `${BASE_URL}api/auth/resend-otp/`,
  refreshToken: `${BASE_URL}api/auth/token/refresh/`,
  checkToken: `${BASE_URL}api/auth/check-token/`,

  // ── Students ──────────────────────────────────────────
  students: `${BASE_URL}api/students/`,
  studentBySlug: (slug: string) => `${BASE_URL}api/students/${slug}/`,

  // ───course topRated ──────────────────────────────────────────
  coursesTopRated: (limit: number) => `${BASE_URL}api/courses/topRated/?limit=${limit}`,
  // enrollments
  myCourses: `${BASE_URL}api/courses/myEnrollments/`,
  // course details
  courseDetails: (slug: string) => `${BASE_URL}api/courses/${slug}/`,
  // enroll in course (backend expects /api/courses/enroll/{slug}/)
  enroll: (slug: string) => `${BASE_URL}api/courses/enroll/${slug}/`,
  // all courses
  allCourses: `${BASE_URL}api/courses/all/`,
  // ── All Courses with pagination ──
  allCoursesPaged: (page: number, pageSize: number) =>
    `${BASE_URL}api/courses/all/?page=${page}&page_size=${pageSize}`,
  // package
  package: `${BASE_URL}api/packages/all/`,
  // ── All packages with pagination ──
  packagePaged: (page: number, pageSize: number) =>
    `${BASE_URL}api/packages/all/?page=${page}&page_size=${pageSize}`,

  //package details
  packageDetails: (slug: string) => `${BASE_URL}api/packages/${slug}/`,

  //course workspace
  courseWorkspace: (slug: string) => `${BASE_URL}api/courses/${slug}/workspace/`,

  // ── Materials ──────────────────────────────────────────
  materials: (courseSlug: string) => `${BASE_URL}api/materials/${courseSlug}/`,
  // ── Quiz ──────────────────────────────────────────
  quiz: (courseSlug: string) => `${BASE_URL}api/courses/${courseSlug}/quizzes/`,
  // ── Quiz Questions ───────────────────────────────────────────
  quizQuestions: (quiz_slug: string) => `${BASE_URL}api/quizzes/${quiz_slug}/questions/`,
  // ── Submit Quiz Answers ───────────────────────────────────────────
  submitQuizAnswers: (quiz_slug: string) => `${BASE_URL}api/quizzes/${quiz_slug}/submit/`,



  //--videos

  videoWorkspace: (courseSlug: string) => `${BASE_URL}api/courses/${courseSlug}/videos/`,
  videoComplete: (videoSlug: string) => `${BASE_URL}api/video-complete/${videoSlug}/`,

};
