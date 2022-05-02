import { TestBed } from '@angular/core/testing';

import { Form2PreLoadService } from './form2-pre-load.service';

describe('Form2PreLoadService', () => {
  let service: Form2PreLoadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Form2PreLoadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
