import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomTable } from './custom-table';

describe('CustomTable', () => {
  let component: CustomTable<any>;
  let fixture: ComponentFixture<CustomTable<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomTable],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomTable<any>);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
