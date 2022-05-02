import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CmuhHttpService } from '@cmuh/http';
import { PatientInfo } from '@cmuh-viewmodel/form2-kernel';

@Injectable({
  providedIn: 'root'
})
export class Form2PreLoadService {

  constructor(private http: CmuhHttpService) { }

  /**
  * 透過身份證號(idNo)取得病人資訊(非陣列)
  * @param idNo
  * @returns
  */
  public getPatientByIdNo(idNo: string): Observable<PatientInfo> {
    const url = `/webapi/form2Kernel/form2Customized/getPatientByIdNo`;
    return this.http.get<PatientInfo>(`${url}/${idNo}`);
  }
}
