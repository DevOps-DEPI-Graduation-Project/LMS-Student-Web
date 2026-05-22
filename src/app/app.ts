import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./components/shared/navbar/navbar";
import { ThemeService } from './core/theme';
import { AuthService } from './auth/services/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  constructor(private theme: ThemeService, private auth: AuthService) { }

  ngOnInit(): void {
    this.theme.initTheme();
  }
}
