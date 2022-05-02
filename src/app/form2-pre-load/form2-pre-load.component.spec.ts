import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Form2PreLoadComponent } from './form2-pre-load.component';

describe('Form2PreLoadComponent', () => {
  let component: Form2PreLoadComponent;
  let fixture: ComponentFixture<Form2PreLoadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Form2PreLoadComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Form2PreLoadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
