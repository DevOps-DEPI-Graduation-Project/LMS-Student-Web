import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../../components/shared/footer/footer';
import { NavbarComponent } from '../../components/shared/navbar/navbar';

@Component({
  standalone: true,
  imports: [RouterOutlet, FooterComponent, NavbarComponent],
  templateUrl: './private-layout.html',
})
export class PrivateLayoutComponent {}