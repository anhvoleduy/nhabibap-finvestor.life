import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { CategoryType, NewsItemDto } from '@nhabibap-myportfolio/shared-types';
import { NewsSectionComponent } from './news-section.component';

function setup(type: CategoryType = CategoryType.GOLD) {
  TestBed.configureTestingModule({
    imports: [NewsSectionComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTranslateService(),
    ],
  });
  const fixture = TestBed.createComponent(NewsSectionComponent);
  fixture.componentRef.setInput('type', type);
  fixture.detectChanges();
  const httpMock = TestBed.inject(HttpTestingController);
  return { fixture, httpMock };
}

describe('NewsSectionComponent', () => {
  it('requests /api/news with the category type as a param', () => {
    const { httpMock } = setup(CategoryType.CRYPTO);
    const req = httpMock.expectOne((r) => r.url === '/api/news');
    expect(req.request.params.get('type')).toBe('CRYPTO');
    req.flush([]);
    httpMock.verify();
  });

  it('renders fetched headlines with source', async () => {
    const { fixture, httpMock } = setup();
    const items: NewsItemDto[] = [
      {
        title: 'Gold hits record',
        url: 'https://x/1',
        source: 'CafeF',
        publishedAt: null,
      },
    ];
    httpMock.expectOne((r) => r.url === '/api/news').flush(items);
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Gold hits record');
    expect(text).toContain('CafeF');
    const link = fixture.nativeElement.querySelector(
      '.news__link',
    ) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('https://x/1');
    expect(link.getAttribute('target')).toBe('_blank');
    httpMock.verify();
  });

  it('shows the empty hint when no news returned', async () => {
    const { fixture, httpMock } = setup();
    httpMock.expectOne((r) => r.url === '/api/news').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.news__list')).toBeNull();
    expect(fixture.nativeElement.querySelector('.news__hint')).not.toBeNull();
    httpMock.verify();
  });
});
