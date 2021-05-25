import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { GeneralFormReplyRoutingModule } from './general-form-reply-routing.module';
import { GeneralFormReplyComponent } from './general-form-reply.component';

// primeng
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BlockUIModule } from 'primeng/blockui';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ChipModule } from 'primeng/chip';

// formio
import { FormioModule } from '@formio/angular';

//自定義pipe
import { FormTypePipe } from '../pipe/form-type.pipe';
import { FormReplyRulePipe } from '../pipe/form-reply-rule.pipe';
import { FormTeplyTranStatusPipe } from '../pipe/form-reply-tran-status.pipe';

@NgModule({
  declarations: [
    GeneralFormReplyComponent,
    FormTypePipe,
    FormReplyRulePipe,
    FormTeplyTranStatusPipe,
  ],
  imports: [
    CommonModule,
    GeneralFormReplyRoutingModule,
    FormsModule,

    // primeng
    ToolbarModule,
    ButtonModule,
    TabViewModule,
    TableModule,
    ProgressBarModule,
    ToastModule,
    ProgressSpinnerModule,
    BlockUIModule,
    ScrollPanelModule,
    ChipModule,

    // formIo
    FormioModule,
  ],
  exports: [GeneralFormReplyComponent],
})
export class GeneralFormReplyModule {}
