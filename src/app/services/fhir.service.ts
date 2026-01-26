import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// 引入 fhirclient
declare var FHIR: any;

export interface PatientData {
  id?: string;
  name?: string;
  gender?: string;
  birthDate?: string;
  contact?: any[];
  address?: any[];
  rawData?: any;
}

export interface MedicationData {
  id?: string;
  medication?: string;
  dosage?: string;
  frequency?: string;
  rawData?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class FhirService {
  private patientSubject = new BehaviorSubject<PatientData | null>(null);
  private medicationsSubject = new BehaviorSubject<MedicationData | null>(null);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public patient$ = this.patientSubject.asObservable();
  public medications$ = this.medicationsSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  private fhirClient: any;

  constructor() {
    // 檢查是否有來自 Smart Launch 的 context
    this.checkSmartLaunchContext();

    // 載入 FHIR Client 腳本
    this.loadFhirClient();
  }

  /**
   * 檢查 Smart Launch context
   */
  private checkSmartLaunchContext(): void {
    try {
      const contextStr = sessionStorage.getItem('fhir-context');
      if (contextStr) {
        const context = JSON.parse(contextStr);
        console.log('發現 Smart Launch context:', context);

        if (context.launched) {
          console.log('此應用程式是從 Smart Launch 啟動的');
          // 可以在這裡設定特殊的行為標記
        }
      }
    } catch (e) {
      console.warn('讀取 Smart Launch context 失敗:', e);
    }
  }

  /**
   * 動態載入 FHIR Client
   */
  private loadFhirClient(): void {
    if (typeof FHIR !== 'undefined') {
      this.initializeFhirClient();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/fhirclient/build/fhir-client.js';
    script.onload = () => {
      this.initializeFhirClient();
    };
    script.onerror = () => {
      this.errorSubject.next('無法載入 FHIR Client 函式庫');
    };
    document.head.appendChild(script);
  }

  /**
   * 初始化 FHIR Client
   */
  private initializeFhirClient(): void {
    try {
      if (typeof FHIR !== 'undefined' && FHIR.oauth2) {
        FHIR.oauth2.ready().then((client: any) => {
          this.fhirClient = client;
          this.loadPatientData();
          this.loadMedicationData();
        }).catch((error: any) => {
          console.warn('Smart on FHIR 未初始化或不在 FHIR 環境中:', error);
          this.setMockData(); // 在非 FHIR 環境中使用模擬資料
        });
      } else {
        console.warn('FHIR Client 未載入');
        this.setMockData();
      }
    } catch (error) {
      console.error('FHIR Client 初始化錯誤:', error);
      this.setMockData();
    }
  }

  /**
   * 載入病患資料
   */
  private async loadPatientData(): Promise<void> {
    if (!this.fhirClient) {
      this.setMockData();
      return;
    }

    try {
      this.loadingSubject.next(true);
      const patient = await this.fhirClient.patient.read();

      const patientData: PatientData = {
        id: patient.id,
        name: this.extractPatientName(patient),
        gender: patient.gender,
        birthDate: patient.birthDate,
        contact: patient.telecom,
        address: patient.address,
        rawData: patient
      };

      this.patientSubject.next(patientData);
      this.errorSubject.next(null);
    } catch (error) {
      console.error('載入病患資料錯誤:', error);
      this.errorSubject.next('載入病患資料失敗');
      this.setMockData();
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * 載入藥物資料
   */
  private async loadMedicationData(): Promise<void> {
    if (!this.fhirClient) {
      return;
    }

    try {
      const data = await this.fhirClient.request(`/MedicationRequest?patient=${this.fhirClient.patient.id}`, {
        resolveReferences: ["medicationReference"],
        graph: true
      });

      if (data.entry && data.entry.length > 0) {
        const medicationData: MedicationData = {
          rawData: data.entry
        };
        this.medicationsSubject.next(medicationData);
      } else {
        this.medicationsSubject.next({ rawData: [] });
      }
    } catch (error) {
      console.error('載入藥物資料錯誤:', error);
      this.errorSubject.next('載入藥物資料失敗');
    }
  }

  /**
   * 提取病患姓名
   */
  private extractPatientName(patient: any): string {
    if (!patient.name || !patient.name.length) {
      return '未知姓名';
    }

    const name = patient.name[0];
    if (name.text) {
      return name.text;
    }

    const given = name.given ? name.given.join(' ') : '';
    const family = name.family || '';
    return `${given} ${family}`.trim() || '未知姓名';
  }

  /**
   * 設定模擬資料（用於非 FHIR 環境）
   */
  private setMockData(): void {
    const mockPatient: PatientData = {
      id: 'demo-patient-123',
      name: '王小明',
      gender: 'male',
      birthDate: '1990-01-01',
      contact: [
        {
          system: 'phone',
          value: '0912-345-678'
        }
      ],
      address: [
        {
          text: '台北市信義區信義路五段7號'
        }
      ],
      rawData: {
        resourceType: 'Patient',
        id: 'demo-patient-123',
        name: [{ text: '王小明' }],
        gender: 'male',
        birthDate: '1990-01-01'
      }
    };

    const mockMedications: MedicationData = {
      rawData: [
        {
          resource: {
            resourceType: 'MedicationRequest',
            id: 'demo-med-1',
            medicationCodeableConcept: {
              text: '阿斯匹靈 100mg'
            },
            dosageInstruction: [
              {
                text: '每日一次，餐後服用'
              }
            ]
          }
        }
      ]
    };

    this.patientSubject.next(mockPatient);
    this.medicationsSubject.next(mockMedications);
    console.log('使用模擬 FHIR 資料');
  }

  /**
   * 手動重新載入資料
   */
  public refreshData(): void {
    if (this.fhirClient) {
      this.loadPatientData();
      this.loadMedicationData();
    } else {
      this.initializeFhirClient();
    }
  }

  /**
   * 取得當前病患資料
   */
  public getCurrentPatient(): PatientData | null {
    return this.patientSubject.value;
  }

  /**
   * 取得當前藥物資料
   */
  public getCurrentMedications(): MedicationData | null {
    return this.medicationsSubject.value;
  }
}
