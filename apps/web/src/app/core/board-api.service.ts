import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  AddMemberDto,
  AssetCategoryDto,
  AssetEntryDto,
  BoardDto,
  BoardSummaryDto,
  CashFlowEntryDto,
  CreateAssetDto,
  CreateBoardDto,
  CreateCashFlowDto,
  CreateCategoryDto,
  CreateCryptoBuyDto,
  CreateGoldBuyDto,
  CryptoBuyDto,
  DailyEntriesDto,
  GoldBuyDto,
  UpdateCryptoBuyDto,
  UpdateGoldBuyDto,
  NavSnapshotDto,
  SubmitEntriesDto,
  UpsertNavSnapshotDto,
  UpdateAssetDto,
  UpdateBoardDto,
  UpdateCashFlowDto,
  UserDto,
} from '@nhabibap-myportfolio/shared-types';

@Injectable({ providedIn: 'root' })
export class BoardApiService {
  private readonly http = inject(HttpClient);

  // Boards
  listBoards() {
    return this.http.get<BoardSummaryDto[]>('/api/boards');
  }
  getBoard(id: string) {
    return this.http.get<BoardDto>(`/api/boards/${id}`);
  }
  createBoard(dto: CreateBoardDto) {
    return this.http.post<BoardDto>('/api/boards', dto);
  }
  updateBoard(id: string, dto: UpdateBoardDto) {
    return this.http.patch<BoardDto>(`/api/boards/${id}`, dto);
  }
  deleteBoard(id: string) {
    return this.http.delete<void>(`/api/boards/${id}`);
  }
  addMember(boardId: string, dto: AddMemberDto) {
    return this.http.post(`/api/boards/${boardId}/members`, dto);
  }
  removeMember(boardId: string, userId: string) {
    return this.http.delete(`/api/boards/${boardId}/members/${userId}`);
  }

  // Assets
  getCategories(boardId: string) {
    return this.http.get<AssetCategoryDto[]>(
      `/api/boards/${boardId}/categories`,
    );
  }
  createCategory(boardId: string, dto: CreateCategoryDto) {
    return this.http.post<AssetCategoryDto>(
      `/api/boards/${boardId}/categories`,
      dto,
    );
  }
  createAsset(boardId: string, catId: string, dto: CreateAssetDto) {
    return this.http.post(
      `/api/boards/${boardId}/categories/${catId}/assets`,
      dto,
    );
  }
  updateAsset(
    boardId: string,
    catId: string,
    assetId: string,
    dto: UpdateAssetDto,
  ) {
    return this.http.patch(
      `/api/boards/${boardId}/categories/${catId}/assets/${assetId}`,
      dto,
    );
  }
  deleteAsset(boardId: string, catId: string, assetId: string) {
    return this.http.delete(
      `/api/boards/${boardId}/categories/${catId}/assets/${assetId}`,
    );
  }

  // Gold buys
  listGoldBuys(boardId: string, catId: string, assetId: string) {
    return this.http.get<GoldBuyDto[]>(
      `/api/boards/${boardId}/categories/${catId}/assets/${assetId}/gold-buys`,
    );
  }
  createGoldBuy(
    boardId: string,
    catId: string,
    assetId: string,
    dto: CreateGoldBuyDto,
  ) {
    return this.http.post<GoldBuyDto>(
      `/api/boards/${boardId}/categories/${catId}/assets/${assetId}/gold-buys`,
      dto,
    );
  }
  updateGoldBuy(
    boardId: string,
    catId: string,
    assetId: string,
    buyId: string,
    dto: UpdateGoldBuyDto,
  ) {
    return this.http.patch<GoldBuyDto>(
      `/api/boards/${boardId}/categories/${catId}/assets/${assetId}/gold-buys/${buyId}`,
      dto,
    );
  }
  deleteGoldBuy(
    boardId: string,
    catId: string,
    assetId: string,
    buyId: string,
  ) {
    return this.http.delete<void>(
      `/api/boards/${boardId}/categories/${catId}/assets/${assetId}/gold-buys/${buyId}`,
    );
  }

  // Crypto buys
  listCryptoBuys(boardId: string, catId: string, assetId: string) {
    return this.http.get<CryptoBuyDto[]>(
      `/api/boards/${boardId}/categories/${catId}/assets/${assetId}/crypto-buys`,
    );
  }
  createCryptoBuy(
    boardId: string,
    catId: string,
    assetId: string,
    dto: CreateCryptoBuyDto,
  ) {
    return this.http.post<CryptoBuyDto>(
      `/api/boards/${boardId}/categories/${catId}/assets/${assetId}/crypto-buys`,
      dto,
    );
  }
  updateCryptoBuy(
    boardId: string,
    catId: string,
    assetId: string,
    buyId: string,
    dto: UpdateCryptoBuyDto,
  ) {
    return this.http.patch<CryptoBuyDto>(
      `/api/boards/${boardId}/categories/${catId}/assets/${assetId}/crypto-buys/${buyId}`,
      dto,
    );
  }
  deleteCryptoBuy(
    boardId: string,
    catId: string,
    assetId: string,
    buyId: string,
  ) {
    return this.http.delete<void>(
      `/api/boards/${boardId}/categories/${catId}/assets/${assetId}/crypto-buys/${buyId}`,
    );
  }

  // Entries
  submitEntries(boardId: string, dto: SubmitEntriesDto) {
    return this.http.post<DailyEntriesDto>(
      `/api/boards/${boardId}/entries`,
      dto,
    );
  }
  getLatestEntries(boardId: string) {
    return this.http.get<AssetEntryDto[]>(
      `/api/boards/${boardId}/entries/latest`,
    );
  }
  getEntriesForDate(boardId: string, date: string) {
    return this.http.get<DailyEntriesDto>(`/api/boards/${boardId}/entries`, {
      params: new HttpParams().set('date', date),
    });
  }
  getNav(
    boardId: string,
    from?: string,
    to?: string,
    granularity?: 'monthly' | 'quarterly' | 'yearly',
  ) {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    if (granularity) params = params.set('granularity', granularity);
    return this.http.get<NavSnapshotDto[]>(`/api/boards/${boardId}/nav`, {
      params,
    });
  }

  upsertManualNav(boardId: string, dto: UpsertNavSnapshotDto) {
    return this.http.post<NavSnapshotDto>(`/api/boards/${boardId}/nav`, dto);
  }

  deleteNav(boardId: string, snapshotId: string) {
    return this.http.delete<void>(`/api/boards/${boardId}/nav/${snapshotId}`);
  }

  // Cash Flow
  listCashFlow(boardId: string) {
    return this.http.get<CashFlowEntryDto[]>(
      `/api/boards/${boardId}/cash-flow`,
    );
  }
  createCashFlow(boardId: string, dto: CreateCashFlowDto) {
    return this.http.post<CashFlowEntryDto>(
      `/api/boards/${boardId}/cash-flow`,
      dto,
    );
  }
  updateCashFlow(boardId: string, entryId: string, dto: UpdateCashFlowDto) {
    return this.http.patch<CashFlowEntryDto>(
      `/api/boards/${boardId}/cash-flow/${entryId}`,
      dto,
    );
  }
  deleteCashFlow(boardId: string, entryId: string) {
    return this.http.delete<void>(
      `/api/boards/${boardId}/cash-flow/${entryId}`,
    );
  }

  // Users
  searchUsers(email: string) {
    return this.http.get<UserDto[]>('/api/users/search', {
      params: new HttpParams().set('email', email),
    });
  }
}
