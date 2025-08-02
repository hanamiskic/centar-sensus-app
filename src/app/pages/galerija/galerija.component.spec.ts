import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalerijaComponent } from './galerija.component';

describe('Galerija', () => {
  let component: GalerijaComponent;
  let fixture: ComponentFixture<GalerijaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalerijaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GalerijaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
