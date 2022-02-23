import { Component, OnInit, Input, EventEmitter } from '@angular/core';
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

  @Input()
  public tmplNo: number;

  public displaySearchReq: boolean = false;

  public replyStatusOptions: Array<any> = [
    { name: "全部", value: 0 },
    { name: "尚未回覆，預取回覆鍵值", value: 10 },
    { name: "暫存回覆", value: 20 },
    { name: "繳交回覆，但權責單位尚未收件", value: 30 },
    { name: "撤銷回覆", value: 40 },
    { name: "已經收件", value: 50 },
    { name: "處理完成", value: 60 },
    { name: "作廢回覆", value: 80 }
  ];

  // 回覆清單
  public replyList: FormReplyList[];
  // 被選擇到的清單列
  public selectedReplyInfo: FormReplyInfo;

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

  public displayDialog = [
    {
      title: 'QR-Code',
      visible: false,
    }
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
  public changeFlag = false;

  // 顯示QR-Code
  public qrCodeUrl: string = '';

  constructor(
    public f2RSvc: Form2ReplierService,
    private messageService: MessageService,
    private pSvc: PatientInfoService,
    private bannerSvc: BannerService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {

    // 如果是透過input進來的，就不用再取url的連結
    this.urlQueryNavigate();

    this.initReplyListReq();
    // formIo官方 refresh寫法
    this.triggerRefresh = new EventEmitter();
    // this.btnEmpower(1);

    this.getFormTmplInfo(20100);
    let abc: FormReplyInfo = { "replyNo": 2, "tmplNo": 20100, "replyUser": "L124065781", "replyTime": new Date("2021-11-17T16:20:41.540"), "tranUser": 0, "tranTime": new Date("2999-12-31T08:00:00.000"), "tranStatus": 20, "tranUserName": "", systemUser: 33573 }
    this.getReplyRecord(abc);

  }

  ngOnChanges(): void {
    this.getFormTmplInfo(this.tmplNo);
    this.initReplyListReq();
  }


  // urlQuery時 導向的
  private urlQueryNavigate() {

    // 首先先抓住 tmplNo 表單編號
    this.tmplNo = isNaN(parseInt(this.route.snapshot.paramMap.get('tmplNo')))
      ? this.tmplNo
      : parseInt(this.route.snapshot.paramMap.get('tmplNo'));
    // 根據表單編號 先去 FormTmpl 抓表單資訊
    this.getFormTmplInfo(this.tmplNo);

    // queryParams 先抓出 route 傳遞過來的 queryParams
    let queryParams = this.route.snapshot.queryParams;

    // 如果有傳 chartNo, 則要把 搜尋條件(searchReq) 改為 chartNo
    if (queryParams['chartNo'] !== undefined) {
      this.f2RSvc.searchReq.type = 'chartNo';
      this.f2RSvc.searchReq.values.chartNo = queryParams['chartNo'];
    }

    // 看有沒有type 有的話代表要 new一筆新的 跳至表單內容
    if (this.route.snapshot.queryParams['type'] !== undefined) {

      this.onNewReplyClick();
    }

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

  private onDisplayQrCode(replyInfo: FormReplyInfo) {

    this.f2RSvc.getFormQrCodeUrl(replyInfo).subscribe((res) => {
      this.qrCodeUrl = res;
      this.displayDialog[0].visible = true;
    });
  }

  /**
   * 當formIo有異動的時候
   * @param event
   */
  public onChange(event) {
    // 將資料暫存到tmpldata
    this.tempSubmitData = event.data ? event.data : this.tempSubmitData;
    this.changeFlag = true;
  }

  /**
   * 取得最後submit的資料
   */
  private getSubmitData() {
    this.submitData = {};
    this.submitData.data = JSON.parse(JSON.stringify(this.tempSubmitData));
  }

  /**
   * 取得表單詳細資訊(含正式表單驗證資訊)
   * 不含 FormReply
   * @param tmplNo
   */
  private getFormTmplInfo(tmplNo: number) {
    this.f2RSvc.getFormTmplInfo(tmplNo).subscribe(
      (res) => {
        this.tmplInfo = res;
      },
      (err) => {
        this.showToastMsg(500, '取得填寫表單樣板錯誤');
      }
    );
  }

  /**
   * 取得回覆清單 (清單, 所以不會有 FormReply.ReplyDesc)
   * 會有三種找法, 1 找全部人, 2 用身分證, 3 用病歷號 (後兩者也都是用 idNo)
   */
  private getFormReplyList(tmplNo: number) {

    let params: FormReplyListTimeReq = {
      tmplNo,
      startTime: new Date,
      endTime: new Date,
      replyUser: ''
    };
    params.tmplNo = tmplNo;
    params.startTime = this.f2RSvc.searchReq.values.date1;
    this.f2RSvc.searchReq.values.date2.setHours(23);
    this.f2RSvc.searchReq.values.date2.setMinutes(59);
    params.endTime = this.f2RSvc.searchReq.values.date2;
    params.replyUser = this.pSvc.patientInfo?.idNo || '';

    // 看是不是用 idNo去找(就算是用 chartNo 也已經在 getPatientInfo找到了)
    if (this.f2RSvc.searchReq.type === 'all') {
      // 沒有選人
      this.f2RSvc.getFormReplyListByTime(params).subscribe(
        (res) => {
          this.replyList = this.filterFormReplyList(res);
        },
        (err) => {
          this.showToastMsg(500, '取得填寫紀錄清單失敗');
          this.displayProgress = false;
        }
      );
    } else {
      // 選人 用 idNo 去找
      this.f2RSvc.getFormReplyList(params).subscribe(
        (res) => {
          this.replyList = this.filterFormReplyList(res);
        },
        (err) => {
          this.showToastMsg(500, '取得填寫紀錄清單失敗');
          this.displayProgress = false;
        }
      );
    }
    // this.btnEmpower(this.tabIndex);
    this.displayProgress = false;
  }

  /**
   * 過濾篩選 FormReplyList
   * @param replyList
   * @returns
   */
  private filterFormReplyList(replyList: Array<any>) {

    let searchReq = this.f2RSvc.searchReq;

    return replyList.filter((reply) => {
      let replyTime = new Date(reply.replyTime);
      return (searchReq.values.date1 <= replyTime &&
        searchReq.values.date2 >= replyTime);
    }).filter((reply) => {
      if (searchReq.values.status == 0) {
        return true;
      } else {
        return reply.tranStatus == searchReq.values.status;
      }
    });
  }

  /**
   * 儲存回覆內容到DB
   */
  private setFormReply() {
    this.f2RSvc.setFormReply(this.formReplyInfo).subscribe(
      (res) => {
        this.showToastMsg(200, '儲存成功');
        // 如果是按下繳交後，回到填寫紀錄清單
        if (this.formReplyInfo.tranStatus === 30) {
          this.onConfirm();
        }
        // 有問題 在 onConfirm裡面有呼叫 tabChange, 就會去 getFormReplyList了
        this.getFormReplyList(this.tmplNo);
        this.displayProgress = false;
        this.changeFlag = false;
      },
      (err) => {
        this.showToastMsg(500, '儲存失敗');
        this.displayProgress = false;
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
    this.formReplyInfo.replyUser = this.pSvc.patientInfo.idNo;
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
    this.changeFlag = false;
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
    let replyRule = this.tmplInfo.replyRule;
    if (replyRule == 10 || replyRule == 20) {
      if (tranStatus > 20) {

        this.formReadOnly = true;
        this.tmplInfo.formTmpl = Object.assign({}, this.tmplInfo.formTmpl);
      }
      else {
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
    console.log(this.pSvc.patientInfo);
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
          data: res.replyDesc
        }
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
