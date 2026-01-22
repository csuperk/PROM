import { TestBed } from '@angular/core/testing';

import { Form2AuthService } from './form2-auth.service';

describe('Form2AuthService', () => {
  let service: Form2AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Form2AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
