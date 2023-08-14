import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';

import { Form2ReplierComponent } from './form2-replier.component';

// primeng
import { BlockUIModule } from 'primeng/blockui';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';

// qrCode
import { QrCodeModule } from 'ng-qrcode';

// formio
import { FormioModule, Templates } from '@formio/angular';
import { Formio } from 'formiojs';
(Formio as any).cdn.setBaseUrl('/web/cdn/formio');
Templates.framework = 'bootstrap3';

//自定義pipe
import { FormTypePipe } from '../pipe/form-type.pipe';
import { FormReplyRulePipe } from '../pipe/form-reply-rule.pipe';
import { FormTeplyTranStatusPipe } from '../pipe/form-reply-tran-status.pipe';

@NgModule({
  declarations: [
    Form2ReplierComponent,
    FormTypePipe,
    FormReplyRulePipe,
    FormTeplyTranStatusPipe,
  ],
  imports: [
    CommonModule,
    FormsModule,

    // primeng
    BlockUIModule,
    ButtonModule,
    CalendarModule,
    DialogModule,
    DropdownModule,
    ProgressBarModule,
    ProgressSpinnerModule,
    RadioButtonModule,
    ScrollPanelModule,
    TableModule,
    TabViewModule,
    TagModule,
    ToastModule,
    ToolbarModule,

    // qrCode
    QrCodeModule,

    // formIo
    FormioModule,

  ],
  exports: [Form2ReplierComponent],
})
export class Form2ReplierModule {}
