// ─── Enrolled Courses ───────────────────────────────────────────────────────
export interface EnrolledCourse {
  title: string;
  slug: string;
  image: string | null;
  progress: number;
  instructor_name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  enrolled_at: string;
}

export interface EnrollmentStudent {
  name: string;
  email: string;
  image: string | null;
}

export interface EnrollmentData {
  total_pages: number;
  current_page: number;
  total_courses: number;
  courses: EnrolledCourse[];
  student?: EnrollmentStudent; 
}

export interface EnrollmentResponse {
  success: boolean;
  status: number;
  message: string;
  data: EnrollmentData;
}

export interface CourseRatingRequest {
  rate: number;
}

export interface CourseRatingResponse {
  success: boolean;
  status: number;
  message: string;
  data: {
    rate: number;
  };
}

// ─── Base Course (All Courses + Top Rated) ──────────────────────────────────
export interface IBaseCourse {
  slug: string;
  title: string;
  description: string;
  image: string | null;
  price: string;
  category: string;
  level: string;
  created_at: string;
  is_active: boolean;
  instructor_name: string | null;
  avg_rating: number | null;
  ratings_count: number;
  students_count: number;
  is_enrolled: boolean;
  courses_count?: number;
  progress?: number;
  status?: string;
  enrolled_at?: string;
}

// ─── Top Rated Response ─────────────────────────────────────────────────────
export interface ITopRatedResponse {
  success: boolean;
  status: number;
  message: string;
  data: IBaseCourse[];
}

// ─── All Courses Response ───────────────────────────────────────────────────
export interface IAllCoursesData {
  total_courses: number;
  total_pages: number;
  current_page: number;
  courses: IBaseCourse[];
}

export interface IAllCoursesResponse {
  success: boolean;
  status: number;
  message: string;
  data: IAllCoursesData;
}

// ─── Course Card (UI) ───────────────────────────────────────────────────────
export interface ICourseCardData {
  slug: string;
  title: string;
  description: string;
  image: string | null;
  avg_rating: number;
  students_count: number;
  instructor_name: string;
  price: string;
  is_enrolled: boolean;
}

// ─── Course Detail ──────────────────────────────────────────────────────────
export interface IInstructorLink {
  slug: string;
  platformName: string;
  url: string;
}

export interface ICourseDetailRequest {
  title: string;
  slug: string;
  description: string;
  price: string | null;
  category: string;
  level: string;
  image: string | null;
  created_at: string;
  is_active: boolean;
  instructor_name: string;
  instructor_image: string | null;
  instructor_bio: string | null;
  instructor_links: IInstructorLink[];
  avg_rating: number | null;
  ratings_count: number;
  is_enrolled: boolean;
}

export interface ICourseDetailResponse {
  success: boolean;
  status: number;
  message: string;
  data: ICourseDetailRequest;
}

// ─── Enroll ─────────────────────────────────────────────────────────────────
export interface IEnrollRequest {
  course: number;
}

export interface IEnrollResponse {
  success: boolean;
  status: number;
  message: string;
  data: {
    id: number;
    student: number;
    course: number;
    enrolled_at: string;
  };
}

// ─── My Enrollments ─────────────────────────────────────────────────────────
export interface IMyEnrollmentsData {
  total_courses: number;
  total_pages: number;
  current_page: number;
  courses: IBaseCourse[];
}

export interface IMyEnrollmentsResponse {
  success: boolean;
  status: number;
  message: string;
  data: IMyEnrollmentsData;
}

// ─── Packages List ──────────────────────────────────────────────────────────
export interface IPackageCardData {
  slug: string;
  title: string;
  description: string;
  instructor_name: string;
  price: string;
  courses_count: number;
  avg_rating: number;
  image?: string | null;
  categories?: string[];
  course_slugs?: string[];
  is_enrolled?: boolean;
  created_at?: string;
}

export interface IPackagesResponse {
  success: boolean;
  status: number;
  message: string;
  data: {
    total_packages: number;
    total_pages: number;
    current_page: number;
    packages: IPackageCardData[];
  };
}

// ─── Package Details ────────────────────────────────────────────────────────
export interface IPackageDetailsCourse {
  title: string;
  slug: string;
  image: string | null;
  avg_rating: number;
  ratings_count: number;
  students_count: number;
  is_enrolled: boolean;
  instructor_name: string;
}

export interface IPackageDetails {
  title: string;
  slug: string;
  description: string;
  price: number | string | null;
  courses_count: number;
  is_enrolled: boolean;
  courses: IPackageDetailsCourse[];
  avg_rating?: number;
  ratings_count?: number;
  students_count?: number;
  instructor_name?: string | null;
  course_slugs?: string[];
  categories?: string[];
  created_at?: string;
}

export interface IPackageDetailsResponse {
  success: boolean;
  status: number;
  message: string;
  data: IPackageDetails;
}
