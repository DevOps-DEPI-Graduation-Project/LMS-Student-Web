import { Injectable } from '@angular/core';
import { ICourseWorkspaceHeader, IMaterialsResponse, IQuestion, IQuestionsResponse, IQuizCourse, IQuizCourseResponse, IQuizResult, IQuizResultsResponse, ISubmitQuizRequest, ISubmitQuizResponse, IVideoCompleteResponse, VideosResponse } from '../models/courseWorkspace.model';
import { Observable } from 'rxjs';
import { CourseService } from './user';
import { User } from '../services/user';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ICourseDetailRequest } from '../models/course.model';
import { signal } from '@angular/core';
import { API_ENDPOINTS } from '../../core/api-endpoints';

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
  })
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

 completeVideo(videoSlug: string, watchedSeconds: number) {
  return this.http.post<IVideoCompleteResponse>(API_ENDPOINTS.videoComplete(videoSlug), {
    watched_seconds: watchedSeconds
  });
}

}
