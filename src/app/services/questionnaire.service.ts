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
      status: 'completed',
      authored: new Date().toISOString(),
      questionnaire: questionnaire.url,
      item: []
    };

    if (patientReference) {
      response.subject = { reference: patientReference };
    }

    // 遞迴處理問卷項目
    response.item = this.processQuestionnaireItems(questionnaire.item, formioData);

    this.responseSubject.next(response);
    return response;
  }

  /**
   * 遞迴處理問卷項目
   */
  private processQuestionnaireItems(items: QuestionnaireItem[], formioData: any): QuestionnaireResponseItem[] {
    return items.map(item => {
      const responseItem: QuestionnaireResponseItem = {
        linkId: item.linkId,
        text: item.text
      };

      // 處理群組項目
      if (item.item) {
        responseItem.item = this.processQuestionnaireItems(item.item, formioData);
      }
      // 處理有答案的項目
      else if (formioData[item.linkId] !== undefined) {
        const value = formioData[item.linkId];
        responseItem.answer = [this.convertValueToAnswer(value, item.type)];
      }

      return responseItem;
    });
  }

  /**
   * 將值轉換為適當的 FHIR 答案格式
   */
  private convertValueToAnswer(value: any, type: string): Answer {
    switch (type) {
      case 'string':
        return { valueString: String(value) };
      case 'integer':
        return { valueInteger: parseInt(value) };
      case 'decimal':
        return { valueDecimal: parseFloat(value) };
      case 'choice':
        // 假設選擇題的值是數字（如評分）
        return { valueInteger: parseInt(value) };
      default:
        return { valueString: String(value) };
    }
  }

  /**
   * 計算問卷分數並產生 Observation
   */
  calculateScore(response: QuestionnaireResponse): Observation {
    let totalScore = 0;
    let suicideScore = 0;

    // 計算前5題分數（mood-1 到 mood-5）
    const moodItems = response.item.filter(item =>
      item.linkId.startsWith('mood-') &&
      ['mood-1', 'mood-2', 'mood-3', 'mood-4', 'mood-5'].includes(item.linkId)
    );

    moodItems.forEach(item => {
      if (item.answer && item.answer[0]?.valueInteger !== undefined) {
        totalScore += item.answer[0].valueInteger;
      }
    });

    // 檢查自殺意念題目（mood-6）
    const suicideItem = response.item.find(item => item.linkId === 'mood-6');
    if (suicideItem?.answer && suicideItem.answer[0]?.valueInteger !== undefined) {
      suicideScore = suicideItem.answer[0].valueInteger;
    }

    const observation: Observation = {
      resourceType: 'Observation',
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
      note: [{
        text: this.getScoreInterpretation(totalScore, suicideScore)
      }]
    };

    if (response.subject) {
      observation.subject = response.subject;
    }

    if (response.id) {
      observation.derivedFrom = [{ reference: `QuestionnaireResponse/${response.id}` }];
    }

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
