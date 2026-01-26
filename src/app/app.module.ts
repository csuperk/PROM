import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { Form2ReplierModule } from './form2-replier/form2-replier.module';
import { FhirService } from './services/fhir.service';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    Form2ReplierModule,
    BrowserAnimationsModule,
    HttpClientModule
  ],
  providers: [FhirService],
  bootstrap: [AppComponent],
})
export class AppModule {}
