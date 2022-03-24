import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';

import {
  TmplInfo,
  FormReplyInfo,
  FormReplyListTimeReq,
  FormReplyList,
} from '@cmuh-viewmodel/form-master';
import { PatientInfoService } from '@cmuh/patient-info';
import { BannerService } from '@cmuh/core';
import '@cmuh/extensions';

import { Form2ReplierService } from './form2-replier.service';

@Component({
  selector: 'form2-replier',
  templateUrl: './form2-replier.component.html',
  styleUrls: ['./form2-replier.component.scss'],
})
export class Form2ReplierComponent implements OnInit {

  /**表單資訊顯示控制 */
  @Input()
  public showTag: boolean = true;

  /**填答參數 */
  @Input()
  public replyInfo: FormReplyInfo;

  /**工具列顯示控制 */
  @Input()
  public showToolbar: boolean = true;

  /**暫存、繳交後結果 */
  @Output() result = new EventEmitter<any>();

  public displaySearchReq: boolean = false;

  public replyStatusOptions: Array<any> = [
    { name: '全部', value: 0 },
    { name: '尚未回覆，預取回覆鍵值', value: 10 },
    { name: '暫存回覆', value: 20 },
    { name: '繳交回覆，但權責單位尚未收件', value: 30 },
    { name: '撤銷回覆', value: 40 },
    { name: '已經收件', value: 50 },
    { name: '處理完成', value: 60 },
    { name: '作廢回覆', value: 80 },
  ];

