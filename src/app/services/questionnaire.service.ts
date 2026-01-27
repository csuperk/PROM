import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { FhirService } from './fhir.service';

// FHIR 問卷相關介面
export interface Questionnaire {
  resourceType: 'Questionnaire';
  id: string;
  url: string;
  title: string;
  status: string;
  item: QuestionnaireItem[];
}

export interface QuestionnaireItem {
  linkId: string;
  text: string;
  type: string;
  answerOption?: AnswerOption[];
  item?: QuestionnaireItem[];
  required?: boolean;
}

export interface AnswerOption {
  valueCoding?: {
    system: string;
    code: string;
    display: string;
  };
  valueInteger?: number;
}

export interface QuestionnaireResponse {
  resourceType: 'QuestionnaireResponse';
  id?: string;
  meta?: {
    profile?: string[];
  };
  status: 'completed' | 'in-progress';
  authored: string;
  questionnaire: string;
  subject?: { reference: string };
  item: QuestionnaireResponseItem[];
}

export interface QuestionnaireResponseItem {
  linkId: string;
  text?: string;
  answer?: Answer[];
  item?: QuestionnaireResponseItem[];
}

export interface Answer {
  valueString?: string;
  valueInteger?: number;
  valueDecimal?: number;
  valueCoding?: {
    system: string;
    code: string;
    display: string;
    extension?: {
      url: string;
      valueDecimal: number;
    }[];
  };
}

