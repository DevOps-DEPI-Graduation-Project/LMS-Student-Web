import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseCard } from './shared/components/course-card/course-card';
import { RouterLink } from '@angular/router';
import { TabMaterials } from './pages/course-workspace/components/tab-materials/tab-materials';
import { TabVideos } from './pages/course-workspace/components/tab-videos/tab-videos';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    CourseCard,
    RouterLink,
    TabMaterials,
    TabVideos
  ],
  exports: [
    CourseCard,
    TabMaterials,
    TabVideos,
  ]
})
export class UserFeaturesModule {


}
