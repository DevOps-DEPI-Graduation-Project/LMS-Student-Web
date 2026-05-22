import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, defaultIfEmpty, map, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../core/api-endpoints';
import {
  CourseRatingResponse,
  EnrolledCourse,
  EnrollmentResponse,
  IBaseCourse,
  ICourseCardData,
  ICourseDetailRequest,
  ICourseDetailResponse,
  IEnrollResponse,
  IMyEnrollmentsResponse,
  IPackageDetails,
  IPackageDetailsResponse,
  IPackagesResponse,
  ITopRatedResponse,
  IAllCoursesResponse,
  IPackageCardData,
} from '../models/course.model';

// ─── User Service ────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class User {
  private readonly baseUrl = environment.baseUrl;
  enrollments: any;
  constructor(private http: HttpClient) {}

  selectedCourse = signal<ICourseDetailRequest | null>(null);

  setSelectedCourse(course: ICourseDetailRequest) {
    this.selectedCourse.set(course);
  }

  private coursesSubject = new BehaviorSubject<EnrolledCourse[]>([]);
  courses$ = this.coursesSubject.asObservable();

  getMyEnrollments(page: number = 1, pageSize: number = 12): Observable<EnrollmentResponse> {
    return this.http
      .get<EnrollmentResponse>(`${this.baseUrl}api/courses/myEnrollments/`, {
        params: {
          page: page.toString(),
          page_size: pageSize.toString(),
        },
      })
      .pipe(
        map((res) => {
          res.data.courses.sort(
            (a, b) =>
              new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime()
          );
          return res;
        })
      );
  }

  rateCourse(slug: string, rate: number): Observable<CourseRatingResponse> {
    return this.http.post<CourseRatingResponse>(
      `${this.baseUrl}api/courses/rate/${slug}/`,
      { rate }
    );
  }

  downloadImage(url: string, filename: string) {
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
      })
      .catch(console.error);
  }
}

