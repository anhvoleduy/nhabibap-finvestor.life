import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { PriceQuoteDto } from '@nhabibap-myportfolio/shared-types';
import { PriceTickerComponent } from './price-ticker.component';

const quotes: PriceQuoteDto[] = [
  {
    symbol: 'BTC',
    label: 'Bitcoin',
    price: 59214,
    unit: 'USD',
    changePct: -0.92,
    source: 'CoinGecko',
    updatedAt: '2026-06-30T00:00:00.000Z',
  },
  {
    symbol: 'GOLD-SJC',
    label: 'Vàng SJC',
    price: 14700000,
    unit: 'VND/chỉ',
    changePct: null,
    source: 'PNJ',
    updatedAt: '2026-06-30T00:00:00.000Z',
  },
];

describe('PriceTickerComponent', () => {
  let fixture: ComponentFixture<PriceTickerComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceTickerComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(PriceTickerComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetches /api/prices and renders each quote', async () => {
    fixture.detectChanges();
    const req = httpMock.expectOne((r) => r.url === '/api/prices');
    req.flush(quotes);

    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Bitcoin');
    expect(text).toContain('Vàng SJC');
    // changePct present → a direction arrow icon is rendered (gold has none).
    const arrows = fixture.nativeElement.querySelectorAll('.ticker__arrow');
    expect(arrows.length).toBeGreaterThan(0);
  });

  it('renders nothing when the feed is empty', async () => {
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url === '/api/prices').flush([]);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ticker')).toBeNull();
  });
});