export interface Observation {
  resourceType: 'Observation';
  id?: string;
  status: 'final';
  category: any[];
  code: any;
  subject?: { reference: string };
  effectiveDateTime: string;
  valueQuantity: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  method: { text: string };
  derivedFrom?: { reference: string }[];
  note?: { text: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class QuestionnaireService {

  private questionnaireSubject = new BehaviorSubject<Questionnaire | null>(null);
  private responseSubject = new BehaviorSubject<QuestionnaireResponse | null>(null);
  private observationSubject = new BehaviorSubject<Observation | null>(null);

  public questionnaire$ = this.questionnaireSubject.asObservable();
  public response$ = this.responseSubject.asObservable();
  public observation$ = this.observationSubject.asObservable();

  constructor(
    private fhirService: FhirService,
    private http: HttpClient
  ) {}

  /**
   * 從 FHIR 伺服器載入問卷
   */
  async loadQuestionnaire(questionnaireId: string): Promise<Questionnaire | null> {
    console.log('開始載入 FHIR 問卷:', questionnaireId);

    try {
      const client = this.fhirService.getFhirClient();

      if (!client) {
        console.warn('FHIR Client 尚未初始化，等待初始化完成...');
        // 等待 FHIR Client 初始化
        await this.waitForFhirClient();
        const retryClient = this.fhirService.getFhirClient();

        if (!retryClient) {
          throw new Error('FHIR Client 初始化失敗');
        }

        const questionnaire = await retryClient.request(`Questionnaire/${questionnaireId}`);
        console.log('從 FHIR 伺服器成功載入問卷:', questionnaire.title);
        this.questionnaireSubject.next(questionnaire);
        return questionnaire;
      }

      // 直接使用已初始化的 client
      const questionnaire = await client.request(`Questionnaire/${questionnaireId}`);
      console.log('從 FHIR 伺服器成功載入問卷:', questionnaire.title);
      this.questionnaireSubject.next(questionnaire);
      return questionnaire;

    } catch (error) {
      console.error('從 FHIR 伺服器載入問卷失敗:', error);

      // 如果是網路錯誤或伺服器錯誤，使用本地檔案作為後備
      if (this.shouldUseFallback(error)) {
        console.log('使用本地問卷檔案作為後備');
        return this.loadLocalQuestionnaire();
      } else {
        // 其他錯誤直接拋出
        throw error;
      }
    }
  }

  /**
   * 等待 FHIR Client 初始化完成
   */
  private async waitForFhirClient(maxWait: number = 5000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      if (this.fhirService.getFhirClient()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error('等待 FHIR Client 初始化超時');
  }

  /**
   * 判斷是否應該使用後備方案
   */
  private shouldUseFallback(error: any): boolean {
    // 如果是網路錯誤、404、500 等，使用後備方案
    const errorMessage = error?.message || '';
    const isNetworkError = errorMessage.includes('fetch') ||
                          errorMessage.includes('network') ||
                          errorMessage.includes('ECONNREFUSED');

    const isServerError = error?.status >= 500 || error?.status === 404;

    return isNetworkError || isServerError;
  }

  /**
   * 載入本地問卷檔案（後備方案）
   */
  private async loadLocalQuestionnaire(): Promise<Questionnaire | null> {
    console.log('從本地檔案載入問卷作為後備方案');
    try {
      // 從 questionnaires 目錄載入 FHIR 問卷
      const questionnaire = await this.http.get<Questionnaire>('assets/questionnaires/questionnaire.json').toPromise();
      console.log('本地問卷載入成功:', questionnaire?.title || '未知問卷');
      if (questionnaire) {
        this.questionnaireSubject.next(questionnaire);
      }
      return questionnaire || null;
    } catch (error) {
      console.error('從 questionnaires 目錄載入失敗，嘗試舊版路徑:', error);

      try {
        // 嘗試舊版路徑（用於向後相容）
        const questionnaire = await this.http.get<Questionnaire>('assets/questionnaire.json').toPromise();
        console.log('從舊版路徑載入問卷成功:', questionnaire?.title || '未知問卷');
        if (questionnaire) {
          this.questionnaireSubject.next(questionnaire);
        }
        return questionnaire || null;
      } catch (legacyError) {
        console.error('所有本地路徑都載入失敗:', legacyError);
        return null;
      }
    }
  }

  /**
   * 將 Form.io 提交結果轉換為 FHIR QuestionnaireResponse
   */
  convertFormioToQuestionnaireResponse(
    formioData: any,
    questionnaire: Questionnaire,
    patientReference?: string
  ): QuestionnaireResponse {
    const response: QuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      id: '699850', // 使用範例中的固定ID
      meta: {
        profile: [
          "http://hl7.org/fhir/StructureDefinition/QuestionnaireResponse"
        ]
      },
      status: 'completed',
      authored: new Date().toISOString(),
      questionnaire: "https://thas.mohw.gov.tw/v/r4/fhir/Questionnaire/2c98768c-26a0-4bf5-903e-4f6151ca31b9|1.0.0",
      item: [],
      subject: {
        reference: patientReference || "Patient/273fc652-8b48-48ac-b627-10064beffc6f"
      }
    };

    // 處理病患基本資料
    const patientInfoItems = this.createPatientInfoItems(formioData);
    if (patientInfoItems.length > 0) {
      response.item.push({
        linkId: "patient_info",
        text: "病患基本資料",
        item: patientInfoItems
      });
    }

    // 處理心情問卷項目
    const moodItems = this.createMoodItems(formioData);
    response.item.push(...moodItems);

    this.responseSubject.next(response);
    return response;
  }

  /**
   * 創建病患基本資料項目
   */
  private createPatientInfoItems(formioData: any): QuestionnaireResponseItem[] {
    const items: QuestionnaireResponseItem[] = [];

    if (formioData.patient_name) {
      items.push({
        linkId: "patient_name",
        text: "姓名",
        answer: [{ valueString: formioData.patient_name }]
      });
    }

    if (formioData.patient_age) {
      items.push({
        linkId: "patient_age",
        text: "年齡",
        answer: [{ valueInteger: parseInt(formioData.patient_age) }]
      });
    }

    if (formioData.patient_weight) {
      items.push({
        linkId: "patient_weight",
        text: "體重 (kg)",
        answer: [{ valueDecimal: parseFloat(formioData.patient_weight) }]
      });
    }

    if (formioData.patient_height) {
      items.push({
        linkId: "patient_height",
        text: "身高 (cm)",
        answer: [{ valueDecimal: parseFloat(formioData.patient_height) }]
      });
    }

    return items;
  }

  /**
   * 創建心情問卷項目
   */
  private createMoodItems(formioData: any): QuestionnaireResponseItem[] {
    const moodQuestions = [
      { key: 'mood_1', text: '1. 睡眠困難，譬如難以入睡、易醒或早醒' },
      { key: 'mood_2', text: '2. 感覺緊張或不安' },
      { key: 'mood_3', text: '3. 容易苦惱或動怒' },
      { key: 'mood_4', text: '4. 感覺憂鬱、心情低落' },
      { key: 'mood_5', text: '5. 覺得比不上別人' },
      { key: 'mood_6', text: '★ 有自殺的想法' }
    ];

    const items: QuestionnaireResponseItem[] = [];

    moodQuestions.forEach(question => {
      const value = formioData[question.key];
      if (value !== undefined && value !== null) {
        const item: QuestionnaireResponseItem = {
          linkId: question.key,
          text: question.text,
          answer: [this.createMoodAnswer(value)]
        };
        items.push(item);
      }
    });

    return items;
  }

  /**
   * 創建心情問卷答案（使用 valueCoding 格式）
   */
  private createMoodAnswer(value: number): any {
    const answerMappings = {
      0: { code: "LA6568-5", display: "Not at all", weight: 0 },
      1: { code: "LA13940-4", display: "A little", weight: 1 },
      2: { code: "LA28439-0", display: "Rather", weight: 2 },
      3: { code: "LA15550-9", display: "Much", weight: 3 }
    };

    const mapping = answerMappings[value as keyof typeof answerMappings] || answerMappings[0];

    return {
      valueCoding: {
        system: "http://loinc.org",
        code: mapping.code,
        display: mapping.display,
        extension: [{
          url: "http://hl7.org/fhir/StructureDefinition/itemWeight",
          valueDecimal: mapping.weight
        }]
      }
    };
  }

  /**
   * 將值轉換為適當的 FHIR 答案格式
   */
  /**
   * 計算問卷分數並產生 Observation
   */
  calculateScore(response: QuestionnaireResponse): Observation {
    let totalScore = 0;
    let suicideScore = 0;

    // 計算前5題分數（mood_1 到 mood_5），使用 itemWeight
    const moodItems = response.item.filter(item =>
      item.linkId.startsWith('mood_') &&
      ['mood_1', 'mood_2', 'mood_3', 'mood_4', 'mood_5'].includes(item.linkId)
    );

    moodItems.forEach(item => {
      if (item.answer && item.answer[0]?.valueCoding) {
        const coding = item.answer[0].valueCoding;
        if (coding.extension) {
          const weightExt = coding.extension.find(ext =>
            ext.url === "http://hl7.org/fhir/StructureDefinition/itemWeight"
          );
          if (weightExt?.valueDecimal !== undefined) {
            totalScore += weightExt.valueDecimal;
          }
        }
      }
    });

    // 檢查自殺意念題目（mood_6）
    const suicideItem = response.item.find(item => item.linkId === 'mood_6');
    if (suicideItem?.answer && suicideItem.answer[0]?.valueCoding) {
      const coding = suicideItem.answer[0].valueCoding;
      if (coding.extension) {
        const weightExt = coding.extension.find(ext =>
          ext.url === "http://hl7.org/fhir/StructureDefinition/itemWeight"
        );
        if (weightExt?.valueDecimal !== undefined) {
          suicideScore = weightExt.valueDecimal;
        }
      }
    }

    const observation: Observation = {
      resourceType: 'Observation',
      id: '699851', // 使用範例中的固定ID
      status: 'final',
      category: [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/observation-category",
          code: "survey",
          display: "Survey"
        }]
      }],
      code: {
        coding: [{
          system: "http://loinc.org",
          code: "84773-1",
          display: "Total score"
        }],
        text: "BSRS-5 總分"
      },
      subject: response.subject || { reference: "Patient/273fc652-8b48-48ac-b627-10064beffc6f" },
      effectiveDateTime: new Date().toISOString(),
      valueQuantity: {
        value: totalScore,
        unit: "score",
        system: "http://unitsofmeasure.org",
        code: "{score}"
      },
      method: {
        text: "Mood Thermometer (BSRS-5) scoring"
      },
      derivedFrom: [{
        reference: `QuestionnaireResponse/${response.id || '699850'}`
      }],
      note: [{
        text: this.getScoreInterpretation(totalScore, suicideScore)
      }]
    };

