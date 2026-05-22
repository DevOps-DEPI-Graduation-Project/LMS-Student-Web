import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, defaultIfEmpty, map } from 'rxjs';
import { API_ENDPOINTS } from '../../core/api-endpoints';
import {
  IBaseCourse,
  ICourseCardData,
  ICourseDetailRequest,
  ICourseDetailResponse,
  IPackageCardData,
  IPackagesResponse,
  IEnrollResponse,
  IMyEnrollmentsResponse,
  IPackageDetails,
  IPackageDetailsResponse,
} from '../../user-features/models/course.model';

@Injectable({ providedIn: 'root' })
export class CourseService {
  getMyEnrollments() {
    throw new Error('Method not implemented.');
  }
  private http = inject(HttpClient);


  private mapToCourseCard(
    item: IBaseCourse,
    type: 'COURSE' | 'PACKAGE'
  ): ICourseCardData {
    return {
      slug:            item.slug,
    title:           item.title,
    description:     item.description,
    image:           item.image || 'images/1_a2tAChY8UgAZvBYh5Kqwkw.jpg',
    avg_rating:      item.avg_rating ?? 0,
    students_count:  item.students_count || item.courses_count || 0,
    instructor_name: item.instructor_name || 'Expert Instructor',
    price:           item.price || '0',
    is_enrolled:     item.is_enrolled ?? false,

    };
  }

  // ───── Top Rated Courses ─────
  getTopRatedCourses(limit: number): Observable<ICourseCardData[]>{
    return this.http.get<any>(API_ENDPOINTS.coursesTopRated(limit)).pipe(
      map(res=>{
        const items=Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
        return items.map((item: any) => this.mapToCourseCard(item, 'COURSE'));
      })
    )
  }
  // ───── My Courses ─────
  getMyCourses(): Observable<ICourseCardData[]> {
    return this.http.get<IMyEnrollmentsResponse>(API_ENDPOINTS.myCourses).pipe(
      map(res => {
        const enrollments = res.data?.courses || [];
        return enrollments.map((item: any) => {
          const courseInfo = item.course ? item.course : item;
          return this.mapToCourseCard(courseInfo, 'COURSE');
        });
      }),
      defaultIfEmpty([])
    );
  }

  // ───── Enroll in Course (POST) ─────
  enrollInCourse(slug: string, courseId?: number): Observable<IEnrollResponse> {
    const url = API_ENDPOINTS.enroll(slug);
    const payload = courseId != null ? { course: courseId } : {};
    return this.http.post<IEnrollResponse>(url, payload);
  }

  // ───── All Courses ─────
  getAllCourses(): Observable<ICourseCardData[]> {
    return this.http.get<any>(API_ENDPOINTS.allCourses).pipe(
      map(res => {
        const items =
          // old DRF-style pagination: results
          Array.isArray(res?.results) ? res.results :
            // nested `data.results` style
            Array.isArray(res?.data?.results) ? res.data.results :
              // data array directly
              Array.isArray(res?.data) ? res.data :
                // `data.courses` field (as used by myEnrollments in this app)
                Array.isArray(res?.data?.courses) ? res.data.courses :
                  // fallback same root as list
                  Array.isArray(res?.courses) ? res.courses :
                    [];

        return items.map((item: any) => this.mapToCourseCard(item, 'COURSE'));
      })
    );
  }
  // ───── All Courses with Pagination ─────
getAllCoursesPaged(page: number, pageSize: number): Observable<{ courses: ICourseCardData[], totalPages: number }> {
  return this.http.get<any>(API_ENDPOINTS.allCoursesPaged(page, pageSize)).pipe(
    map(res => {
      const items: IBaseCourse[] = res?.data?.courses || [];
      return {
        courses:    items.map(item => this.mapToCourseCard(item, 'COURSE')),
        totalPages: res?.data?.total_pages || 1,
      };
    })
  );
}

  // ───── Course Details ─────
 getCourseDetails(slug: string): Observable<ICourseDetailRequest> {
  return this.http.get<ICourseDetailResponse>(API_ENDPOINTS.courseDetails(slug)).pipe(
    map(res => {
      const item = res.data;
      return {
        ...item,
        avg_rating:       item.avg_rating ?? 0,
        instructor_bio:   item.instructor_bio   || 'Expert instructor...',
        instructor_image: item.instructor_image ,
        instructor_links: item.instructor_links || [],
      } as ICourseDetailRequest;
    })
  );
}
  // ───── Packages ─────
  getPackages(): Observable<ICourseCardData[]> {
    return this.http.get<IPackagesResponse>(API_ENDPOINTS.package).pipe(
      map(res => {
        const packagesArray = res.data?.packages || [];
        return packagesArray.map(pkg => ({
          slug: pkg.slug,
          title: pkg.title,
          description: pkg.description,
          image: pkg.image || null,
          avg_rating: pkg.avg_rating || 0,
          students_count: pkg.courses_count,
          instructor_name: pkg.instructor_name,
          price: pkg.price,

        } as ICourseCardData));
      })
    );
  }
 getPackageDetails(slug: string, packageInstructorName?: string): Observable<IPackageDetails> {
  return this.http
    .get<IPackageDetailsResponse>(API_ENDPOINTS.packageDetails(slug))
    .pipe(
      map(res => {
        const data = res.data;
        const courses = Array.isArray(data.courses)
          ? data.courses.map(course => ({
              title: course.title,
              slug: course.slug,
              image: course.image || null,
              avg_rating: course.avg_rating ?? 0,
              ratings_count: course.ratings_count ?? 0,
              students_count: course.students_count ?? 0,
              is_enrolled: course.is_enrolled ?? null,
              instructor_name: course.instructor_name || 'Expert Instructor',
            }))
          : [];

        return {
          title: data.title,
          slug: data.slug,
          description: data.description,
          price: data.price ?? '0',
          avg_rating: data.avg_rating ?? 0,
          ratings_count: data.ratings_count ?? 0,
          students_count: data.students_count ?? 0,
          courses_count: data.courses_count ?? 0,
          is_enrolled: data.is_enrolled ?? null,
          instructor_name: packageInstructorName || data.instructor_name || courses[0]?.instructor_name || 'Expert Instructor',
          courses,
          course_slugs: courses.map(c => c.slug),
          categories: data.categories || [],
          created_at: data.created_at,
        } as IPackageDetails;
      })
    );
}
// ───── Packages with Pagination ─────
getPackagesPaged(page: number, pageSize: number): Observable<{ packages: IPackageCardData[], totalPages: number }> {
  return this.http.get<IPackagesResponse>(API_ENDPOINTS.packagePaged(page, pageSize)).pipe(
    map(res => ({
      packages:   (res.data?.packages || []).map(pkg => ({
        slug:            pkg.slug,
        title:           pkg.title,
        description:     pkg.description,
        image:           pkg.image || null,
        avg_rating:      pkg.avg_rating || 0,
        courses_count:   pkg.courses_count,
        instructor_name: pkg.instructor_name,
        price:           pkg.price,
        categories:      pkg.categories || [],
        course_slugs:    pkg.course_slugs || [],
      } as IPackageCardData)),
      totalPages: res.data?.total_pages || 1,
    }))
  );
}

}
