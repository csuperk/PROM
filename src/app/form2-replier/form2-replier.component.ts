import {
  Component,
  OnInit,
  Input,
  EventEmitter,
  Output,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';

import { PatientInfoService } from '@cmuh/patient-info';
import { BannerService } from '@cmuh/core';
import '@cmuh/extensions';

import { FormReplyInfo, FormTmplInfo, FormWhitelistAuthReq } from '@cmuh-viewmodel/form2-kernel';
import { FormioComponent } from '@formio/angular';

import { Form2ReplierService } from './form2-replier.service';
import { Form2AuthService } from '../form2-auth/form2-auth.service';

@Component({
  selector: 'form2-replier',
  templateUrl: './form2-replier.component.html',
  styleUrls: ['./form2-replier.component.scss'],
})
export class Form2ReplierComponent implements OnInit {
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

  /**
   * 存檔(暫存, 繳交)的類型
   * setFormReply2是針對某個replyNo去異動, 或是 qrCode新增時, 會用 getReplyNo 產生replyNo
   * addFormReply2Info是正式表單新增時, 不用帶replyNo, sp會自動增加replyNo
   * @type {('' | 'setFormReply2' | 'addFormReply2Info')}
   * @memberof Form2ReplierComponent
   */
  @Input()
  public setType: '' | 'setFormReply2' | 'addFormReply2Info' = "";

  /**暫存、繳交後結果 */
  @Output() result = new EventEmitter<any>();

  @Output()
  public flagChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  // 顯示處理進度
  public displayProgress = false;

  /**工具列變數 */
  // 工具列左側按鈕
  public toolBarButtons = [
    {
      title: '暫存',
      class: 'p-button-secondary',
      icon: 'pi pi-inbox',
      disable: false,
      displayNone: false,
      onClick: (event) => this.onTempReplyClick(),
    },
    {
      title: '繳交',
      class: 'p-button-success',
      icon: 'pi pi-send',
      disable: false,
      displayNone: false,
      onClick: (event) => this.onSaveReplyClick(),
    },
    {
      title: '表單預帶資料選單',
      class: 'p-button-help',
      icon: 'pi pi-info',
      disable: false,
      displayNone: false,
      onClick: (event) => this.onDisplayPreLoadDialog(),
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

  // 顯示 dialog
  public displayDialog = [
    {
      title: '表單預帶資料',
      visible: false,
    },
  ];

  constructor(
    public f2RSvc: Form2ReplierService,
    public form2AuthSvc: Form2AuthService,
    private messageService: MessageService,
    public pSvc: PatientInfoService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.initInfo();

    // formIo官方 refresh寫法
    this.triggerRefresh = new EventEmitter();
  }

  ngOnChanges(): void {
    this.initDataVariable();
    this.displayProgress = true;
    this.initInfo();
    this.getReplyRecord();
  }

  /**
   * 因需要等待api先取回emp的idNo，所以增加此method
   */
  public async initInfo() {
    if (this.f2RSvc.userInfoService == null) {
      setTimeout(() => {
        this.initInfo();
      }, 1000);
      return;
    }
  }

  /**
   * 暫存回覆內容
   */
  public onTempReplyClick() {
    // 表單規則繳交後不可異動的表單不能繳交或暫存
    if (this.formIo.readOnly) {
      this.showToastMsg(500, '表單規則繳交後無法異動，表單無法暫存或繳交');
      return;
    }
    this.displayProgress = true;
    this.setReplyData(20);
    this.setFormReply();
  }

  /**
   * 繳交回覆內容
   */
  public onSaveReplyClick() {
    // 表單規則繳交後不可異動的表單不能繳交或暫存
    if (this.formIo.readOnly) {
      this.showToastMsg(500, '表單規則繳交後無法異動，表單無法暫存或繳交');
      return;
    }
    this.displayProgress = true;
    this.setReplyData(30);
    this.setFormReply();
  }

  /**
   * 顯示預帶資料 dialog
   */
  public onDisplayPreLoadDialog() {
    this.displayDialog[0].visible = true;
  }

  /**
   * 當formIo有異動的時候
   * @param event
   */
  public onChange(event) {
    // 將資料暫存到tmpldata
    this.tempSubmitData = event.data ? event.data : this.tempSubmitData;
    let changetFlag: boolean = this.formIo.readOnly ? false : true;
    this.flagChange.emit(changetFlag);
  }

  /**
   * 接收 form2-pre-load 回傳的預帶資料
   * @param preData
   */
  public exportPreData(preData: Array<any>) {

    let preDataKey = Object.keys(preData);
    this.getSubmitData();
    let submitData = JSON.parse(JSON.stringify(this.submitData.data || []));

    for (const iterator of preDataKey) {
      if (submitData[`${iterator}`] !== undefined) {
        submitData[`${iterator}`] = preData[`${iterator}`];
      }
    }
    this.submitData = { data: submitData };
    // 關掉彈窗
    this.displayDialog[0].visible = false;
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
  public setFormReply() {

    let resultInfo = {
      data: this.formReplyInfo,
      apiResult: false,
      tmpl: this.tmplInfo,
    };
    switch (this.setType) {
      case 'setFormReply2':
        this.f2RSvc.setFormReply(this.formReplyInfo).subscribe(
          (res: number) => {
            this.showToastMsg(200, '儲存成功');

            // 有問題 在 onConfirm裡面有呼叫 tabChange, 就會去 getFormReplyList了
            this.displayProgress = false;

            resultInfo.data = this.formReplyInfo;
            resultInfo.apiResult = true;
            this.result.emit(resultInfo);
            this.flagChange.emit(false);
          },
          (err) => {
            this.showToastMsg(500, '儲存失敗');
            this.displayProgress = false;
            resultInfo.data = this.formReplyInfo;
            resultInfo.apiResult = false;
            this.result.emit(resultInfo);
          }
        );
        break;
      case 'addFormReply2Info':
        this.f2RSvc.addFormReply2Info(this.formReplyInfo).subscribe(
          (res) => {
            this.showToastMsg(200, '儲存成功');
            this.displayProgress = false;
            resultInfo.data = this.formReplyInfo;
            resultInfo.apiResult = true;
            this.result.emit(resultInfo);
            // 要將新增的 replyNo 重新塞回去
            this.replyInfo.replyNo = res;
            // 之後setType改變, 因為接下來就是UPDATE了
            this.setType = 'setFormReply2';
          },
          (err) => {
            this.showToastMsg(500, '儲存失敗');
            this.displayProgress = false;
            resultInfo.data = this.formReplyInfo;
            resultInfo.apiResult = false;
            this.result.emit(resultInfo);
          }
        );
        break;
    }
  }

  /**
   * 設定回覆的內容資料 (預備要存檔用的)
   * @param tranStatus
   */
  public setReplyData(tranStatus: number = 20) {

    this.getSubmitData();
    let loginUser =
      this.f2RSvc.userInfoService === null
        ? 999999
        : this.f2RSvc.userInfoService.userNo;

    this.formReplyInfo.tmplNo = this.tmplInfo.tmplNo;
    this.formReplyInfo.subject =
      this.pSvc.patientInfo === undefined
        ? this.formReplyInfo.subject
        : this.pSvc.patientInfo.idNo;
    this.formReplyInfo.replyDesc = this.submitData.data;
    this.formReplyInfo.tranUser = loginUser;
    this.formReplyInfo.tranTime = new Date();
    this.formReplyInfo.tranStatus = tranStatus;
    this.formReplyInfo.systemUser = loginUser;
    this.formReplyInfo.replyNo = this.replyInfo.replyNo;
    this.formReplyInfo.subjectType = this.replyInfo.subjectType;
    this.formReplyInfo.subject = this.replyInfo.subject;
  }

  /**
   * 複製回覆
   * 1. 先保留目前填答結果 tempReplyDesc
   * 2. 模擬新建填答
   *   2-1. replyInfo 初始化 (replyNo設為undefined, subject 設為新的 subject)
   *   2-2. 執行 initDataVariable 跟 getReplyRecord 來進行初始化
   * 3. 將剛剛被份的 tempReplyDesc 塞回去 submitData
   * @param subject
   */
  public async copyReplier(subject: string) {

    const tempReplyDesc = Object.assign({}, this.submitData.data);

    this.replyInfo.tmplNo = this.replyInfo.tmplNo;
    this.replyInfo.replyNo = undefined;
    this.replyInfo.subjectType = 10;
    this.replyInfo.subject = subject;
    this.initDataVariable();
    await this.getReplyRecord();

    this.setType = this.replyInfo.tmplNo > 0 ?
      'addFormReply2Info' :
      'setFormReply2';

    // 將表單的唯讀改為可編輯
    this.formIo.readOnly = false;

    // 重新賦值才能刷新頁面
    this.submitData = { data: tempReplyDesc };
    this.tmplInfo = JSON.parse(JSON.stringify(this.tmplInfo));
  }

  /**
   * 顯示需要二次確認的message
   * @param severity
   * @param summary
   * @param detail
   */
  private showConfirm(
    severity: number = 404,
    summary: string,
    detail: string = '',
    key: string
  ) {
    enum severityType {
      success = 200,
      warn = 404,
      error = 500,
    }
    this.messageService.clear();
    this.messageService.add({
      key: key,
      sticky: true,
      severity: severityType[`${severity}`],
      summary: summary,
      detail: detail,
    });
  }

  /**
   * 確定放棄填寫內容
   */
  public onConfirm() {
    this.messageService.clear('confirmMessage');
    this.initDataVariable();
    // this.tabChange(0);
  }
  /**
   * 取消放棄填寫內容動作
   */
  public onReject() {
    this.messageService.clear('confirmMessage');
    this.messageService.clear('confirmWithdrawMessage');
  }
  /**
   * 確定撤銷回覆
   */
  public onConfirmWithdraw() {
    this.messageService.clear('confirmWithdrawMessage');
    this.displayProgress = true;

    // FormReply.ReplyStatus = 40: 撤銷回覆
    this.setReplyData(40);
    this.setFormReply();
  }

  /**
   * 清單點擊事件
   * @param replyInfo
   */
  public async getReplyRecord() {

    // 先塞好 表單的資訊 tmplInfo (例如表單樣子, replyRule...等)
    this.tmplInfo = (
      await this.f2RSvc.getFormTmplInfo(this.replyInfo.tmplNo).toPromise()
    )[0];

    // 初始化 submitData
    // 新增的 reply 會沒有 replyNo
    if (this.replyInfo.replyNo == undefined) {
      this.replyInfo.replyNo = this.getReplyNo(this.replyInfo.tmplNo);
      this.displayProgress = false;
      // 新增的情況會預帶資料
      await this.autoCompleteSubmitData();
      return;
    }

    // 驗證繳交後可否異動
    await this.authTest();

    // 取回之前的 填答結果 replyInfo
    this.getFormReplyInfo(10);
  }

  /*****預帶資料*****/

  /**
   * 自動預帶資料
   */
  private async autoCompleteSubmitData() {

    // 只有新增需要自動帶資料
    let data = await this.f2RSvc.getPatientByIdNo(this.replyInfo.subject).toPromise();
    this.submitData = { data: data };
  }

  /*****預帶資料*****/

  /**
   * 驗證繳交後能否異動
   * 不可異動會變為唯獨模式
   */
  private async authTest() {

    // 代表是異動的, tranStatus是這筆回覆的狀態
    let tranStatus = this.replyInfo.tranStatus;

    // 填答規範 10 跟 20 代表 回覆後不可異動
    let replyRule = this.tmplInfo.replyRule;

    if (replyRule == 10 || replyRule == 20) {
      // 繳交後不可異動
      if (tranStatus > 20) {
        this.formIo.readOnly = true;
      }
    } else {
      if (tranStatus > 30) {
        this.formIo.readOnly = true;
      }
    }
    this.displayProgress = false;
  }

  /**
   * 取得回覆內容
   * 最重要的是取得 FormReply.ReplyDesc
   * @param replyNo
   */
  public getFormReplyInfo(eventFrom: number) {

    let replyNo = this.replyInfo.replyNo;
    enum eventFromType {
      tableList = 10,
      button = 20,
    }

    // 確認要有患者資訊 pSvc.patientInfo
    this.f2RSvc.getFormReplyInfo(replyNo).subscribe(
      (res) => {
        this.formReplyInfo = res[0];
        // formIo官方寫法，將取回來的填寫值塞回form Rander中
        // this.triggerRefresh.emit({
        //   form: this.tmplInfo.formTmpl,
        //   submission: {
        //     data: res.replyDesc,
        //   },
        // });

        this.submitData = {
          data: res[0].replyDesc,
        };
      },
      (err) => {
        this.showToastMsg(500, '回覆資料取得錯誤');
        this.displayProgress = false;
      }
    );
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
   * 顯示toast訊息
   * @param severity
   * @param summary
   * @param detail
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

  private getReplyNo(tmplNo: number): number {
    let result = 0;

    if (tmplNo < 0) {
      result = this.getTestFormTmplRandomNo();
      return result;
    }
    if (tmplNo > 0) {
      result = this.getFormReplyRandomNo();
      return result;
    }

    return result;
  }

  /**
   * 取得正式表單回覆的replyNo
   * @returns
   */
  private getFormReplyRandomNo(): number {
    let result = 0;
    let max = 1999999999;
    let min = 1000000000;
    result = Math.floor(Math.random() * (max - min + 1)) + min;

    return result;
  }

  /**
   * 取得測試亂數編號(給表單編號用)
   * @returns
   */
  private getTestFormTmplRandomNo(): number {
    let result = 0;
    result = (Math.floor(Math.random() * 2147483648) + 1) * -1;

    return result;
  }
}
