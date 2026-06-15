import { TestBed } from '@angular/core/testing';

import { ModulesHttpService } from './modules-http.service';

describe('ModulesHttpService', () => {
  let service: ModulesHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModulesHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
