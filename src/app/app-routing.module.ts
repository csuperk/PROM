import { GeneralFormReplyComponent } from './general-form-reply/general-form-reply.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'general-form-reply', pathMatch: 'full' },
  {
    path: 'general-form-reply',
    component: GeneralFormReplyComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
