import { Injectable, isDevMode } from '@angular/core';
import { CmuhHttpService } from '@cmuh/http';
import { Observable } from 'rxjs';
import {
  FormReplyInfo,
  FormReplyListReq,
  FormReplyList,
  TmplInfo,
} from '@cmuh-viewmodel/form-master';
import { JwtHelper } from '@cmuh/jwt';

@Injectable({
  providedIn: 'root',
})
export class GeneralFormReplyService {
  public userInfoService;
  public tmplNo;
  constructor(private http: CmuhHttpService, private jwtHelper: JwtHelper) {
    this.userInfoService = this.jwtHelper.decodeAuthorized(
      localStorage.getItem('userInfo')
    );
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
   * 儲存表單
   * @param params
   * @returns
   */
  public setFormReply(params: FormReplyInfo): Observable<number> {
    const url = `/webapi/formMaster/setFormReply`;
    return this.http.put<number>(`${url}`, params);
  }
  /**
   * 取得回覆清單
   * @param params
   * @returns
   */
  public getFormReplyList(
    params: FormReplyListReq
  ): Observable<FormReplyList[]> {
    const url = `/webapi/formMaster/getFormReplyList`;
    return this.http.put<FormReplyList[]>(`${url}`, params);
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
}
