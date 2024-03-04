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
    tmplNo: -2126664499,

    subjectType: 10,
    subject: 'A123456789',
  };

  public editReplyInfo = {
    branchNo: 1,
    replyNo: -90225782,
    tmplNo: -1621400951,
    subjectType: 10,
    subject: 'B222378038',
    tranUser: 34944,
    owner: 34944,
    tranTime: new Date('2022-08-26 07:47:50.237'),
    tranStatus: 20,
    systemUser: 33878,
    systemTime: new Date('2022-08-26 07:47:50.630'),
    subjectName: '卓曉霜',
  };

  constructor() {}

  ngOnInit() {
    if (isDevMode()) {
      localStorage.setItem(
        'token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJBMzQ5NDQiLCJpYXQiOjE2NTA0NDAzMDgsImV4cCI6MTY1MDQ0MTUwOH0.rEamS9TY1KS00XZvY3ouT8_XpQEXqPk5JS7xSsfyAmI'
      );
      console.log('local先帶入預設登入人員資訊...');
      // const userInfo = localStorage.getItem('userInfo') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTm8iOjMzNTczLCJ1c2VySWQiOiJBMzM1NzMiLCJ1c2VyTmFtZSI6IuacseS4luixqiIsImJpcnRoZGF5IjoiMTk5My0wOS0yNiIsInNleCI6IjEiLCJlTWFpbCI6ImpvaG5jeTgyOTI2QGdtYWlsLmNvbSIsIm9yZ05vIjoiMTMxNzA1MDAxNyIsImlhdCI6MTU2MjU2ODg2MCwiZXhwIjoxNTYyNTcwMDYwfQ.EjnTxY-6zqUvvK0TAbDhu4_x9jCTkw1UG2znxZixBqM';
       // 34944 讀取/填寫/刪除/列印/管理
       const userInfo =
       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTm8iOjM0OTQ0LCJ1c2VySWQiOiJBMzQ5NDQiLCJ1c2VyTmFtZSI6IuWNk-abiemcnCIsImJpcnRoZGF5IjoiMTk4Ny0wMi0xOSIsInNleCI6IjIiLCJlTWFpbCI6ImZyb3N0ZGF3bjE5QGdtYWlsLmNvbSIsIm9yZ05vIjoiMTMxNzA1MDAxNyIsImJyYW5jaE5vIjoxLCJyZXNwb25zaWJpbGl0eSI6IjFBOEQiLCJpYXQiOjE2NTQ0ODM0ODAsImV4cCI6MTY1NDQ4NDY4MH0.QbYX9WrGJXurriyDZzJPrr65_8EiHcH59GUlWhJmcRU';
     // 30165
     // const userInfo =
     //   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTm8iOjMwMTY1LCJ1c2VySWQiOiJOMzAxNjUiLCJ1c2VyTmFtZSI6IuipueS9qeWNvyIsImJpcnRoZGF5IjoiMTk4OC0xMC0yMyIsInNleCI6IjIiLCJlTWFpbCI6InBlaS1kaW5nMTAyM0Bob3RtYWlsLmNvbSIsIm9yZ05vIjoiMTMxNzA1MDAxNyIsImJyYW5jaE5vIjoxLCJyZXNwb25zaWJpbGl0eSI6IjEwTUwiLCJpYXQiOjE2Njg2NDcyODAsImV4cCI6MTY2ODczMzY4MH0.yZ21HkA1ElQWC6Nrx7-tzl8QUrrTllvUHjb5ovSol5Q';
     // N11268
     // const userInfo =
     //   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTm8iOjExMjY4LCJ1c2VySWQiOiJOMTEyNjgiLCJ1c2VyTmFtZSI6Iuael-aBqeWmgiIsImJpcnRoZGF5IjoiMTk3OC0wNi0xMCIsInNleCI6IjIiLCJlTWFpbCI6Ik4xMTI2OEBtYWlsLmNtdWgub3JnLnR3Iiwib3JnTm8iOiIxMzE3MDUwMDE3IiwiYnJhbmNoTm8iOjEsInJlc3BvbnNpYmlsaXR5IjoiMVcwMCIsImVtcFR5cGUiOiIgIiwiaWF0IjoxNjgyNDg3MDQzLCJleHAiOjE2ODI1NzM0NDN9.CcisA2kkeNDwK-vytnmP6t0E5pzdca4Ynfm3PGzObeg';
     // A33895
     // const userInfo =
     // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTm8iOjMzODk1LCJ1c2VySWQiOiJBMzM4OTUiLCJ1c2VyTmFtZSI6Ium7g-a1qei7kiIsImJpcnRoZGF5IjoiMTk5NC0wNS0yNiIsInNleCI6IjEiLCJlTWFpbCI6ImdvZDUwNjQxQGdtYWlsLmNvbSIsIm9yZ05vIjoiMTMxNzA1MDAxNyIsImJyYW5jaE5vIjoxLCJyZXNwb25zaWJpbGl0eSI6IjFBOEQiLCJlbXBUeXBlIjoiQSIsImlhdCI6MTY5NTg5MDc4NiwiZXhwIjoxNjk1OTc3MTg2fQ.MPrYFbhqsNcy9Qymw9zk5gDN2MGIRVmZ1rApGYraXfw'
      localStorage.setItem('userInfo', userInfo);
    }
  }

  public showMsg(event) {
    console.log(event);
  }
}
