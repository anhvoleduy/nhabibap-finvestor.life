import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { BoardApiService } from './board-api.service';

const boardId = 'b1';
const catId = 'c1';
const assetId = 'a1';
const buyId = 'buy1';

describe('BoardApiService', () => {
  let service: BoardApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BoardApiService,
      ],
    });
    service = TestBed.inject(BoardApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('boards', () => {
    it('listBoards GETs /api/boards', () => {
      service.listBoards().subscribe();
      const req = httpMock.expectOne('/api/boards');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('getBoard GETs /api/boards/:id', () => {
      service.getBoard(boardId).subscribe();
      const req = httpMock.expectOne(`/api/boards/${boardId}`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('createBoard POSTs body to /api/boards', () => {
      const dto = { name: 'New' };
      service.createBoard(dto).subscribe();
      const req = httpMock.expectOne('/api/boards');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({});
    });

    it('updateBoard PATCHes /api/boards/:id with body', () => {
      const dto = { name: 'Renamed' };
      service.updateBoard(boardId, dto).subscribe();
      const req = httpMock.expectOne(`/api/boards/${boardId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(dto);
      req.flush({});
    });

    it('deleteBoard DELETEs /api/boards/:id', () => {
      service.deleteBoard(boardId).subscribe();
      const req = httpMock.expectOne(`/api/boards/${boardId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('addMember POSTs /api/boards/:id/members with body', () => {
      const dto = { email: 'u@e.com', role: 'EDITOR' as const };
      service.addMember(boardId, dto).subscribe();
      const req = httpMock.expectOne(`/api/boards/${boardId}/members`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({});
    });

    it('removeMember DELETEs /api/boards/:id/members/:userId', () => {
      service.removeMember(boardId, 'u2').subscribe();
      const req = httpMock.expectOne(`/api/boards/${boardId}/members/u2`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('categories + assets', () => {
    it('getCategories GETs /api/boards/:id/categories', () => {
      service.getCategories(boardId).subscribe();
      const req = httpMock.expectOne(`/api/boards/${boardId}/categories`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('createCategory POSTs body to /api/boards/:id/categories', () => {
      const dto = { type: 'GOLD' } as never;
      service.createCategory(boardId, dto).subscribe();
      const req = httpMock.expectOne(`/api/boards/${boardId}/categories`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({});
    });

    it('createAsset POSTs to /api/boards/:id/categories/:catId/assets', () => {
      const dto = { name: 'SJC' };
      service.createAsset(boardId, catId, dto).subscribe();
      const req = httpMock.expectOne(
        `/api/boards/${boardId}/categories/${catId}/assets`,
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({});
    });

    it('updateAsset PATCHes asset path', () => {
      const dto = { name: 'New' };
      service.updateAsset(boardId, catId, assetId, dto).subscribe();
      const req = httpMock.expectOne(
        `/api/boards/${boardId}/categories/${catId}/assets/${assetId}`,
      );
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(dto);
      req.flush({});
    });

    it('deleteAsset DELETEs asset path', () => {
      service.deleteAsset(boardId, catId, assetId).subscribe();
      const req = httpMock.expectOne(
        `/api/boards/${boardId}/categories/${catId}/assets/${assetId}`,
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('gold buys', () => {
    const base = `/api/boards/${boardId}/categories/${catId}/assets/${assetId}/gold-buys`;

    it('listGoldBuys GETs base', () => {
      service.listGoldBuys(boardId, catId, assetId).subscribe();
      const req = httpMock.expectOne(base);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('createGoldBuy POSTs base with body', () => {
      const dto = { buyDate: '2026-01-01', chiAmount: 1, amountVnd: 7000000 };
      service.createGoldBuy(boardId, catId, assetId, dto).subscribe();
      const req = httpMock.expectOne(base);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({});
    });

    it('updateGoldBuy PATCHes :buyId with body', () => {
      const dto = { amountVnd: 8000000 };
      service.updateGoldBuy(boardId, catId, assetId, buyId, dto).subscribe();
      const req = httpMock.expectOne(`${base}/${buyId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(dto);
      req.flush({});
    });

    it('deleteGoldBuy DELETEs :buyId', () => {
      service.deleteGoldBuy(boardId, catId, assetId, buyId).subscribe();
      const req = httpMock.expectOne(`${base}/${buyId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('crypto buys', () => {
    const base = `/api/boards/${boardId}/categories/${catId}/assets/${assetId}/crypto-buys`;

    it('listCryptoBuys GETs base', () => {
      service.listCryptoBuys(boardId, catId, assetId).subscribe();
      const req = httpMock.expectOne(base);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('createCryptoBuy POSTs base with body', () => {
      const dto = { buyDate: '2026-01-01', amountVnd: 5000000 };
      service.createCryptoBuy(boardId, catId, assetId, dto).subscribe();
      const req = httpMock.expectOne(base);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({});
    });

    it('updateCryptoBuy PATCHes :buyId with body', () => {
      const dto = { amountVnd: 6000000 };
      service.updateCryptoBuy(boardId, catId, assetId, buyId, dto).subscribe();
      const req = httpMock.expectOne(`${base}/${buyId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(dto);
      req.flush({});
    });

    it('deleteCryptoBuy DELETEs :buyId', () => {
      service.deleteCryptoBuy(boardId, catId, assetId, buyId).subscribe();
      const req = httpMock.expectOne(`${base}/${buyId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('entries + nav', () => {
    it('submitEntries POSTs /api/boards/:id/entries', () => {
      const dto = { date: '2026-01-01', entries: [] };
      service.submitEntries(boardId, dto).subscribe();
      const req = httpMock.expectOne(`/api/boards/${boardId}/entries`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({});
    });

    it('getLatestEntries GETs /api/boards/:id/entries/latest', () => {
      service.getLatestEntries(boardId).subscribe();
      const req = httpMock.expectOne(`/api/boards/${boardId}/entries/latest`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('getEntriesForDate GETs /api/boards/:id/entries with date param', () => {
      service.getEntriesForDate(boardId, '2026-01-01').subscribe();
      const req = httpMock.expectOne(
        (r) =>
          r.url === `/api/boards/${boardId}/entries` &&
          r.params.get('date') === '2026-01-01',
      );
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('getNav GETs /api/boards/:id/nav with no params when none provided', () => {
      service.getNav(boardId).subscribe();
      const req = httpMock.expectOne(
        (r) =>
          r.url === `/api/boards/${boardId}/nav` &&
          r.params.keys().length === 0,
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('getNav GETs with from/to/granularity params', () => {
      service
        .getNav(boardId, '2026-01-01', '2026-12-31', 'monthly')
        .subscribe();
      const req = httpMock.expectOne(
        (r) =>
          r.url === `/api/boards/${boardId}/nav` &&
          r.params.get('from') === '2026-01-01' &&
          r.params.get('to') === '2026-12-31' &&
          r.params.get('granularity') === 'monthly',
      );
      req.flush([]);
    });

    it('upsertManualNav POSTs body to /api/boards/:id/nav', () => {
      const dto = { date: '2026-01-01', totalValue: 1000 };
      service.upsertManualNav(boardId, dto).subscribe();
      const req = httpMock.expectOne(`/api/boards/${boardId}/nav`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({});
    });

    it('deleteNav DELETEs /api/boards/:id/nav/:snapshotId', () => {
      service.deleteNav(boardId, 'n1').subscribe();
      const req = httpMock.expectOne(`/api/boards/${boardId}/nav/n1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('cash flow', () => {
    it('listCashFlow GETs /api/boards/:id/cash-flow', () => {
      service.listCashFlow(boardId).subscribe();
      const req = httpMock.expectOne(`/api/boards/${boardId}/cash-flow`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('createCashFlow POSTs body', () => {
      const dto = {
        entryDate: '2026-01-01',
        label: 'salary',
        amount: 1000,
      } as never;
      service.createCashFlow(boardId, dto).subscribe();
      const req = httpMock.expectOne(`/api/boards/${boardId}/cash-flow`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({});
    });

    it('updateCashFlow PATCHes /api/boards/:id/cash-flow/:entryId', () => {
      const dto = { amount: 2000 };
      service.updateCashFlow(boardId, 'cf1', dto).subscribe();
      const req = httpMock.expectOne(`/api/boards/${boardId}/cash-flow/cf1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(dto);
      req.flush({});
    });

    it('deleteCashFlow DELETEs /api/boards/:id/cash-flow/:entryId', () => {
      service.deleteCashFlow(boardId, 'cf1').subscribe();
      const req = httpMock.expectOne(`/api/boards/${boardId}/cash-flow/cf1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('users', () => {
    it('searchUsers GETs /api/users/search with email param', () => {
      service.searchUsers('foo').subscribe();
      const req = httpMock.expectOne(
        (r) => r.url === '/api/users/search' && r.params.get('email') === 'foo',
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });
});
