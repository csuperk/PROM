import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formReplyRule',
})
export class FormReplyRulePipe implements PipeTransform {
  transform(value: number): string {
    let reault = '無填答規範';
    switch (value) {
      case 10:
        reault = '繳交後不可異動';
        break;
      case 11:
        reault = '繳交後可異動';
        break;
      case 20:
        reault = '繳交後不可異動';
        break;
      case 21:
        reault = '繳交後可異動';
        break;

      default:
        break;
    }
    return reault;
  }
}
