import { Component, OnInit, Input, EventEmitter } from '@angular/core';
import { GeneralFormReplyService } from './general-form-reply.service';
import { MessageService } from 'primeng/api';
import {
  TmplInfo,
  FormReplyInfo,
  FormReplyListReq,
  FormReplyList,
} from '@cmuh-viewmodel/form-master';
import { ActivatedRoute, Router } from '@angular/router';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

@Component({
  selector: 'general-form-reply',
  templateUrl: './general-form-reply.component.html',
  styleUrls: ['./general-form-reply.component.scss'],
})
export class GeneralFormReplyComponent implements OnInit {
  @Input()
  public tmplNo: number;

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

  /**工具列變數 */
  // 工具列左側按鈕
  public toolBarButtons = [
    {
      title: '新建',
      class: '',
      icon: 'pi pi-plus-circle',
      disable: false,
      onClick: (event) => this.onNewReplyClick(),
    },
    {
      title: '暫存',
      class: 'p-button-secondary',
      icon: 'pi pi-inbox',
      disable: true,
      onClick: (event) => this.onTempReplyClick(),
    },
    {
      title: '繳交',
      class: 'p-button-success',
      icon: 'pi pi-send',
      disable: true,
      onClick: (event) => this.onSaveReplyClick(),
    },
    {
      title: '放棄',
      class: 'p-button-warning',
      icon: 'pi pi-times',
      disable: true,
      onClick: (event) => this.onCancelReplyClick(),
    },
    {
      title: '撤回',
      class: 'p-button-danger',
      icon: 'pi pi-trash',
      disable: true,
      onClick: (event) => this.onWithdrawClick(),
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

  constructor(
    private generalFormReplyService: GeneralFormReplyService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 如果是透過input進來的，就不用再取url的連結
    this.tmplNo = isNaN(parseInt(this.route.snapshot.paramMap.get('tmplNo')))
      ? this.tmplNo
      : parseInt(this.route.snapshot.paramMap.get('tmplNo'));
    this.getFormTmplInfo(this.tmplNo);
    this.initReplyListReq();
    // formIo官方 refresh寫法
    this.triggerRefresh = new EventEmitter();
  }

  ngOnChanges(): void {
    this.getFormTmplInfo(this.tmplNo);
    this.initReplyListReq();
  }

  /**
   * 因需要等待api先取回emp的idNo，所以增加此method
   */
  public async initReplyListReq() {
    let empInfo = await this.generalFormReplyService
      .getEmpInfo(this.generalFormReplyService.userInfoService.userNo)
      .toPromise();
    this.generalFormReplyService.userInfoService = {
      ...this.generalFormReplyService.userInfoService,
      ...empInfo[0],
    };
    this.getFormReplyList(this.tmplNo);
  }

  /**
   * 新建回覆內容
   */
  private onNewReplyClick() {
    this.initDataVariable();
    this.onTabChange(1);
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
   * 放棄填寫
   */
  private onCancelReplyClick() {
    this.showConfirm(
      404,
      '確定放棄填寫?',
      '本次填寫資料將不存儲',
      'confirmMessage'
    );
  }

  /**
   * 撤銷回覆
   */
  private onWithdrawClick() {
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
  }

  /**
   * 取得最後submit的資料
   */
  private getSubmitData() {
    this.submitData = {};
    this.submitData.data = JSON.parse(JSON.stringify(this.tempSubmitData));
  }

  /**
   * 取得formIoTmpl
   * @param tmplNo
   */
  private getFormTmplInfo(tmplNo: number) {
    this.generalFormReplyService.getFormTmplInfo(tmplNo).subscribe(
      (res) => {
        this.tmplInfo = res;
      },
      (err) => {
        this.showToastMsg(500, '取得填寫表單樣板錯誤');
      }
    );
  }

  /**
   * 取得回覆清單
   */
  private getFormReplyList(tmplNo: number) {
    let params: FormReplyListReq = new FormReplyListReq();
    params.tmplNo = tmplNo;
    params.replyUser = this.generalFormReplyService.userInfoService.idNo;
    this.generalFormReplyService.getFormReplyList(params).subscribe(
      (res) => {
        this.replyList = res;
        this.btnEmpower(this.tabIndex);
      },
      (err) => {
        this.showToastMsg(500, '取得填寫紀錄清單失敗');
        this.displayProgress = false;
      }
    );
  }

  /**
   * 儲存回覆內容到DB
   */
  private setFormReply() {
    this.generalFormReplyService.setFormReply(this.formReplyInfo).subscribe(
      (res) => {
        this.showToastMsg(200, '儲存成功');
        // 如果是按下繳交後，回到填寫紀錄清單
        if (this.formReplyInfo.tranStatus === 30) {
          this.onConfirm();
        }

        this.displayProgress = false;
      },
      (err) => {
        this.showToastMsg(500, '儲存失敗');
        this.displayProgress = false;
      }
    );
  }

  /**
   * 設定回覆的內容資料
   * @param tranStatus
   */
  private setReplyData(tranStatus: number = 20) {
    this.getSubmitData();
    this.formReplyInfo.replyRule = this.tmplInfo.replyRule;
    this.formReplyInfo.replyDesc = this.submitData.data;
    this.formReplyInfo.replyUser =
      this.generalFormReplyService.userInfoService.idNo;
    this.formReplyInfo.tmplNo = this.tmplInfo.tmplNo;
    this.formReplyInfo.systemUser =
      this.generalFormReplyService.userInfoService.userNo;
    this.formReplyInfo.tranStatus = tranStatus;
    this.formReplyInfo.replyTime = new Date();
  }

  /**
   * 切換頁籤
   * @param index
   */
  public onTabChange(index: number) {
    // 如果頁籤回到填寫紀錄頁面
    if (index === 0) {
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
      this.toolBarButtons[0].disable = false;
      // 如果是正式表單，且限填一份，且已有回覆，則將新建按鈕取消賦能
      if (
        this.tmplInfo.replyRule >= 10 &&
        this.tmplInfo.replyRule <= 11 &&
        this.tmplInfo.tmplNo > 0 &&
        this.replyList.length !== 0
      ) {
        this.toolBarButtons[0].disable = true;
      }
      // 回到頁籤0時，針對form的功能全部取消
      this.toolBarButtons.forEach((element, index) => {
        if (index != 0) {
          element.disable = true;
        }
      });
    }
    // 如果頁籤是1
    if (index === 1) {
      this.toolBarButtons.forEach((element, index) => {
        if (index != 0) {
          element.disable = false;
        } else {
          element.disable = true;
        }
      });
    }
  }

  private;

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
    key: string = 'confirmMessage'
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
    this.onTabChange(0);
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
    this.setReplyData(40);
    this.setFormReply();
  }

  /**
   * 取得回覆資料
   * @param replyInfo
   */
  public onReplyListClick(replyInfo: FormReplyInfo) {
    this.generalFormReplyService.getFormReplyInfo(replyInfo.replyNo).subscribe(
      (res) => {
        this.formReplyInfo = res;
        // formIo官方寫法，將取回來的填寫值塞回form Rander中
        this.triggerRefresh.emit({
          form: this.tmplInfo.formTmpl,
          submission: {
            data: res.replyDesc,
          },
        });
        this.onTabChange(1);
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
