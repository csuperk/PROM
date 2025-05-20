import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CmuhHttpService } from '@cmuh/http';
import {
  FormReplyInfo,
  FormReplyReq,
  FormTmplInfo,
  FormTmplReq,
  PatientInfo,
  FormTeplyMapTempInfo,
} from '@cmuh-viewmodel/form2-kernel';
import { JwtHelper } from '@cmuh/jwt';
import '@cmuh/extensions';
import { UserInfoService, UserInfo } from '@cmuh/user-info';
import { eachComponent } from 'formiojs/utils/formUtils.js';

@Injectable({
  providedIn: 'root',
})
export class Form2ReplierService {
  public userInfoService: UserInfo = null;
  public tmplNo;
  public branchNo;
  private tokenService0 = null;
  // 預先取得使用者Token
  public get tokenService() {
    return this.tokenService0;
  }
  public set tokenService(token: string) {
    this.tokenService0 = token;
  }
  constructor(private http: CmuhHttpService, private jwtHelper: JwtHelper, private userInfoSvc: UserInfoService) {
    this.setUserInfoService();
    this.setTokenService();
  }

  private setUserInfoService() {

    const nullObject = JSON.stringify(this.userInfoSvc.userInfo) === JSON.stringify({});
    this.userInfoService = nullObject ? null : this.userInfoSvc.userInfo;
    if( this.userInfoService !== null ){ // 如果是民眾填答則userInfoSvc一定會是 null 或是 undefined 或是空物件
      this.userInfoService.branchNo = this.userInfoService.branchNo !== 24 ? this.userInfoService.branchNo : 1;
    }
  }

  private setTokenService() {
    this.tokenService = sessionStorage.getItem('token') || localStorage.getItem('token');
  }

  /**
   * 取得員工詳細資料，為了要有idNo
   * @param empNo
   * @returns
   */
  public getEmpInfo(empNo: number): Observable<FormTmplInfo> {
    // const url = `/webapi/formMaster/getEmpInfo`;
    const url = `/webapi/form2Kernel/form2Customized/getEmpNoAuth/`;
    return this.http.get<FormTmplInfo>(`${url}/${empNo}`);
  }

  /**
   * 透過身份證號(idNo)取得病人資訊(非陣列)
   * @param idNo
   * @returns
   */
  public getPatientByIdNo(idNo: string): Observable<PatientInfo> {
    const url = `/webapi/form2Kernel/form2Customized/getPatientByIdNo`;
    const params = { idNo: idNo };
    return this.http.put<PatientInfo>(`${url}`, params);
  }

  /**
   * 取得表單資訊
   * @param tmplNo
   * @returns
   */
  public getFormTmplInfo(tmplNo: number): Observable<FormTmplInfo[]> {
    const url = `/webapi/form2Kernel/Form2Tmpl/getSpecFormTmpl2`;
    let branchNo = this.userInfoService === null
      ? this.branchNo
      : this.userInfoService.branchNo;

    let params: FormTmplReq = {
      branchNo: branchNo,
      tmplNo: tmplNo,
      tranStatus1: 0,
      tranStatus2: 80,
    };
    return this.http.put<FormTmplInfo[]>(`${url}`, params);
  }

  /**
   * 取得回覆資訊
   * @param tmplNo
   * @returns
   */
  public getFormReplyInfo(replyNo: number): Observable<FormReplyInfo[]> {
    const url = `/webapi/form2Kernel/form2Reply/getForm2ReplyTmpl`;
    let branchNo =
      this.userInfoService === null
        ? this.branchNo
        : this.userInfoService.branchNo;

    let params: FormReplyReq = {
      branchNo: branchNo,
      replyNo: replyNo,
    };

    return this.http.put<FormReplyInfo[]>(`${url}`, params);
  }

  /**
   * 儲存表單
   * @param params
   * @returns
   */
  public setFormReply(params: FormReplyInfo): Observable<number> {
    let branchNo =
      this.userInfoService === null
        ? this.branchNo
        : this.userInfoService.branchNo;
    params.branchNo = branchNo;
    const url = `/webapi/form2Kernel/form2Reply/setFormReply2`;
    return this.http.put<number>(`${url}`, params);
  }

  public addFormReply2Info(params: FormReplyInfo): Observable<number> {
    let branchNo =
      this.userInfoService === null
        ? this.branchNo
        : this.userInfoService.branchNo;
    params.branchNo = branchNo;
    const url = `/webapi/form2Kernel/form2Reply/addFormReply2Info`;
    return this.http.put<number>(`${url}`, params);
  }

  public setCaseEventReplyByTran(params: FormReplyInfo): Observable<boolean> {
    let branchNo =
      this.userInfoService === null
        ? this.branchNo
        : this.userInfoService.branchNo;
    params.branchNo = branchNo;
    const url = `/webapi/caseProjectKernel/caseProjectInfo/setCaseEventReplyByTran`;
    return this.http.put<boolean>(`${url}`, params);
  }

  public addCaseEventReplyByTran(params: FormReplyInfo[]): Observable<number> {
    let branchNo =
      this.userInfoService === null
        ? this.branchNo
        : this.userInfoService.branchNo;
    params[0].branchNo = branchNo;
    const url = `/webapi/caseProjectKernel/caseProjectInfo/addCaseEventReplyByTran`;
    return this.http.put(`${url}`, params);
  }

  /**
   * 回存mapping檔
   * @param params
   * @returns
   */
  public setFormReplyMap(params: FormTeplyMapTempInfo): Observable<number> {
    const url = `/webapi/form2Kernel/form2Reply/setFormReplyMap`;
    return this.http.put(`${url}`, params);
  }

  //**************內部函式*********************************** */
  /**
   * 判斷必填是否未填
   * @param formTemplate
   * @param formReply
   * @returns
   */
  public checkIsValid(
    formTemplate: any,
    formReply: any
  ): { result: boolean; message: string } {
    let result = { result: true, message: '' };
    let needValidateArray = [];

    eachComponent(formTemplate['components'], (x: any) => {
      if (x.validate && x.validate.required === true) {
        needValidateArray.push([x.key, x.label, x.type]);
      }
    });

    needValidateArray.forEach((x) => {
      // 預先判斷是否有這個key
      if (formReply.hasOwnProperty(x[0])) {
        if (formReply[x[0]].length <= 0) {
          result.message += `${x[1]}，`;
        }

        // 預設判斷不通過
        let checkOtherComponentResult = false;
        // 需額外處理的必填判斷
        switch (x[2]) {
          case 'selectboxes':
            checkOtherComponentResult = this.doCheckSelectBoxes(
              formReply[x[0]]
            );

            break;

          default:
            checkOtherComponentResult = true;
            break;
        }
        if (checkOtherComponentResult === false) {
          result.message += `${x[1]}，`;
        }
      }
    });
    if (result.message.length > 0) {
      result.result = false;
      result.message = result.message.slice(0, -1);
      result.message += ` 的必填欄位未填`;
    }

    return result;
  }

  /**
   * 判斷select boxes必填
   * @param selectBoxesReply
   * @returns
   */
  private doCheckSelectBoxes(selectBoxesReply): boolean {
    let result = false;
    const selectObjectKeys = Object.keys(selectBoxesReply);
    selectObjectKeys.forEach((x) => {
      if (selectBoxesReply[x] === true) {
        result = true;
      }
    });

    return result;
  }
  //****************************************************** */
}
