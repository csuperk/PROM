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

import { GeneralFormReplyService } from './general-form-reply.service';

@Component({
  selector: 'general-form-reply',
  templateUrl: './general-form-reply.component.html',
  styleUrls: ['./general-form-reply.component.scss'],
})
export class GeneralFormReplyComponent implements OnInit {

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

  /*TabPanel 操控變數 */
  // tabpanel頁籤賦能
  public enableTabPanel = false;
  // tabView頁籤index
  public tabIndex = 0;
  public tabClassActive = true;

  /**工具列變數 */
  // 工具列左側按鈕
  public toolBarButtons = [
    {
      title: '搜尋',
      class: '',
      icon: 'pi pi-search',
      disable: false,
      displayNone: false,
      onClick: (event) => this.onSearchClick(),
    },
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

  public tableFunctionBtn = [
    {
      title: '撤回',
      class: 'p-button-danger',
      icon: 'pi pi-trash',
      disable: false,
      onClick: (event) => this.onWithdrawClick(event),
    },
    {
      title: '顯示QrCode',
      class: 'p-button-secondary',
      icon: 'pi pi-pencil',
      disable: false,
      onClick: (event) => this.onDisplayQrCode(event),
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
    public generalFormReplySvc: GeneralFormReplyService,
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
    this.btnEmpower(0);
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
      this.generalFormReplySvc.searchReq.type = 'chartNo';
      this.generalFormReplySvc.searchReq.values.chartNo = queryParams['chartNo'];
    }

    // 看有沒有type 有的話代表要 new一筆新的 跳至表單內容
    if (this.route.snapshot.queryParams['type'] !== undefined) {

      this.onNewReplyClick();
    }

  }

  /**
   * 決定 input 是否要顯示
   * @param item
   * @returns
   */
  public showSearchInput(item: any): boolean {
    if (this.generalFormReplySvc.searchReq.options.some(x => x.label == item)) {
      return this.generalFormReplySvc.searchReq.type == item;
    }
    return false;
  }

  /**
   * 因需要等待api先取回emp的idNo，所以增加此method
   */
  public async initReplyListReq() {
    let empInfo = await this.generalFormReplySvc
      .getEmpInfo(this.generalFormReplySvc.userInfoService.userNo)
      .toPromise();
    this.generalFormReplySvc.userInfoService = {
      ...this.generalFormReplySvc.userInfoService,
      ...empInfo[0],
    };
    this.onSearchClick();
  }

  /**
   * 查詢功能
   *
   */
  private async onSearchClick() {

    if (this.generalFormReplySvc.searchReq.type !== 'all') {

      let ptExist = await this.getPatientInfo(this.generalFormReplySvc.searchReq);
      if (!ptExist) {
        // type !== 'all' 代表要找人 如果找不到 也不用找表單了 所以直接 return
        return;
      }
    }

    // 可能不用列出 type == 'all' 的情況 應該可以都在 getFormReplyList裡面做
    // 先找 ptInfo 但是不用塞 banner
    this.getFormReplyList(this.tmplNo);
  }


  /**
   * 取得患者資訊(可以藉由 idNo 或是 chartNo)
   * @returns
   */
  private async getPatientInfo(searchReq) {

    const value = searchReq.type == 'chartNo' ? searchReq.values.chartNo : searchReq.values.idNo;

    if (this.pSvc.patientInfo?.chartNo == value || this.pSvc.patientInfo?.idNo == value) {
      return true;
    }

    let ptInfos: Array<any> = await this.generalFormReplySvc.getPatientInfo(searchReq.type, value).toPromise();
    if (ptInfos.length == 0) {
      this.showToastMsg(500, '查無此患者');
      // 清空查詢 input欄位
      if (searchReq.type == 'chartNo') {
        this.generalFormReplySvc.searchReq.values.chartNo = '';
      } else {
        this.generalFormReplySvc.searchReq.values.idNo = '';
      }

      return false;
    }
    this.pSvc.patientInfo = ptInfos[0];
    return true;
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

    let hostName = window.location.hostname;

    if (hostName == 'his.cmubh.org.tw') {
      hostName = 'forms.bh.cmu.edu.tw';
    }

    // 正式區 可以讓外網連
    if (hostName == 'his.cmuh.org.tw') {
      hostName = 'forms.cmuh.org.tw';
      this.qrCodeUrl = `http://${hostName}/?replyNo=${replyInfo.replyNo}&tmplNo=${replyInfo.tmplNo}`;
      this.displayDialog[0].visible = true;
      return;
    }

    // 本地端 連測試區
    if (hostName == 'localhost') {

      // 測試區 院內
      hostName = 'his-alpha.cmuh.org.tw';
      this.qrCodeUrl = `http://${hostName}/webapp/form-customer/?replyNo=${replyInfo.replyNo}&tmplNo=${replyInfo.tmplNo}`;

      // 正式區 院外
      // hostName = 'forms.cmuh.org.tw';
      // this.qrCodeUrl = `http://${hostName}/?replyNo=${replyInfo.replyNo}&tmplNo=${replyInfo.tmplNo}`;

      this.displayDialog[0].visible = true;
      return;
    }

    this.qrCodeUrl = `http://${hostName}/webapp/form-customer/?replyNo=${replyInfo.replyNo}&tmplNo=${replyInfo.tmplNo}`;
    this.displayDialog[0].visible = true;
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
    this.generalFormReplySvc.getFormTmplInfo(tmplNo).subscribe(
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
    params.startTime = this.generalFormReplySvc.searchReq.values.date1;
    this.generalFormReplySvc.searchReq.values.date2.setHours(23);
    this.generalFormReplySvc.searchReq.values.date2.setMinutes(59);
    params.endTime = this.generalFormReplySvc.searchReq.values.date2;
    params.replyUser = this.pSvc.patientInfo?.idNo || '';

    // 看是不是用 idNo去找(就算是用 chartNo 也已經在 getPatientInfo找到了)
    if (this.generalFormReplySvc.searchReq.type === 'all') {
      // 沒有選人
      this.generalFormReplySvc.getFormReplyListByTime(params).subscribe(
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
      this.generalFormReplySvc.getFormReplyList(params).subscribe(
        (res) => {
          this.replyList = this.filterFormReplyList(res);
        },
        (err) => {
          this.showToastMsg(500, '取得填寫紀錄清單失敗');
          this.displayProgress = false;
        }
      );
    }
    this.btnEmpower(this.tabIndex);
    this.displayProgress = false;
  }

  /**
   * 過濾篩選 FormReplyList
   * @param replyList
   * @returns
   */
  private filterFormReplyList(replyList: Array<any>) {

    let searchReq = this.generalFormReplySvc.searchReq;

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
    this.generalFormReplySvc.setFormReply(this.formReplyInfo).subscribe(
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
    let loginUser = this.generalFormReplySvc.userInfoService.userNo;

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
   * 因需增加當內容有異動時，頁籤要跳出確認視窗，所以要再多加一層判斷，判斷要切到哪個tab
   * @param index
   */
  public onTabChange(index: number) {
    if (index === 0 && this.changeFlag === true && this.tabIndex !== 0) {
      this.showConfirm(
        404,
        '確定放棄填寫?',
        '本次填寫資料將不存儲',
        'confirmMessage'
      );
    }
    if (index === 0 && this.changeFlag === false) {
      this.tabChange(0);
    }
    if (index === 1) {
      this.tabChange(1);
    }
  }

  /**
   * 實際切換頁籤的動作觸發
   */
  private tabChange(index: number) {
    if (index === 0) {
      this.tabClassActive = true;
    } else {
      this.tabClassActive = false;
    }
    // 如果頁籤回到填寫紀錄頁面
    if (index === 0) {
      // 清空 banner
      this.bannerSvc.innerHtml = '';
      this.getFormReplyList(this.tmplNo);
      this.enableTabPanel = false;
    }
    this.tabIndex = index;
    this.btnEmpower(index);
  }

  /**
   * 功能按鈕賦能判斷
   * @param index
   * @param auth
   */
  private btnEmpower(index: number, auth: number = 0) {
    // 如果頁籤是0
    if (index === 0) {
      // 表單紀錄頁籤 只有 搜尋可以出現
      this.toolBarButtons[0].displayNone = false;
      this.toolBarButtons[1].displayNone = true;
      this.toolBarButtons[2].displayNone = true;

      // 表單紀錄頁籤中搜尋條件要出現
      this.displaySearchReq = false;

    }
    // 如果頁籤是1
    if (index === 1) {
      // 表單內容頁籤 只有 搜尋可以出現 暫存, 繳交
      this.toolBarButtons[0].displayNone = true;
      this.toolBarButtons[1].displayNone = false;
      this.toolBarButtons[2].displayNone = false;

      // 搜尋條件 在表單內容中不用顯示
      this.displaySearchReq = true;
    }
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
    this.tabChange(0);
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
    this.tabChange(0);
  }

  public async onReplyListClick(replyInfo: FormReplyInfo) {

    let searchReq = {
      type: 'idNo',
      values: {
        idNo: replyInfo.replyUser
      }
    }
    await this.getPatientInfo(searchReq);
    this.bannerSvc.innerHtml = this.createBanner(this.pSvc.patientInfo);
  }

  /**
   * 清單點擊事件
   * @param replyInfo
   */
  public async onReplyListDbClick(replyInfo: FormReplyInfo) {

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
        // 不可以暫存跟繳交
        this.toolBarButtons[1].disable = true;
        this.toolBarButtons[2].disable = true;
      }
      else {
        this.formReadOnly = false;
        this.tmplInfo.formTmpl = Object.assign({}, this.tmplInfo.formTmpl);
        this.toolBarButtons[1].disable = false;
        this.toolBarButtons[2].disable = false;
      }
    } else {
      // replyRule = 11, 21
      // this.formReadOnly = tranStatus < 30 ? false : true;
      if (tranStatus > 30) {
        this.formReadOnly = true;
        this.tmplInfo.formTmpl = Object.assign({}, this.tmplInfo.formTmpl);
        this.toolBarButtons[1].disable = true;
        this.toolBarButtons[2].disable = true;
      } else {
        this.formReadOnly = false;
        this.tmplInfo.formTmpl = Object.assign({}, this.tmplInfo.formTmpl);
        this.toolBarButtons[1].disable = false;
        this.toolBarButtons[2].disable = false;
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
    this.bannerSvc.innerHtml = this.createBanner(this.pSvc.patientInfo);

    this.generalFormReplySvc.getFormReplyInfo(replyNo).subscribe(
      (res) => {
        this.formReplyInfo = res;
        // formIo官方寫法，將取回來的填寫值塞回form Rander中
        this.triggerRefresh.emit({
          form: this.tmplInfo.formTmpl,
          submission: {
            data: res.replyDesc,
          },
        });
        // 如果是table點擊的事件，才要換頁
        if (eventFromType[`${eventFrom}`] == 'tableList') {
          this.tabChange(1);
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

    // 確認要有患者資訊 pSvc.patientInfo
    this.bannerSvc.innerHtml = this.createBanner(this.pSvc.patientInfo);
    // 要清空
    this.initDataVariable();
    // 切換至 表單內容頁籤
    this.onTabChange(1);
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

  private createBanner(patientInfo: any) {

    let data = patientInfo;
    let name = data.ptName;
    let chartNo = data.chartNo;
    let sex = data.sex;
    let birthday: Date = new Date(data.birthday);
    let age = data.age;

    let banner: string = "";
    banner = `<span><font size="5">${name} ${chartNo} ${sex} ${birthday.toDateTimeString('YYYY-MM-DD')} (${age})</font></span>`;
    return banner;
  }
}
