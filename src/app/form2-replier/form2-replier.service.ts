import { Injectable, isDevMode } from '@angular/core';
import { Observable } from 'rxjs';

import { CmuhHttpService } from '@cmuh/http';
import { FormReplyInfo, FormReplyReq, FormTmplInfo, FormTmplReq } from '@cmuh-viewmodel/form2-kernel';
import { JwtHelper } from '@cmuh/jwt';
import '@cmuh/extensions';

@Injectable({
  providedIn: 'root',
})
export class Form2ReplierService {

  public userInfoService;
  public tmplNo;
  constructor(private http: CmuhHttpService, private jwtHelper: JwtHelper) {
    // this.userInfoService = this.jwtHelper.decodeAuthorized(
    //   localStorage.getItem('userInfo')
    // );
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJiaXJ0aGRheSI6IjE5NzYtMDEtMDFUMDA6MDA6MDArMDg6MDAiLCJlTWFpbCI6IjEyMzQ1NkBnbWFpbC5jb20iLCJpZE5vIjoiQTIyMzQ1Njc4OSIsIm9yZ05vIjoiMTMxNzA1MDAxNyIsInJlc3BvbnNpYmlsaXR5IjoiMUE4MCIsInNleCI6IjIiLCJ1c2VySWQiOiJBMzA2NjYiLCJ1c2VySW1hZ2UiOm51bGwsInVzZXJOYW1lIjoi5ris6Kmm5biz6JmfIiwidXNlck5vIjozMDY2Nn0._v8-C-E0XY-c48bdtW44WY2j8ba5W_q0LM55v1fkh-Q';
    this.userInfoService = this.jwtHelper.decodeAuthorized(token);
  }

  /**
   * 取得員工詳細資料，為了要有idNo
   * @param empNo
   * @returns
   */
  public getEmpInfo(empNo: number): Observable<FormTmplInfo> {
    // const url = `/webapi/formMaster/getEmpInfo`;
    const url = `/webapi/form2Kernel/form2Auth/getEmpNoAuth`;
    return this.http.get<FormTmplInfo>(`${url}/${empNo}`);
  }
  /**
   * 取得表單資訊
   * @param tmplNo
   * @returns
   */
  public getFormTmplInfo(tmplNo: number): Observable<FormTmplInfo> {
    // const url = `/webapi/formMaster/getFormTmplInfo`;
    const url = `/webapi/form2Kernel/Form2Tmpl/getSpecFormTmpl2`;
    let params: FormTmplReq = { branchNo: 1, tmplNo: tmplNo, tranStatus1: 0, tranStatus2: 80 };
    return this.http.put<FormTmplInfo>(`${url}`, params);
  }

  /**
   * 取得回覆資訊
   * @param tmplNo
   * @returns
   */
  public getFormReplyInfo(replyNo: number): Observable<FormReplyInfo> {
    // const url = `/webapi/formMaster/getFormReplyInfo`;
    const url = `/webapi/form2Kernel/form2Reply/getForm2ReplyTmpl`;
    let params: FormReplyReq = { branchNo: 1, replyNo: replyNo };
    return this.http.put<FormReplyInfo>(`${url}`, params);
  }

  /**
   * 儲存表單
   * @param params
   * @returns
   */
  public setFormReply(params: FormReplyInfo): Observable<number> {
    // const url = `/webapi/formMaster/setFormReply`;
    const url = `/webapi/form2Kernel/form2Reply/setFormReply2`;
    return this.http.put<number>(`${url}`, params);
  }

}
