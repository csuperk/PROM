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

  public newReplyInfo = {
    tmplNo: 20100,
    replyNo: 2,
    subjectType: 10,
    subject: 'A123456789',
  }

  public editReplyInfo = {
    branchNo: 1,
    replyNo: 1112652080,
    tmplNo: 20100,
    subjectType: 10,
    subject: 'A123456789',
    tranUser: 33878,
    tranTime: new Date('2022-04-12T09:56:14.257'),
    tranStatus: 20,
    systemUser: 33878,
    systemTime: new Date('2022-04-12T09:56:14.367'),
    subjectName: '郭彥志'
  }

  constructor() { }

  ngOnInit() {
    if (isDevMode()) {
      localStorage.setItem(
        'token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJBMzQ5NDQiLCJpYXQiOjE2NTA0NDAzMDgsImV4cCI6MTY1MDQ0MTUwOH0.rEamS9TY1KS00XZvY3ouT8_XpQEXqPk5JS7xSsfyAmI'
      );
      console.log('local先帶入預設登入人員資訊...');
      // const userInfo = localStorage.getItem('userInfo') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTm8iOjMzNTczLCJ1c2VySWQiOiJBMzM1NzMiLCJ1c2VyTmFtZSI6IuacseS4luixqiIsImJpcnRoZGF5IjoiMTk5My0wOS0yNiIsInNleCI6IjEiLCJlTWFpbCI6ImpvaG5jeTgyOTI2QGdtYWlsLmNvbSIsIm9yZ05vIjoiMTMxNzA1MDAxNyIsImlhdCI6MTU2MjU2ODg2MCwiZXhwIjoxNTYyNTcwMDYwfQ.EjnTxY-6zqUvvK0TAbDhu4_x9jCTkw1UG2znxZixBqM';
      const userInfo =
        localStorage.getItem('userInfo') ||
        '';
      localStorage.setItem('userInfo', userInfo);
    }
  }

  public showMsg(event) {
    console.log(event);
  }
}
