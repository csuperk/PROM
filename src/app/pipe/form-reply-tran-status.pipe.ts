import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formTeplyTranStatus',
})
export class FormTeplyTranStatusPipe implements PipeTransform {
  transform(value: number): string {
    let reault = '無';
    switch (value) {
      case 10:
        reault = '尚未回覆，預取回覆鍵值';
        break;
      case 20:
        reault = '暫存回覆';
        break;
      case 30:
        reault = '繳交回覆，但權責單位尚未收件';
        break;
      case 40:
        reault = '撤銷回覆';
        break;
      case 50:
        reault = '已經收件';
        break;
      case 60:
        reault = '處理完成';
        break;
      case 80:
        reault = '作廢回覆';
        break;

      default:
        break;
    }
    return reault;
  }
}
