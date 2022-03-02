import { Component, isDevMode, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'general-form-reply';

  public tmplNo = 20100;
  public replyInfo = {
    replyNo: 1,
    tmplNo: 20100,
    replyUser: 'A123456789',
    replyDesc: {
      fillInDate: '2021-11-01T12:00:00+08:00',
      ptName: '郭彥志',
      idNo: 'A123456789',
      sex: 'female',
      firstBlock: { Q1: '1', Q2: '3', Q3: '4', Q4: '4', Q5: '4', Q6: '4' },
    },
    replyTime: '2022-03-02T09:14:23.220',
    tranUser: 30666,
    tranTime: '2022-03-02T09:14:23.220',
    tranStatus: 30,
    tranUserName: '楊名棟',
  };
  constructor() {}

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

  public showMsg(event) {
    console.log(event);
  }
}
