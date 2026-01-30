import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { FhirService, PatientData, MedicationData } from './services/fhir.service';
import { QuestionnaireService, QuestionnaireResponse, Observation } from './services/questionnaire.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Form2 Replier Demo with Smart on FHIR';

  // FHIR 相關資料
  public patientData: PatientData | null = null;
  public medicationData: MedicationData | null = null;
  public questionnaireResponseData: QuestionnaireResponse | null = null;
  public observationData: Observation | null = null;
  public fhirError: string | null = null;
  public fhirLoading: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private fhirService: FhirService,
    private questionnaireService: QuestionnaireService
  ) {}

  ngOnInit(): void {
    console.log('Form2 Replier Demo with Smart on FHIR 已啟動');

    // 檢查 URL 參數以確定是否為 Smart on FHIR 回調
    this.checkSmartOnFhirCallback();

    // 訂閱 FHIR 資料
    this.subscribeToFhirData();
  }

  /**
   * 檢查是否為 Smart Launch 模式
   */
  public isSmartLaunch(): boolean {
    // 檢查 sessionStorage 中是否有 Smart Launch context
    try {
      const contextStr = sessionStorage.getItem('fhir-context');
      if (contextStr) {
        const context = JSON.parse(contextStr);
        return context.launched === true;
      }
    } catch (e) {
      // ignore
    }

    // 檢查 URL 參數
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('code') && urlParams.has('state');
  }

  /**
   * 檢查是否為 Smart on FHIR 回調
   */
  private checkSmartOnFhirCallback(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      console.log('偵測到 Smart on FHIR 回調參數:', { code: code.substring(0, 20) + '...', state });
      console.log('等待 FHIR Client 處理授權回調...');

      // 清理 URL（移除授權參數）
      setTimeout(() => {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }, 2000); // 等待 FHIR Client 處理完成
    } else {
      console.log('一般頁面載入（非 Smart on FHIR 回調）');
    }
  }

  ngOnDestroy(): void {
    // 取消所有訂閱
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * 訂閱 FHIR 服務的資料流
   */
  private subscribeToFhirData(): void {
    // 訂閱病患資料
    this.subscriptions.push(
      this.fhirService.patient$.subscribe(patient => {
        this.patientData = patient;
        console.log('病患資料更新:', patient);
      })
    );

    // 訂閱藥物資料
    this.subscriptions.push(
      this.fhirService.medications$.subscribe(medications => {
        this.medicationData = medications;
        console.log('藥物資料更新:', medications);
      })
    );

    // 訂閱錯誤狀態
    this.subscriptions.push(
      this.fhirService.error$.subscribe(error => {
        this.fhirError = error;
        if (error) {
          console.error('FHIR 錯誤:', error);
        }
      })
    );

    // 訂閱載入狀態
    this.subscriptions.push(
      this.fhirService.loading$.subscribe(loading => {
        this.fhirLoading = loading;
      })
    );

    // 訂閱 QuestionnaireResponse 資料
    this.subscriptions.push(
      this.questionnaireService.response$.subscribe(response => {
        this.questionnaireResponseData = response;
        console.log('QuestionnaireResponse 資料更新:', response);
      })
    );

    // 訂閱 Observation 資料
    this.subscriptions.push(
      this.questionnaireService.observation$.subscribe(observation => {
        this.observationData = observation;
        console.log('Observation 資料更新:', observation);
      })
    );
  }

  /**
   * 重新載入 FHIR 資料
   */
  public refreshFhirData(): void {
    this.fhirService.refreshData();
  }

  /**
   * 表單提交結果處理
   * @param event 表單結果事件
   */
  onFormResult(event: any): void {
    console.log('表單提交結果:', event);
    if (event.apiResult) {
      console.log('表單提交成功');
      console.log('提交的數據:', event.data);

      // 可以在這裡將表單資料與病患資料結合
      if (this.patientData) {
        console.log('關聯的病患:', this.patientData);
        // 這裡可以實作將表單資料寫回 FHIR 伺服器的邏輯
      }
    } else {
      console.log('表單提交失敗');
    }
  }

  /**
   * 表單變更狀態處理
   * @param changed 是否有變更
   */
  onFormChange(changed: boolean): void {
    console.log('表單變更狀態:', changed ? '有變更' : '無變更');
  }

  /**
   * 取得病患顯示名稱
   */
  getPatientDisplayName(): string {
    return this.patientData?.name || '載入中...';
  }

  /**
   * 取得病患基本資訊摘要
   */
  getPatientSummary(): string {
    if (!this.patientData) {
      return '載入中...';
    }

    const name = this.patientData.name || '未知';
    const gender = this.patientData.gender === 'male' ? '男' : this.patientData.gender === 'female' ? '女' : '未知';
    const birthDate = this.patientData.birthDate || '未知';

    return `${name} | ${gender} | 生日: ${birthDate}`;
  }
}
