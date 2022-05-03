import { Component, OnInit, OnChanges, Input, Output, EventEmitter, TemplateRef, QueryList, ViewChildren } from '@angular/core';

import { PatientInfo } from '@cmuh-viewmodel/form2-kernel';

import { Form2PreLoadService } from './form2-pre-load.service';
import { Form2PreLoadDirective } from './form2-pre-load.directive';

@Component({
  selector: 'form2-pre-load',
  templateUrl: './form2-pre-load.component.html',
  styleUrls: ['./form2-pre-load.component.scss']
})
export class Form2PreLoadComponent implements OnInit, OnChanges {

  @ViewChildren(Form2PreLoadDirective)
  carouselPages: QueryList<Form2PreLoadDirective>;
  displayPage: TemplateRef<any>

  @Input()
  subject: string = "";

  @Output()
  preData = new EventEmitter();

  // 預帶資料的選項
  public preLoadOpts = [
    { name: '請選擇要預帶的資料類型', code: -1 },
    { name: '病人基本資料', code: 0 },
  ];

  // 預帶資料
  public preLoad = { name: '請選擇要預帶的資料類型', code: -1 };

  // api 回傳的變數
  public returnPreInfo;

  constructor(private form2PreLoadSvc: Form2PreLoadService) { }

  ngOnInit(): void {
  }

  ngOnChanges(): void {
    this.initParams();
  }

  /**
   * 下拉選單異動時
   * @param value
   */
  public choosePreLoad(value) {

    switch (value.code) {
      case 0:
        this.onSearchPtInfo();
        break;
      default:
        break;
    }
    this.displayPage = this.carouselPages['_results'][value.code].templateRef;
  }

  /**
   * 取得病人基本資料
   */
  private onSearchPtInfo() {

    this.form2PreLoadSvc.getPatientByIdNo(this.subject).subscribe(
      (res: PatientInfo) => {
        this.returnPreInfo = res;
      },
      (err) => { }
    );
  }

  /**
   * 將資料匯出到表單
   */
  public exportToForm() {

    this.preData.emit(this.returnPreInfo);
  }

  private initParams() {
    this.returnPreInfo = null;
  }

}
