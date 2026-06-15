import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';

import { ModulesForm } from './modules-form';

describe('ModulesForm', () => {
  let component: ModulesForm;
  let fixture: ComponentFixture<ModulesForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModulesForm],
      providers: [
        provideHttpClient(),
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: MAT_DIALOG_DATA, useValue: null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ModulesForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
