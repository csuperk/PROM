import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Form2ReplierComponent } from './form2-replier.component';

// primeng
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { MessageService } from 'primeng/api';

// formio
import { FormioModule } from '@formio/angular';

@NgModule({
  declarations: [
    Form2ReplierComponent
  ],
  imports: [
    CommonModule,
    FormsModule,

    // PrimeNG modules
    ButtonModule,
    DialogModule,
    ProgressSpinnerModule,
    TagModule,
    ToastModule,
    ToolbarModule,

    // FormIO
    FormioModule
  ],
  providers: [
    MessageService
  ],
  exports: [
    Form2ReplierComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Form2ReplierModule { }
