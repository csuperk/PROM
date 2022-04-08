import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { CmuhHttpService } from '@cmuh/http';
import { FormWhitelistAuthReq } from '@cmuh-viewmodel/form2-kernel';
import { AuthlistSubjectInfo } from '@cmuh-viewmodel/whitelist-module'

import '@cmuh/extensions';

@Injectable({
  providedIn: 'root'
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
  public async checkWhitelistAuth(params: FormWhitelistAuthReq, checkType: ("r" | "w" | "d" | "p")): Promise<boolean> {
    /**
     * 讀取 1 Math.floor((authValue % 10) / 1) === 1
     * 填寫 10 Math.floor((authValue % 100) / 10) === 1
     * 刪除 100 Math.floor((authValue % 1000) / 100) === 1
     * 列印 1000 Math.floor((authValue % 10000) / 1000) === 1
     */
    let auth: any = await this.getUserWhitelistAuth(params).toPromise();
    if (auth.length == 0) {
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
          Math.floor((authValue % 10) / 1) === 1;
          return true;

        case 'w':
          Math.floor((authValue % 100) / 10) === 1;
          return true;

        case 'd':
          Math.floor((authValue % 1000) / 100) === 1;
          return true;

        case 'p':
          Math.floor((authValue % 10000) / 1000) === 1;
          return true;

        default:
          return false;
      }
    }
  }

  constructor(private http: CmuhHttpService) { }

  public getUserWhitelistAuth(params: FormWhitelistAuthReq): Observable<AuthlistSubjectInfo> {
    const url = `/webapi/form2Kernel/form2Auth/getUserWhitelistAuth`;
    return this.http.put<AuthlistSubjectInfo>(`${url}`, params);
  }
}