// ─── Course Service ──────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class CourseService {
  private http = inject(HttpClient);

  private mapToCourseCard(item: IBaseCourse): ICourseCardData {
    return {
      slug:            item.slug,
      title:           item.title,
      description:     item.description,
      image:           item.image,
      avg_rating:      item.avg_rating ?? 0,
      students_count:  item.students_count ?? item.courses_count ?? 0,
      instructor_name: item.instructor_name ?? 'Expert Instructor',
      price:           item.price ?? '0',
      is_enrolled:     item.is_enrolled ?? false,
    };
  }

  // ── Top Rated ──────────────────────────────────────────────────────────────
  getTopRatedCourses(limit: number): Observable<ICourseCardData[]> {
    return this.http
      .get<ITopRatedResponse>(API_ENDPOINTS.coursesTopRated(limit))
      .pipe(
        map((res) =>
          (Array.isArray(res.data) ? res.data : []).map((item) =>
            this.mapToCourseCard(item)
          )
        )
      );
  }

  // ── All Courses ────────────────────────────────────────────────────────────
  getAllCourses(): Observable<ICourseCardData[]> {
    return this.http
      .get<IAllCoursesResponse>(API_ENDPOINTS.allCourses)
      .pipe(
        map((res) =>
          (res.data?.courses || []).map((item) => this.mapToCourseCard(item))
        )
      );
  }

  // ── All Courses Paged ──────────────────────────────────────────────────────
  getAllCoursesPaged(
    page: number,
    pageSize: number
  ): Observable<{ courses: ICourseCardData[]; totalPages: number }> {
    return this.http
      .get<IAllCoursesResponse>(API_ENDPOINTS.allCoursesPaged(page, pageSize))
      .pipe(
        map((res) => ({
          courses:    (res.data?.courses || []).map((item) => this.mapToCourseCard(item)),
          totalPages: res.data?.total_pages || 1,
        }))
      );
  }

  // ── My Courses ─────────────────────────────────────────────────────────────
  getMyCourses(): Observable<ICourseCardData[]> {
    return this.http
      .get<IMyEnrollmentsResponse>(API_ENDPOINTS.myCourses)
      .pipe(
        map((res) =>
          (res.data?.courses || []).map((item) => this.mapToCourseCard(item))
        ),
        defaultIfEmpty([])
      );
  }

  // ── Enroll ─────────────────────────────────────────────────────────────────
  enrollInCourse(slug: string, courseId?: number): Observable<IEnrollResponse> {
    const payload = courseId != null ? { course: courseId } : {};
    return this.http.post<IEnrollResponse>(API_ENDPOINTS.enroll(slug), payload);
  }

  // ── Course Details ─────────────────────────────────────────────────────────
  getCourseDetails(slug: string): Observable<ICourseDetailRequest> {
    return this.http
      .get<ICourseDetailResponse>(API_ENDPOINTS.courseDetails(slug))
      .pipe(
        map((res) => ({
          ...res.data,
          avg_rating:       res.data.avg_rating ?? 0,
          instructor_bio:   res.data.instructor_bio ?? null,
          instructor_image: res.data.instructor_image ?? null,
          instructor_links: res.data.instructor_links || [],
        }))
      );
  }

  // ── Packages ───────────────────────────────────────────────────────────────
  getPackages(): Observable<IPackageCardData[]> {
    return this.http.get<IPackagesResponse>(API_ENDPOINTS.package).pipe(
      map((res) =>
        (res.data?.packages || []).map((pkg) => ({
          slug:            pkg.slug,
          title:           pkg.title,
          description:     pkg.description,
          image:           pkg.image ?? null,
          avg_rating:      pkg.avg_rating ?? 0,
          courses_count:   pkg.courses_count,
          instructor_name: pkg.instructor_name,
          price:           pkg.price,
          categories:      pkg.categories || [],
          is_enrolled:     pkg.is_enrolled ?? false,
        } as IPackageCardData))
      )
    );
  }

  // ── Packages Paged ─────────────────────────────────────────────────────────
  getPackagesPaged(
    page: number,
    pageSize: number
  ): Observable<{ packages: IPackageCardData[]; totalPages: number }> {
    return this.http
      .get<IPackagesResponse>(API_ENDPOINTS.packagePaged(page, pageSize))
      .pipe(
        map((res) => ({
          packages: (res.data?.packages || []).map((pkg) => ({
            slug:            pkg.slug,
            title:           pkg.title,
            description:     pkg.description,
            image:           pkg.image ?? null,
            avg_rating:      pkg.avg_rating ?? 0,
            courses_count:   pkg.courses_count,
            instructor_name: pkg.instructor_name,
            price:           pkg.price,
            categories:      pkg.categories || [],
            is_enrolled:     pkg.is_enrolled ?? false,
          } as IPackageCardData)),
          totalPages: res.data?.total_pages || 1,
        }))
      );
  }

  // ── Package Details ────────────────────────────────────────────────────────
  getPackageDetails(slug: string): Observable<IPackageDetails> {
    return this.http
      .get<IPackageDetailsResponse>(API_ENDPOINTS.packageDetails(slug))
      .pipe(
        map((res) => {
          const data = res.data;
          const courses = (data.courses || []).map((c) => ({
            title:           c.title,
            slug:            c.slug,
            image:           c.image ?? null,
            avg_rating:      c.avg_rating ?? 0,
            ratings_count:   c.ratings_count ?? 0,
            students_count:  c.students_count ?? 0,
            is_enrolled:     c.is_enrolled ?? false,
            instructor_name: c.instructor_name || 'Expert Instructor',
          }));
          
          return {
            title:           data.title,
            slug:            data.slug,
            description:     data.description,
            price:           data.price ?? 0,
            courses_count:   data.courses_count,
            is_enrolled:     data.is_enrolled,
            courses:         courses,
            instructor_name: data.instructor_name || courses[0]?.instructor_name || 'Expert Instructor',
            course_slugs:    data.courses?.map((c) => c.slug) || [],
            avg_rating:      data.avg_rating ??
              (data.courses?.length
                ? data.courses.reduce((sum, c) => sum + (c.avg_rating ?? 0), 0) / data.courses.length
                : 0),
            ratings_count:   data.ratings_count ?? 0,
          } as IPackageDetails;
        })
      );
  }
}
