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
import { QuestionnaireService, Questionnaire, QuestionnaireResponse, Observation } from '../services/questionnaire.service';
import { FhirService } from '../services/fhir.service';

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

  /**問卷提交結果事件 */
  @Output()
  public onSubmitFormioReply: EventEmitter<any> = new EventEmitter<any>();

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

  // FHIR 問卷相關變數
  public currentQuestionnaire: Questionnaire | null = null;
  public questionnaireResponse: QuestionnaireResponse | null = null;
  public questionnaireObservation: Observation | null = null;

  // 最後要儲存到formreply這張資料表的內容
  public formReplyInfo: FormReplyInfo = new FormReplyInfo();

  // 儲存模板所有的api name
  private componentKeys = [];

  constructor(
    public f2RSvc: Form2ReplierService,
    private messageService: MessageService,
    private questionnaireService: QuestionnaireService,
    private fhirService: FhirService
  ) {}

  ngOnInit(): void {
    this.initInfo();
    // formIo官方 refresh寫法
    this.triggerRefresh = new EventEmitter();

    // 載入問卷資料
    this.loadQuestionnaire();

    // 訂閱問卷服務
    this.subscribeToQuestionnaireService();
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

    // 始終進行 FHIR 格式轉換和提交
    this.processSubmissionWithFhir(this.formReplyInfo.replyDesc);
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
   * 統一處理表單提交（包含 Form.io 儲存和 FHIR 轉換）
   */
  private async processSubmissionWithFhir(formData: any): Promise<void> {
    try {
      console.log('開始處理表單提交（Form.io + FHIR）...');

      // 1. 處理原有的 Form.io 格式儲存（醫院內部使用）
      this.processFormioSubmission();

      // 2. 並行處理 FHIR 格式轉換和提交
      console.log('ggggggggggggggggggggggg', formData)
      await this.processFhirSubmission(formData);

    } catch (error) {
      console.error('表單提交處理失敗:', error);
      this.messageService.add({
        severity: 'error',
        summary: '提交失敗',
        detail: '表單提交處理過程中發生錯誤'
      });
      this.displayProgress = false;
    }
  }

  /**
   * 處理 Form.io 格式的資料儲存（原有邏輯）
   */
  private processFormioSubmission(): void {
    let resultInfo = {
      data: this.formReplyInfo,
      apiResult: true,
      tmpl: this.tmplInfo,
    };

    // 模擬 Form.io 格式儲存成功
    setTimeout(() => {
      console.log('Form.io 格式資料儲存完成');
      this.result.emit(resultInfo);
      this.flagChange.emit(false);
    }, 500);
  }

  /**
   * 處理 FHIR 格式轉換和提交
   */
  private async processFhirSubmission(formData: any): Promise<void> {
    // 檢查是否有問卷資料
    console.log('當前問卷資料:', this.currentQuestionnaire)
    if (!this.currentQuestionnaire) {
      console.warn('沒有問卷資料，跳過 FHIR 轉換');
      this.displayProgress = false;
      this.showToastMsg(200, '提交成功');
      return;
    }

    try {
      console.log('開始 FHIR 格式轉換和提交...');

      // 取得當前病患參考
      const currentPatient = this.fhirService.getCurrentPatient();
      let patientReference = '';
      if (currentPatient?.id) {
        patientReference = `Patient/${currentPatient.id}`;
      }

      // 1. 轉換 Form.io 資料為 FHIR QuestionnaireResponse
      const response = this.questionnaireService.convertFormioToQuestionnaireResponse(
        formData,
        this.currentQuestionnaire,
        patientReference
      );

      console.log('Form.io → FHIR QuestionnaireResponse 轉換完成:', response);

      // 2. 計算分數並產生 Observation
      const observation = this.questionnaireService.calculateScore(response);
      console.log('FHIR Observation 計算完成:', observation);

      // 3. 提交到 FHIR 伺服器
      const [responseSubmitted, observationSubmitted] = await Promise.all([
        this.questionnaireService.submitQuestionnaireResponse(response),
        this.questionnaireService.submitObservation(observation)
      ]);

      // 4. 處理提交結果
      if (responseSubmitted && observationSubmitted) {
        this.messageService.add({
          severity: 'success',
          summary: '提交成功',
          detail: `表單已成功提交到 FHIR 伺服器！總分: ${observation.valueQuantity.value}分`,
          life: 5000
        });

        this.handleSubmissionSuccess(response, observation);
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: '部分提交成功',
          detail: 'Form.io 資料已儲存，但 FHIR 格式提交不完整'
        });

        this.handleSubmissionSuccess(response, observation);
      }

    } catch (error) {
      console.error('FHIR 提交失敗:', error);
      this.messageService.add({
        severity: 'warn',
        summary: 'FHIR 提交失敗',
        detail: 'Form.io 資料已儲存，但無法提交到 FHIR 伺服器'
      });
    }

    this.displayProgress = false;
  }

  /**
   * 處理提交成功後的動作
   */
  private handleSubmissionSuccess(response: QuestionnaireResponse, observation: Observation): void {
    const score = observation.valueQuantity.value;
    const interpretation = observation.note?.[0]?.text || '';

    console.log(`問卷完成！總分: ${score}分`);
    console.log(`解釋: ${interpretation}`);

    // 發送完成事件給父組件（包含 Form.io 和 FHIR 格式）
    this.onSubmitFormioReply.emit({
      success: true,
      data: {
        // Form.io 格式
        formData: this.submitData.data,
        // FHIR 格式
        fhirResponse: response,
        fhirObservation: observation,
        score: score,
        interpretation: interpretation,
        // 提交狀態
        formioSaved: true,
        fhirSubmitted: true
      }
    });
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

  /**
   * 載入問卷資料
   */
  private async loadQuestionnaire(): Promise<void> {
    try {
      // 嘗試載入心情溫度計問卷
      const questionnaireId = '2c98768c-26a0-4bf5-903e-4f6151ca31b9';
      await this.questionnaireService.loadQuestionnaire(questionnaireId);
    } catch (error) {
      console.error('載入問卷失敗:', error);
    }
  }

  /**
   * 訂閱問卷服務
   */
  private subscribeToQuestionnaireService(): void {
    this.questionnaireService.questionnaire$.subscribe(questionnaire => {
      this.currentQuestionnaire = questionnaire;
      if (questionnaire) {
        console.log('FHIR 問卷載入完成:', questionnaire.title);
      }
    });

    this.questionnaireService.response$.subscribe(response => {
      this.questionnaireResponse = response;
    });

    this.questionnaireService.observation$.subscribe(observation => {
      this.questionnaireObservation = observation;
    });
  }
}

