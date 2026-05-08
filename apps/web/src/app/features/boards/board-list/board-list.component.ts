import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { BoardSummaryDto } from '@nhabibap-myportfolio/shared-types';
import { BoardApiService } from '../../../core/board-api.service';
import { AuthService } from '../../../core/auth.service';
import { VndCurrencyPipe } from '../../../shared/pipes/vnd-currency.pipe';
import { CreateBoardDialogComponent } from './create-board-dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-board-list',
  standalone: true,
  imports: [
    RouterLink,
    DecimalPipe,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    MatProgressBarModule,
    MatChipsModule,
    VndCurrencyPipe,
  ],
  template: `
    <mat-toolbar color="primary">
      <mat-icon style="margin-right:8px">trending_up</mat-icon>
      <span>Portfolio Tracker</span>
      <span style="flex:1"></span>
      <span style="font-size:14px; margin-right:12px; opacity:0.9">
        {{ auth.currentUser()?.name }}
      </span>
      <button mat-icon-button (click)="auth.logout()" matTooltip="Đăng xuất">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <div class="page">
      <div class="page__header">
        <div>
          <h2 class="page__title">Danh mục đầu tư</h2>
          <p class="page__subtitle">Quản lý và theo dõi tài sản của bạn</p>
        </div>
        <button mat-flat-button (click)="openCreate()">
          <mat-icon>add</mat-icon> Tạo mới
        </button>
      </div>

      @if (!loading() && boards().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">account_balance</mat-icon>
          <p class="empty-title">Chưa có danh mục nào</p>
          <p class="empty-sub">Tạo danh mục đầu tư đầu tiên của bạn</p>
          <button mat-flat-button (click)="openCreate()">
            <mat-icon>add</mat-icon> Tạo mới
          </button>
        </div>
      }

      <div class="boards-grid">
        @for (board of boards(); track board.id) {
          <mat-card class="board-card" [routerLink]="['/boards', board.id]">
            <mat-card-header>
              <mat-card-title>{{ board.name }}</mat-card-title>
              <mat-card-subtitle>
                <mat-chip
                  class="role-chip"
                  [class.chip-owner]="board.role === 'OWNER'"
                  [class.chip-editor]="board.role === 'EDITOR'"
                  [class.chip-viewer]="board.role === 'VIEWER'"
                >
                  {{
                    board.role === 'OWNER'
                      ? 'Chủ sở hữu'
                      : board.role === 'EDITOR'
                        ? 'Chỉnh sửa'
                        : 'Xem'
                  }}
                </mat-chip>
                @if (board.role !== 'OWNER') {
                  <span class="owner-name">{{ board.ownerName }}</span>
                }
              </mat-card-subtitle>
            </mat-card-header>

            <mat-card-content>
              <div class="board-stats">
                <div class="stat">
                  <span class="stat__label">Tổng vốn</span>
                  <span class="stat__value">{{
                    board.totalCapital | vnd
                  }}</span>
                </div>
                <div class="stat">
                  <span class="stat__label">Giá trị hiện tại</span>
                  <span class="stat__value">{{ board.totalValue | vnd }}</span>
                </div>
                <div class="stat">
                  <span class="stat__label">Lợi nhuận</span>
                  <span
                    class="stat__value"
                    [class.positive]="board.profitPct >= 0"
                    [class.negative]="board.profitPct < 0"
                  >
                    {{ board.profitPct >= 0 ? '+' : ''
                    }}{{ board.profitPct | number: '1.2-2' }}%
                  </span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 24px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .page__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 28px;
      }

      .page__title {
        margin: 0 0 4px;
        font-size: 24px;
        font-weight: 500;
        color: var(--mat-sys-on-surface);
      }

      .page__subtitle {
        margin: 0;
        font-size: 14px;
        color: var(--mat-sys-on-surface-variant);
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 64px 24px;
        color: var(--mat-sys-on-surface-variant);
        text-align: center;
      }

      .empty-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        opacity: 0.4;
      }

      .empty-title {
        margin: 8px 0 0;
        font-size: 18px;
        font-weight: 500;
        color: var(--mat-sys-on-surface);
      }

      .empty-sub {
        margin: 0 0 16px;
        font-size: 14px;
      }

      .boards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
      }

      .board-card {
        cursor: pointer;
        transition:
          box-shadow 0.2s,
          transform 0.15s;

        &:hover {
          transform: translateY(-2px);
        }
      }

      .role-chip {
        font-size: 11px;
        height: 20px;
        min-height: 20px;
        padding: 0 8px;
      }

      .chip-owner {
        --mdc-chip-label-text-color: #7c3aed;
        background: #ede9fe;
      }

      .chip-editor {
        --mdc-chip-label-text-color: #1d4ed8;
        background: #dbeafe;
      }

      .chip-viewer {
        --mdc-chip-label-text-color: var(--mat-sys-on-surface-variant);
        background: var(--mat-sys-surface-container);
      }

      .owner-name {
        font-size: 12px;
        color: var(--mat-sys-on-surface-variant);
        margin-left: 6px;
      }

      .board-stats {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--mat-sys-outline-variant);
      }

      .stat {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .stat__label {
        font-size: 13px;
        color: var(--mat-sys-on-surface-variant);
      }

      .stat__value {
        font-weight: 600;
        font-size: 14px;
        color: var(--mat-sys-on-surface);
      }
    `,
  ],
})
export class BoardListComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(BoardApiService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  boards = signal<BoardSummaryDto[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.listBoards().subscribe({
      next: (b) => {
        this.boards.set(b);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    const ref = this.dialog.open(CreateBoardDialogComponent, {
      width: '400px',
    });
    ref.afterClosed().subscribe((name: string | undefined) => {
      if (name) {
        this.api.createBoard({ name }).subscribe(() => this.load());
      }
    });
  }
}
