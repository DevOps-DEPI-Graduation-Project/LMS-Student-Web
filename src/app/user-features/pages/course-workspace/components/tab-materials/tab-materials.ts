import { Component, DestroyRef, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../../../environments/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CourseWorkspaceService } from '../../../../services/course-workspace';
import { IMaterial } from '../../../../models/courseWorkspace.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-tab-materials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-materials.html',
  styleUrl: './tab-materials.css',
})
export class TabMaterials implements OnInit, OnDestroy {
  private courseWorkspaceService = inject(CourseWorkspaceService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  materials: IMaterial[] = [];
  isLoading = true;
  baseUrl = environment.baseUrl;

  viewerOpen = false;
  selectedMaterial: IMaterial | null = null;
  safeFileUrl: SafeResourceUrl | null = null;

  ngOnInit() {
    const slug = this.route.parent?.snapshot.paramMap.get('slug') ?? '';

    this.courseWorkspaceService.materials(slug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.materials = res.data.materials ?? [];
          this.isLoading = false;
        },
        error: () => this.isLoading = false,
      });
  }

  openViewer(material: IMaterial) {
    this.selectedMaterial = material;
    const url = `${material.file}#toolbar=0&navpanes=0&scrollbar=1`;
    this.safeFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.viewerOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeViewer() {
    this.viewerOpen = false;
    this.selectedMaterial = null;
    this.safeFileUrl = null;
    document.body.style.overflow = '';
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }
}
