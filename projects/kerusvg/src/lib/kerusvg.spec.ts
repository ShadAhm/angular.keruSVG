import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Kerusvg } from './kerusvg';

describe('Kerusvg', () => {
  let component: Kerusvg;
  let fixture: ComponentFixture<Kerusvg>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Kerusvg],
    }).compileComponents();

    fixture = TestBed.createComponent(Kerusvg);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
