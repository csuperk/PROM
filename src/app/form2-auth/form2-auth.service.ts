import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { CmuhHttpService } from '@cmuh/http';
import {
  FormWhitelistAuthReq,
  FormTmplInfo,
  FormReplyReq,
  FormReplyInfo,
} from '@cmuh-viewmodel/form2-kernel';
import { AuthlistSubjectInfo } from '@cmuh-viewmodel/whitelist-module';

import '@cmuh/extensions';

@Injectable({
  providedIn: 'root',
})
export class Form2AuthService {
  /**
   * 檢查白名單包括
   * 讀取
   * 填寫
   * 刪除
   * 列印
   * @param params
   * @param checkType
   * @returns
   */
  public async checkWhitelistAuth(
    tmplInfo: FormTmplInfo,
    params: FormWhitelistAuthReq,
    checkType: 'r' | 'w' | 'd' | 'p' | 'cowork'
  ): Promise<boolean> {
    // 測試表單，不用驗證白名單
    if (this.verifyTest(tmplInfo.tmplNo)) {
      return true;
    }

    /**
     * 讀取 1 Math.floor((authValue % 10) / 1) === 1
     * 填寫 10 Math.floor((authValue % 100) / 10) === 1
     * 刪除 100 Math.floor((authValue % 1000) / 100) === 1
     * 列印 1000 Math.floor((authValue % 10000) / 1000) === 1
     */
    let auth: any = await this.getUserWhitelistAuth(params).toPromise();

    if (auth.msg == false) {
      /**
       * 權限錯誤
       * 無此個案類別收案權限，請聯繫該個案類別管理者申請權限
       * <該個案類別管理者${this.selectedCaseType.mgtEmpCode} ${this.selectedCaseType.mgtEmpName}>
       */
      return false;
    } else {
      let authValue = auth.accessType;
      switch (checkType) {
        case 'r':
          return Math.floor((authValue % 10) / 1) === 1;

        case 'w':
          return Math.floor((authValue % 100) / 10) === 1;

        case 'd':
          return Math.floor((authValue % 1000) / 100) === 1;

        case 'p':
          return Math.floor((authValue % 10000) / 1000) === 1;

        case 'cowork':
          // 此處api沒有統一, 但是如果是沒權限 會直接回傳 msg: false 就會在前面被擋掉 先偷吃步這樣寫
          return true;
        default:
          return false;
      }
    }
  }

  /**
   * 確認
   * @param tmplInfo
   * @param subjectType
   * @param subject
   * @returns
   */
  public async checkLimitOnceReply(
    tmplInfo: FormTmplInfo,
    subjectType: number,
    subject: string
  ): Promise<boolean> {
    /**
     * 1. 確認replyRule是 10, 11 不是就回傳true
     * 2. subject 找 是否replye過
     */
    if (tmplInfo.replyRule == 10 || tmplInfo.replyRule == 11) {
      /*
      branchNo, 固定?
      tmplNo, 代入
      tranStatus1, 固定?
      tranStatus2, 固定?
      subjectType, 固定?
      subject, 代入
      startTime 預設是 2018-12-31,
      endTime 預設是 2999-12-31,
      */
      let params: FormReplyReq = {
        branchNo: tmplInfo.branchNo,
        tmplNo: tmplInfo.tmplNo,
        tranStatus1: 10,
        tranStatus2: 60,
        subjectType: subjectType,
        subject: subject,
      };
      let replyList = await this.getForm2PeriodReplyList(params).toPromise();
      // < 0 代表沒有填寫紀錄
      return replyList.length == 0;
    } else {
      return true;
    }
  }

  constructor(private http: CmuhHttpService) { }

  /**
   * 驗證是否為測試表單，是(return true)則直接放行填寫
   * @param tmplNo
   * @returns
   */
  private verifyTest(tmplNo: number): boolean {
    return tmplNo < 0 ? true : false;
  }

  public getUserWhitelistAuth(
    params: FormWhitelistAuthReq
  ): Observable<AuthlistSubjectInfo> {
    const url = `/webapi/form2Kernel/form2Auth/getUserWhitelistAuth`;
    return this.http.put<AuthlistSubjectInfo>(`${url}`, params);
  }

  private getForm2PeriodReplyList(
    params: FormReplyReq
  ): Observable<FormReplyInfo[]> {
    const url = `/webapi/form2Kernel/form2Reply/getForm2PeriodReplyList`;
    return this.http.put<FormReplyInfo[]>(`${url}`, params);
  }
}
