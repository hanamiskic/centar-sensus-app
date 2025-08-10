import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetaljiDogadajaComponent } from './detaljidogadaja.component';

describe('Detaljidogadaja', () => {
  let component: DetaljiDogadajaComponent;
  let fixture: ComponentFixture<DetaljiDogadajaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetaljiDogadajaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetaljiDogadajaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
