import {
  Component,
  OnInit,
  Input,
  EventEmitter,
  Output,
  ViewChild,
  OnChanges,
} from '@angular/core';
import { MessageService } from 'primeng/api';

import { eachComponent } from 'formiojs/utils/formUtils.js';

import { FormReplyInfo, FormTmplInfo } from './view-model/index';

import { Form2ReplierService } from './form2-replier.service';

@Component({
  selector: 'form2-replier',
  templateUrl: './form2-replier.component.html',
  styleUrls: ['./form2-replier.component.scss'],
})
export class Form2ReplierComponent implements OnInit, OnChanges {
  @ViewChild('formIo') formIo: any;

  /**表單資訊顯示控制 */
  @Input()
  public showTag: boolean = true;

  /**填答參數 */
  @Input()
  public replyInfo: FormReplyInfo;

  /**工具列顯示控制 */
  @Input()
  public showToolbar: boolean = true;

  // formIo是否可以填寫
  @Input()
  public formReadOnly = false;

  /**暫存、繳交後結果 */
  @Output() result = new EventEmitter<any>();

  @Output()
  public flagChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  // 判斷是否有必填欄位未填
  public enableSave = false;
  // 顯示處理進度
  public displayProgress = false;

  /**工具列變數 */
  // 工具列左側按鈕
  public toolBarButtons = [
    {
      title: '提交',
      class: 'p-button-success',
      icon: 'pi pi-send',
      disable: false,
      displayNone: false,
      onClick: (event) => this.onSaveReplyClick(),
    },
  ];

  /*操控formIo的相關變數*/

  // 操控formIo refresh
  public triggerRefresh;

  // 表單樣板資訊
  public tmplInfo: FormTmplInfo = new FormTmplInfo();

  // 最後的submitData，或預帶的資料
  public submitData;

  // 暫存submitData，防止被清空
  public tempSubmitData;

  // 最後要儲存到formreply這張資料表的內容
  public formReplyInfo: FormReplyInfo = new FormReplyInfo();

  // 儲存模板所有的api name
  private componentKeys = [];

  constructor(
    public f2RSvc: Form2ReplierService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initInfo();
    // formIo官方 refresh寫法
    this.triggerRefresh = new EventEmitter();
  }

  ngOnChanges(): void {
    // 當輸入參數改變時重新初始化
    this.initInfo();
  }

  /**
   * 初始化表單資訊
   */
  public async initInfo() {
    this.initDataVariable();
    await this.getReplyRecord();
  }

  /**
   * 初始化資料儲存變數
   */
  private initDataVariable() {
    this.tempSubmitData = {};
    this.submitData = {};
    this.formReplyInfo = new FormReplyInfo();
    this.tmplInfo = new FormTmplInfo();
  }

  /**
   * 載入表單模板
   */
  public async getReplyRecord() {
    try {
      this.displayProgress = true;

      // 載入表單模板資訊
      this.tmplInfo = await this.f2RSvc.getFormTmplInfo('2c98768c-26a0-4bf5-903e-4f6151ca31b9');

      // 取得表單欄位keys
      this.getComponentKeys(this.tmplInfo.formTmpl);

      // 初始化提交資料
      this.submitData = { data: {} };

      this.displayProgress = false;
    } catch (error) {
      this.showToastMsg(500, '表單載入失敗');
      this.displayProgress = false;
    }
  }

  /**
   * 顯示toast訊息
   */
  private showToastMsg(severity: number, summary: string, detail: string = '') {
    enum severityType {
      success = 200,
      warn = 404,
      error = 500,
    }
    this.messageService.clear();
    this.messageService.add({
      key: 'generalFormReplyMessage',
      severity: severityType[`${severity}`],
      summary: summary,
      detail: detail,
    });
  }

  /**
   * 暫存回覆內容
   */
  // public onTempReplyClick() {
  //   // 表單規則繳交後不可異動的表單不能繳交或暫存
  //   if (this.formIo.readOnly) {
  //     this.showToastMsg(
  //       500,
  //       '違反表單規則無法異動。請檢視是否有以下狀況導致無法異動。',
  //       `1. 表單繳交後無法異動\n 2. 非本人不可異動\n 3. 個案已[結案且停止追蹤]或[死亡]`
  //     );
  //     return;
  //   } else if (
  //     this.replyInfo.tranStatus === undefined ||
  //     this.replyInfo.tranStatus <= 20
  //   ) {
  //     // 如果tranStatus是undefine代表是新建表單、<=20代表表單狀態是暫存可以繼續暫存 2022/7/15
  //     this.displayProgress = true;
  //     this.setReplyData(20);
  //     this.setFormReply(this.formReplyInfo);
  //   } else {
  //     // 已經繳交的表單不能在按暫存更改檔案，無關表單是否可以異動。2022/7/15
  //     this.showToastMsg(500, '', '表單已繳交無法暫存。');
  //   }
  // }

  /**
   * 提交表單內容
   */
  public onSaveReplyClick() {
    // 取得判斷必填驗證
    let isValidCheck = this.f2RSvc.checkIsValid(
      this.tmplInfo.formTmpl,
      this.submitData.data
    );

    // 是否有必填欄位未填
    if (isValidCheck.result === false) {
      this.showToastMsg(500, '提交失敗', isValidCheck.message);
      return;
    }

    this.displayProgress = true;
    this.setReplyData();
    this.processFormSubmission();
  }

