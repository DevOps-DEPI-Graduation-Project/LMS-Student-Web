import { TestBed } from '@angular/core/testing';

import { CourseWorkspaceService } from './course-workspace';

describe('CourseWorkspace', () => {
  let service: CourseWorkspaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CourseWorkspaceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
