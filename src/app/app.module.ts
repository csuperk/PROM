import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { MessagePopupModule, MessagePopupService } from '@cmuh/message-popup';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GeneralFormReplyModule } from './general-form-reply/general-form-reply.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    GeneralFormReplyModule,
    BrowserAnimationsModule,
    HttpClientModule,

    //cmuh
    MessagePopupModule
  ],
  providers: [MessagePopupService],
  bootstrap: [AppComponent],
})
export class AppModule {}
