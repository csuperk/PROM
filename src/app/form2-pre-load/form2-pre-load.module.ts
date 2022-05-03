import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { ToolbarModule } from 'primeng/toolbar';

import { Form2PreLoadComponent } from './form2-pre-load.component';
import { Form2PreLoadDirective } from './form2-pre-load.directive';

@NgModule({
  declarations: [Form2PreLoadComponent, Form2PreLoadDirective],
  imports: [
    CommonModule,
    FormsModule,

    ButtonModule,
    DropdownModule,
    ToolbarModule,
  ],
  exports: [Form2PreLoadComponent]
})
export class Form2PreLoadModule { }
