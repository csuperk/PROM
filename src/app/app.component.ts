import { Component, isDevMode, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'general-form-reply';

  public tmplNo = 10100;
  constructor(){
  }

  ngOnInit() {
    if (isDevMode()) {
      localStorage.setItem(
        'token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJBMzM1NzMiLCJpYXQiOjE2MDk3NDM0ODksImV4cCI6MTYwOTc0NDY4OX0._r14v5zVcpdKmb65nTWTD3HQuOEyYqWcBElaINDTMAI'
      );
      console.log('local先帶入預設登入人員資訊...');
      // const userInfo = localStorage.getItem('userInfo') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTm8iOjMzNTczLCJ1c2VySWQiOiJBMzM1NzMiLCJ1c2VyTmFtZSI6IuacseS4luixqiIsImJpcnRoZGF5IjoiMTk5My0wOS0yNiIsInNleCI6IjEiLCJlTWFpbCI6ImpvaG5jeTgyOTI2QGdtYWlsLmNvbSIsIm9yZ05vIjoiMTMxNzA1MDAxNyIsImlhdCI6MTU2MjU2ODg2MCwiZXhwIjoxNTYyNTcwMDYwfQ.EjnTxY-6zqUvvK0TAbDhu4_x9jCTkw1UG2znxZixBqM';
      const userInfo =
        localStorage.getItem('userInfo') ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTm8iOjMzNTczLCJ1c2VySWQiOiJBMzM1NzMiLCJ1c2VyTmFtZSI6IuacseS4luixqiIsImJpcnRoZGF5IjoiMTk5My0wOS0yNiIsInNleCI6IjEiLCJlTWFpbCI6ImpvaG5jeTgyOTI2QGdtYWlsLmNvbSIsIm9yZ05vIjoiMTMxNzA1MDAxNyIsInJlc3BvbnNpYmlsaXR5IjoiMUE4RiIsImlhdCI6MTYwOTc0MzQ4OSwiZXhwIjoxNjA5NzQ0Njg5fQ.77hOxeLS9u5RwoYSKhb6LGbczgD25-rahRJH_Yklydg';
      localStorage.setItem('userInfo', userInfo);
    }
  }
}