    this.observationSubject.next(observation);
    return observation;
  }

  /**
   * 取得分數解釋
   */
  private getScoreInterpretation(totalScore: number, suicideScore: number): string {
    let interpretation = '';

    if (totalScore <= 5) {
      interpretation = '一般正常範圍，表示身心適應狀況良好。';
    } else if (totalScore <= 9) {
      interpretation = '輕度情緒困擾，建議找家人或朋友談談。';
    } else if (totalScore <= 14) {
      interpretation = '中度情緒困擾，建議尋找紓壓管道或接受心理專業諮詢。';
    } else {
      interpretation = '重度情緒困擾，建議諮詢精神科醫師接受進一步評估。';
    }

    if (totalScore < 6 && suicideScore >= 2) {
      interpretation += ' 注意：雖然總分較低，但有自殺意念，建議接受精神科專業諮詢。';
    }

    return interpretation;
  }

  /**
   * 提交問卷回答到 FHIR 伺服器
   */
  async submitQuestionnaireResponse(response: QuestionnaireResponse): Promise<boolean> {
    try {
      const client = this.fhirService.getFhirClient();
      if (client) {
        const result = await client.create(response);
        console.log('問卷回答提交成功:', result);
        return true;
      }
      return false;
    } catch (error) {
      console.error('提交問卷回答失敗:', error);
      return false;
    }
  }

  /**
   * 提交觀察記錄到 FHIR 伺服器
   */
  async submitObservation(observation: Observation): Promise<boolean> {
    try {
      const client = this.fhirService.getFhirClient();
      if (client) {
        const result = await client.create(observation);
        console.log('觀察記錄提交成功:', result);
        return true;
      }
      return false;
    } catch (error) {
      console.error('提交觀察記錄失敗:', error);
      return false;
    }
  }

  /**
   * 取得目前的問卷
   */
  getCurrentQuestionnaire(): Questionnaire | null {
    return this.questionnaireSubject.value;
  }

  /**
   * 取得目前的問卷回答
   */
  getCurrentResponse(): QuestionnaireResponse | null {
    return this.responseSubject.value;
  }

  /**
   * 取得目前的觀察記錄
   */
  getCurrentObservation(): Observation | null {
    return this.observationSubject.value;
  }
}
