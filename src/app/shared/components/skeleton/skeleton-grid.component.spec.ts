import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonGridComponent } from './skeleton-grid.component';

describe('SkeletonGridComponent', () => {
  let component: SkeletonGridComponent;
  let fixture: ComponentFixture<SkeletonGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default layout to products', () => {
    expect(component.layout()).toBe('products');
  });

  it('should default count to 2', () => {
    expect(component.count()).toBe(2);
  });

  it('should render correct grid class', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.skeleton-grid--products')).toBeTruthy();
  });

  it('should accept stat layout', () => {
    fixture.componentRef.setInput('layout', 'stats');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.skeleton-grid--stats')).toBeTruthy();
  });

  it('should render count children', () => {
    fixture.componentRef.setInput('count', 3);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('app-skeleton').length).toBe(3);
  });
});
