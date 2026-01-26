import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { FormReplyInfo, FormTmplInfo } from './view-model/index';
import { eachComponent } from 'formiojs/utils/formUtils.js';

@Injectable({
  providedIn: 'root',
})
export class Form2ReplierService {

  constructor(private http: HttpClient) {}

  /**
   * 取得表單模板資訊（從 mock 數據）
   * @param tmplNo
   * @returns
   */
  public async getFormTmplInfo(tmplNo: string): Promise<FormTmplInfo> {
    try {
      const mockUrl = `assets/mock/${tmplNo}.json`;
      const templateData = await this.http.get<any>(mockUrl).toPromise();

      const result = new FormTmplInfo();
      result.tmplNo = tmplNo;
      result.formTmpl = templateData;

      return result;
    } catch (error) {
      console.error('載入表單模板失敗:', error);
      // 返回空的表單模板
      const emptyTemplate = new FormTmplInfo();
      emptyTemplate.tmplNo = tmplNo;
      emptyTemplate.formTmpl = {
        components: []
      };
      return emptyTemplate;
    }
  }

  /**
   * 檢查表單必填欄位驗證
   * @param formTemplate 表單模板
   * @param formReply 表單回覆數據
   * @returns 驗證結果和錯誤訊息
   */
  public checkIsValid(
    formTemplate: any,
    formReply: any
  ): { result: boolean; message: string } {
    let result = { result: true, message: '' };
    let needValidateArray = [];

    // 收集所有必填欄位
    if (formTemplate && formTemplate.components) {
      eachComponent(formTemplate.components, (x: any) => {
        if (x.validate && x.validate.required === true) {
          needValidateArray.push([x.key, x.label, x.type]);
        }
      });
    }

    // 檢查必填欄位
    needValidateArray.forEach((x) => {
      // 預先判斷是否有這個key
      if (formReply && formReply.hasOwnProperty(x[0])) {
        let fieldValue = formReply[x[0]];
        let isFieldEmpty = false;

        // 根據不同類型檢查是否為空
        switch (x[2]) {
          case 'selectboxes':
            isFieldEmpty = !this.doCheckSelectBoxes(fieldValue);
            break;
          case 'textfield':
          case 'textarea':
          case 'email':
          case 'phoneNumber':
            isFieldEmpty = !fieldValue || fieldValue.toString().trim().length === 0;
            break;
          case 'select':
          case 'radio':
            isFieldEmpty = !fieldValue || fieldValue.length === 0;
            break;
          case 'number':
            isFieldEmpty = fieldValue === null || fieldValue === undefined || fieldValue === '';
            break;
          default:
            isFieldEmpty = !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0) || fieldValue.toString().trim().length === 0;
            break;
        }

        if (isFieldEmpty) {
          result.message += `${x[1]}，`;
        }
      } else {
        // 沒有此欄位，視為未填
        result.message += `${x[1]}，`;
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
   * 判斷 select boxes 必填
   * @param selectBoxesReply
   * @returns
   */
  private doCheckSelectBoxes(selectBoxesReply: any): boolean {
    if (!selectBoxesReply || typeof selectBoxesReply !== 'object') {
      return false;
    }

    const selectObjectKeys = Object.keys(selectBoxesReply);
    return selectObjectKeys.some(key => selectBoxesReply[key] === true);
  }
}
