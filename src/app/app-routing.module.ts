import { Form2ReplierComponent } from './form2-replier/form2-replier.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'form2-replier', pathMatch: 'full' },
  {
    path: 'form2-replier',
    component: Form2ReplierComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
