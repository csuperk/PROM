import { Injectable, isDevMode } from '@angular/core';
import { CmuhHttpService } from '@cmuh/http';
import { Observable } from 'rxjs';
import {
  FormReplyInfo,
  FormReplyListTimeReq,
  FormReplyListReq,
  FormReplyList,
  TmplInfo,
} from '@cmuh-viewmodel/form-master';
import { JwtHelper } from '@cmuh/jwt';
import '@cmuh/extensions';

@Injectable({
  providedIn: 'root',
})
export class Form2ReplierService {

  public searchReq = {
    type: "all",
    values: {
      date1: new Date().addMonths(-4),
      date2: new Date(),
      idNo: "",
      chartNo: "",
      status: 0
    },
    options: [
      { chtName: '全部患者', label: 'all' },
      { chtName: '病歷號', label: 'chartNo' },
      { chtName: '身分證號', label: 'idNo' }
    ]
  };

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
  public getEmpInfo(empNo: number): Observable<TmplInfo> {
    const url = `/webapi/formMaster/getEmpInfo`;
    return this.http.get<TmplInfo>(`${url}/${empNo}`);
  }
  /**
   * 取得表單資訊
   * @param tmplNo
   * @returns
   */
  public getFormTmplInfo(tmplNo: number): Observable<TmplInfo> {
    const url = `/webapi/formMaster/getFormTmplInfo`;
    return this.http.get<TmplInfo>(`${url}/${tmplNo}`);
  }

  /**
   * 取得回覆資訊
   * @param tmplNo
   * @returns
   */
  public getFormReplyInfo(replyNo: number): Observable<FormReplyInfo> {
    const url = `/webapi/formMaster/getFormReplyInfo`;
    return this.http.get<FormReplyInfo>(`${url}/${replyNo}`);
  }

  /**
   * 儲存表單
   * @param params
   * @returns
   */
  public setFormReply(params: FormReplyInfo): Observable<number> {
    const url = `/webapi/formMaster/setFormReply`;
    return this.http.put<number>(`${url}`, params);
  }

}