  /**
   * 當formIo有異動的時候
   * @param event
   */
  public onChange(event) {
    // 將資料暫存到tmpldata
    this.tempSubmitData = event.data ? event.data : this.tempSubmitData;

    // 當內容有異動時，判斷是否有必填欄位未填
    if (event.isModified === true) {
      console.log(event.isValid);
      this.submitData.data['_isValid'] = event.isValid;
    }

    let changetFlag: boolean = this.formIo.readOnly ? false : true;
    this.flagChange.emit(changetFlag);
  }

  /**
   * 回傳預帶資料
   * 給父元件用 ViewChild 來使用
   * @param preloadData
   */
  // public setPreData(preloadData: any) {
  //   this.getSubmitData();
  //   if (!Array.isArray(preloadData)) {
  //     // 取得preLoadDataKeys object的key
  //     let preLoadDataKeys = Object.keys(preloadData);
  //     // 取得submitDataKeys及preLoadDataKeys的交集
  //     let arrayIntersection = this.componentKeys.filter((e) => {
  //       return preLoadDataKeys.indexOf(e) > -1;
  //     });

  //     // 將預帶資料的值塞入到submitData中
  //     arrayIntersection.forEach((e) => {
  //       this.submitData.data[e] = preloadData[e];
  //     });
  //   } else {
  //     // 暫時不處理陣列
  //     console.warn('目前不支援陣列，但我有偷塞到_cmuhPetrichor');
  //     this.submitData.data['_cmuhPetrichor'] = preloadData;
  //   }

  //   // 暫存submitData
  //   let tempData = this.submitData;
  //   // 需要重新賦址，formIo畫面才會重新刷新
  //   this.submitData = JSON.parse(JSON.stringify(tempData));

  //   this.displayProgress = false;
  // }

  /**
   * 給父元件用 ViewChild 來使用
   * @returns
   */
  public outputReplyDesc() {
    this.displayProgress = true;
    let resultInfo = {
      isValid: this.submitData.data['_isValid'],
      submitData: {},
    };

    this.getSubmitData();
    resultInfo.submitData = this.submitData.data;
    this.displayProgress = false;
    return resultInfo;
  }

  /**
   * 取得最後submit的資料
   */
  public getSubmitData() {
    this.submitData = {};
    this.submitData.data = JSON.parse(JSON.stringify(this.tempSubmitData));
  }

  /**
   * 儲存回覆內容到DB
   */
  // public setFormReplyAttachedFiles(replyData: FormReplyInfo) {
  //   let resultInfo = {
  //     data: this.formReplyInfo,
  //     initReplay: this.formReplyInfo,
  //   };

  //   this.f2RSvc.setFormReply(replyData).subscribe(
  //     (res: number) => {
  //       this.showToastMsg(200, '存檔成功');

  //       // 有問題 在 onConfirm裡面有呼叫 tabChange, 就會去 getFormReplyList了
  //       this.displayProgress = false;

  //       resultInfo.data = replyData;
  //       this.result.emit(resultInfo);
  //     },
  //     (err) => {
  //       this.showToastMsg(500, '存檔失敗');
  //       this.displayProgress = false;
  //       resultInfo.data = replyData;
  //     }
  //   );
  // }

  /**
   * 處理表單提交
   */
  private processFormSubmission() {
    let resultInfo = {
      data: this.formReplyInfo,
      apiResult: true,
      tmpl: this.tmplInfo,
    };

    // 模擬成功提交
    setTimeout(() => {
      this.showToastMsg(200, '提交成功');
      this.displayProgress = false;
      this.result.emit(resultInfo);
      this.flagChange.emit(false);
    }, 1000);
  }

  // /**
  //  * 回存外部api用的function
  //  * @param enCodeData
  //  * @param mappingData
  //  */
  // private setDataWithExtApi(enCodeData, mappingData) {
  //   // 回存mapping檔
  //   this.f2RSvc.setFormReplyMap(mappingData).subscribe(
  //     (res) => {
  //       console.log('mapping存檔成功');
  //     },
  //     (err) => {
  //       console.log('mapping存檔失敗');
  //     }
  //   );

  //   // 回存外部api
  // }

  /**
   * 塞值 formReplyInfo
   * @param formReplyData
   */
  private setFormReplyInfo(formReplyData: FormReplyInfo) {
    this.formReplyInfo = formReplyData;
    let resultInfo = {
      data: this.formReplyInfo,
      initReplay: this.formReplyInfo,
    };

    this.result.emit(resultInfo);
  }

  /**
   * 設定回覆的內容資料
   */
  public setReplyData() {
    this.getSubmitData();

    this.formReplyInfo.replyDesc = this.submitData.data;
    // 注意：FormReplyInfo 可能沒有這些屬性，但這裡是展示用途
    (this.formReplyInfo as any).tranTime = new Date();
    (this.formReplyInfo as any).tranStatus = 30; // 已提交狀態
  }  // private setReplyItemForFilter() {
  //   let result: Record<string, any> = {};
  //   this.replyItemForFilterList.forEach((item) => {
  //     let keys = (<string>item.field).split('.');
  //     let replyItem = this.setReplyItem(
  //       keys,
  //       this.formReplyInfo.replyDesc,
  //       JSON.parse(JSON.stringify(result))
  //     );
  //     result[keys[0]] = replyItem;
  //   });
  //   return result;
  // }

  // 取得formtemplate components的key
  private getComponentKeys(formTemplate: any) {
    this.componentKeys = [];
    if (formTemplate && formTemplate.components) {
      eachComponent(formTemplate.components, (x) => {
        this.componentKeys.push(x.key);
      });
    }
  }
}

