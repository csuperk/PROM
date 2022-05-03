import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[appForm2PreLoad]'
})
export class Form2PreLoadDirective {

  constructor(public templateRef: TemplateRef<any>) {
  }

}
