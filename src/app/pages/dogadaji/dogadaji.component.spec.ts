import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DogadajiComponent } from './dogadaji.component';

describe('Dogadaji', () => {
  let component: DogadajiComponent;
  let fixture: ComponentFixture<DogadajiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DogadajiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DogadajiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
