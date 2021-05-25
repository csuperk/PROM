import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formType',
})
export class FormTypePipe implements PipeTransform {
  transform(value: number): string {
    return value < 0 ? '測試表單' : '正式表單';
  }
}