  // 回覆清單
  public replyList: FormReplyList[];

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
  ];

  /*操控formIo的相關變數*/
  // 操控formIo refresh
  public triggerRefresh;
  // 表單樣板資訊
  public tmplInfo: TmplInfo = new TmplInfo();
  // 最後的submitData，或預帶的資料
  public submitData;
  // 暫存submitData，防止被清空
  public tempSubmitData;
  // formIo是否可以填寫
  public formReadOnly = false;
  // 最後要儲存到formreply這張資料表的內容
  public formReplyInfo: FormReplyInfo = new FormReplyInfo();

  // 判斷是否異動formIo
  // public changeFlag = false;

  constructor(
    public f2RSvc: Form2ReplierService,
    private messageService: MessageService,
    private pSvc: PatientInfoService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // 如果是透過input進來的，就不用再取url的連結
    // this.urlQueryNavigate();
    this.initReplyListReq();
    // formIo官方 refresh寫法
    this.triggerRefresh = new EventEmitter();
  }

  ngOnChanges(): void {
    this.initDataVariable();
    this.displayProgress = true;
    this.getReplyRecord(this.replyInfo);
    this.initReplyListReq();
  }

  /**
   * 因需要等待api先取回emp的idNo，所以增加此method
   */
  public async initReplyListReq() {
    let empInfo = await this.f2RSvc
      .getEmpInfo(this.f2RSvc.userInfoService.userNo)
      .toPromise();
    this.f2RSvc.userInfoService = {
      ...this.f2RSvc.userInfoService,
      ...empInfo[0],
    };
    // this.onSearchClick();
  }

  /**
   * 暫存回覆內容
   */
  private onTempReplyClick() {
    this.displayProgress = true;
    this.setReplyData(20);
    this.setFormReply();
  }

  /**
   * 繳交回覆內容
   */
  private onSaveReplyClick() {
    this.displayProgress = true;
    this.setReplyData(30);
    this.setFormReply();
  }

  /**
   * 撤銷回覆
   */
  private onWithdrawClick(replyInfo: FormReplyInfo) {
    this.getFormReplyInfo(replyInfo.replyNo, 20);
    this.showConfirm(
      500,
      '確定撤銷回覆?',
      '問券將無法填寫，需由權責單位解除',
      'confirmWithdrawMessage'
    );
  }


  /**
   * 當formIo有異動的時候
   * @param event
   */
  public onChange(event) {
    // 將資料暫存到tmpldata
    this.tempSubmitData = event.data ? event.data : this.tempSubmitData;
    // this.changeFlag = true;
  }

  /**
   * 取得最後submit的資料
   */
  private getSubmitData() {
    this.submitData = {};
    this.submitData.data = JSON.parse(JSON.stringify(this.tempSubmitData));
  }

  /**
   * 儲存回覆內容到DB
   */
  private setFormReply() {
    let resultInfo = {
      data: this.formReplyInfo,
      apiResult: false,
      tmpl: this.tmplInfo,
    };
    this.f2RSvc.setFormReply(this.formReplyInfo).subscribe(
      (res) => {
        this.showToastMsg(200, '儲存成功');

        // 有問題 在 onConfirm裡面有呼叫 tabChange, 就會去 getFormReplyList了
        // this.getFormReplyList(this.tmplNo);
        this.displayProgress = false;
        // this.changeFlag = false;
        resultInfo.data = this.formReplyInfo;
        resultInfo.apiResult = true;
        this.result.emit(resultInfo);
      },
      (err) => {
        this.showToastMsg(500, '儲存失敗');
        this.displayProgress = false;
        resultInfo.data = this.formReplyInfo;
        resultInfo.apiResult = false;
        this.result.emit(resultInfo);
      }
    );
  }

  /**
   * 設定回覆的內容資料 (預備要存檔用的)
   * @param tranStatus
   */
  private setReplyData(tranStatus: number = 20) {
    this.getSubmitData();

    let loginUser = this.f2RSvc.userInfoService.userNo;

    this.formReplyInfo.tmplNo = this.tmplInfo.tmplNo;
    this.formReplyInfo.replyUser =
      this.pSvc.patientInfo === undefined
        ? this.formReplyInfo.replyUser
        : this.pSvc.patientInfo.idNo;
    this.formReplyInfo.replyTime = new Date();
    this.formReplyInfo.replyDesc = this.submitData.data;
    this.formReplyInfo.tranUser = loginUser;
    this.formReplyInfo.tranTime = new Date();
    this.formReplyInfo.tranStatus = tranStatus;
    this.formReplyInfo.systemUser = loginUser;

    this.formReplyInfo.replyRule = this.tmplInfo.replyRule;
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
    // this.changeFlag = false;
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
  public async getReplyRecord(replyInfo: FormReplyInfo) {
    // 驗證繳交後可否異動
    await this.authTest(replyInfo);

    this.getFormReplyInfo(replyInfo.replyNo, 10);
  }

  private async authTest(replyInfo) {
    // 驗證繳交後可否異動
    let tranStatus = replyInfo.tranStatus;
    this.tmplInfo = await this.f2RSvc.getFormTmplInfo(replyInfo.tmplNo).toPromise();
    let replyRule = this.tmplInfo.replyRule;
    if (replyRule == 10 || replyRule == 20) {
      if (tranStatus > 20) {
        this.formReadOnly = true;
        this.tmplInfo.formTmpl = Object.assign({}, this.tmplInfo.formTmpl);
      } else {
        this.formReadOnly = false;
        this.tmplInfo.formTmpl = Object.assign({}, this.tmplInfo.formTmpl);
      }
    } else {
      // replyRule = 11, 21
      // this.formReadOnly = tranStatus < 30 ? false : true;
      if (tranStatus > 30) {
        this.formReadOnly = true;
        this.tmplInfo.formTmpl = Object.assign({}, this.tmplInfo.formTmpl);
      } else {
        this.formReadOnly = false;
        this.tmplInfo.formTmpl = Object.assign({}, this.tmplInfo.formTmpl);
      }
    }
    this.displayProgress = false;
  }

  /**
   * 取得回覆內容
   * 最重要的是取得 FormReply.ReplyDesc
   * @param replyNo
   */
  public getFormReplyInfo(replyNo: number, eventFrom: number) {
    enum eventFromType {
      tableList = 10,
      button = 20,
    }
    // 確認要有患者資訊 pSvc.patientInfo
    // console.log(this.pSvc.patientInfo);
    // this.bannerSvc.innerHtml = this.createBanner(this.pSvc.patientInfo);

    this.f2RSvc.getFormReplyInfo(replyNo).subscribe(
      (res) => {
        this.formReplyInfo = res;
        // formIo官方寫法，將取回來的填寫值塞回form Rander中
        // this.triggerRefresh.emit({
        //   form: this.tmplInfo.formTmpl,
        //   submission: {
        //     data: res.replyDesc,
        //   },
        // });

        this.submitData = {
          data: res.replyDesc,
        };
      },
      (err) => {
        this.showToastMsg(500, '回覆資料取得錯誤');
        this.displayProgress = false;
      }
    );
  }

  // 新增 只能從外界帶過來
  private onNewReplyClick() {
    // 要清空
    this.initDataVariable();
  }

  /**
   * 初始化資料儲存變數
   */
  private initDataVariable() {
    this.tempSubmitData = {};
    this.submitData = {};
    this.formReplyInfo = new FormReplyInfo();
    this.tmplInfo = new TmplInfo();
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
}
