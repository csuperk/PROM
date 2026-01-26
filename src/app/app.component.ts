import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { FhirService, PatientData, MedicationData } from './services/fhir.service';

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
  public fhirError: string | null = null;
  public fhirLoading: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(private fhirService: FhirService) {}

  ngOnInit(): void {
    console.log('Form2 Replier Demo with Smart on FHIR 已啟動');

    // 訂閱 FHIR 資料
    this.subscribeToFhirData();
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
