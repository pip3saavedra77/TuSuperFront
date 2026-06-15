import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  let component: SkeletonComponent;
  let fixture: ComponentFixture<SkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default variant to card', () => {
    expect(component.variant()).toBe('card');
  });

  it('should render with default class', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.skeleton--card')).toBeTruthy();
  });

  it('should accept text variant', () => {
    fixture.componentRef.setInput('variant', 'text');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.skeleton--text')).toBeTruthy();
  });
});
