import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetaljiProgramaComponent } from './detaljiprograma.component';

describe('DetaljiPrograma', () => {
  let component: DetaljiProgramaComponent;
  let fixture: ComponentFixture<DetaljiProgramaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetaljiProgramaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetaljiProgramaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
