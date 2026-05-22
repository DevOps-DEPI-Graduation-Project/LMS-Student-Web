import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-workspace-tabs',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './workspace-tabs.html',
  styleUrl: './workspace-tabs.css',
})
export class WorkspaceTabs {
  @Input() courseSlug!: string;

}
