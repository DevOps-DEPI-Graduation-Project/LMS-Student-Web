import { Component } from '@angular/core';

@Component({
  selector: 'app-why-us', standalone: true,
  imports: [],
  templateUrl: './why-us.html',
  styleUrl: './why-us.css',
})
export class WhyUs {
  features = [
    {
      title: 'Real Courses & Packages',
      desc: 'Browse and enroll in actual courses with detailed information. Track progress with your personal dashboard. Learn at your own pace.',
      icon: 'quiz'
    },
    {
      title: 'Student Dashboard',
      desc: 'Monitor your learning progress, manage your profile, and access all your enrolled courses in one place. Everything you need is organized for you.',
      icon: 'discussion'
    },
    {
      title: 'Secure & Personalized',
      desc: 'Control your account security, customize your preferences, and maintain your learning profile. Your data is safe and always under your control.',
      icon: 'path'
    }
  ];
}
