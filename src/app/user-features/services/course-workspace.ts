import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../core/api-endpoints';
import { ICourseDetailRequest } from '../models/course.model';
import { ICourseWorkspaceHeader, IMaterialsResponse, IQuestionsResponse, IQuizCourseResponse, ISubmitQuizRequest, ISubmitQuizResponse, VideosResponse } from '../models/courseWorkspace.model';
import { CourseService } from './user';
import { User } from '../services/user';

@Injectable({
  providedIn: 'root',
})
export class CourseWorkspaceService {
  constructor(private userService: User, private courseService: CourseService, private http: HttpClient) { }

  selectedCourse = signal<ICourseDetailRequest | null>(null);

  setSelectedCourse(course: ICourseDetailRequest) {
    this.selectedCourse.set(course);
  }

  getCourseWorkspaceData(slug: string): Observable<ICourseWorkspaceHeader> {
    this.userService.getMyEnrollments();
    return combineLatest([
      this.courseService.getCourseDetails(slug),
      this.userService.courses$,
    ]).pipe(
      map(([courseDetail, enrolledCourses]) => {
        const enrolled = enrolledCourses.find(c => c.slug === slug);
        return {
          ...courseDetail,
          progress: enrolled?.progress ?? 0,
        } as ICourseWorkspaceHeader;
      })
    );
  }

  materials(courseSlug: string): Observable<IMaterialsResponse> {
    return this.http.get<IMaterialsResponse>(
      `${environment.baseUrl}api/courses/${courseSlug}/materials/`
    );
  }

  getQuizzes(courseSlug: string, page: number = 1, pageSize: number = 10): Observable<IQuizCourseResponse> {
    return this.http.get<IQuizCourseResponse>(API_ENDPOINTS.quiz(courseSlug), {
      params: {
        page: page.toString(),
        page_size: pageSize.toString()
      }
    });
  }

  getQuizQuestions(quizSlug: string, page: number = 1, pageSize: number = 10): Observable<IQuestionsResponse> {
    return this.http.get<IQuestionsResponse>(API_ENDPOINTS.quizQuestions(quizSlug), {
      params: {
        page: page.toString(),
        page_size: pageSize.toString()
      }
    });
  }

  submitQuiz(quizSlug: string, body: ISubmitQuizRequest) {
    return this.http.post<ISubmitQuizResponse>(
      API_ENDPOINTS.submitQuizAnswers(quizSlug),
      body
    );
  }

  getVideos(courseSlug: string): Observable<VideosResponse> {
    return this.http.get<VideosResponse>(
      `${environment.baseUrl}api/courses/${courseSlug}/videos/`
    );
  }

  markVideoComplete(videoSlug: string, currentTime: number): Observable<any> {
    return this.http.post(API_ENDPOINTS.videoComplete(videoSlug), {
      current_time: currentTime
    });
  }
}
