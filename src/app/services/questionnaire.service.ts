import { Injectable } from '@angular/core';
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

  constructor(private fhirService: FhirService) {}

  /**
   * 從 FHIR 伺服器載入問卷
   */
  async loadQuestionnaire(questionnaireId: string): Promise<Questionnaire | null> {
    try {
      const client = this.fhirService.getFhirClient();
      if (client) {
        const questionnaire = await client.request(`Questionnaire/${questionnaireId}`);
        this.questionnaireSubject.next(questionnaire);
        return questionnaire;
      } else {
        // 使用本地 JSON 檔案作為後備
        return this.loadLocalQuestionnaire();
      }
    } catch (error) {
      console.error('載入問卷失敗:', error);
      return this.loadLocalQuestionnaire();
    }
  }

  /**
   * 載入本地問卷檔案（後備方案）
   */
  private async loadLocalQuestionnaire(): Promise<Questionnaire | null> {
    try {
      // 這裡可以從 assets 載入本地 JSON
      const response = await fetch('./assets/questionnaire.json');
      const questionnaire = await response.json();
      this.questionnaireSubject.next(questionnaire);
      return questionnaire;
    } catch (error) {
      console.error('載入本地問卷失敗:', error);
      return null;
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
