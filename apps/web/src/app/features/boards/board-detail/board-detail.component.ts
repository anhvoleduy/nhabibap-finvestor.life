import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  AssetCategoryDto,
  BoardDto,
  CategoryType,
  CreateCategoryDto,
} from '@nhabibap-myportfolio/shared-types';
import { RenameBoardDialogComponent } from './rename-board-dialog.component';
import { BoardApiService } from '../../../core/board-api.service';
import { AuthService } from '../../../core/auth.service';
import { OverviewTabComponent } from './tabs/overview/overview-tab.component';
import { CategoryAssetsTabComponent } from './tabs/category-assets/category-assets-tab.component';
import { NavTabComponent } from './tabs/ytd/ytd-tab.component';
import { CashFlowTabComponent } from './tabs/cash-flow-tab/cash-flow-tab.component';
import { ShareBoardDialogComponent } from './share-board-dialog.component';
import { AddCategoryDialogComponent } from './add-category-dialog.component';

const STATIC_TABS = new Set(['overview', 'nav', 'cash-flow']);

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-board-detail',
  standalone: true,
  imports: [
    RouterLink,
    DragDropModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
    OverviewTabComponent,
    CategoryAssetsTabComponent,
    NavTabComponent,
    CashFlowTabComponent,
  ],
  template: `
    <mat-toolbar color="primary">
      <button mat-icon-button routerLink="/boards">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <span>{{ board()?.name ?? '...' }}</span>
      @if (canEdit()) {
        <button
          mat-icon-button
          (click)="openRename()"
          matTooltip="Đổi tên"
          style="margin-left:2px;opacity:0.8"
        >
          <mat-icon style="font-size:18px;width:18px;height:18px"
            >edit</mat-icon
          >
        </button>
      }
      @if (board()?.role) {
        <span class="role-badge" [style.background]="roleColor()">
          {{ roleLabel() }}
        </span>
      }
      <span style="flex:1"></span>
      @if (isOwner()) {
        <button
          mat-icon-button
          color="warn"
          (click)="deleteBoard()"
          matTooltip="Xóa bảng"
          style="margin-right:4px"
        >
          <mat-icon>delete</mat-icon>
        </button>
      }
      <button mat-stroked-button (click)="openShare()" style="margin-right:8px">
        <mat-icon>person_add</mat-icon> Chia sẻ
      </button>
      <button mat-flat-button [routerLink]="['/boards', boardId(), 'entry']">
        <mat-icon>edit_note</mat-icon> Cập nhật giá trị
      </button>
    </mat-toolbar>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <div class="page">
      @if (!loading()) {
        <div class="tab-bar">
          <button
            class="tab-btn"
            [class.tab-btn--active]="activeTab() === 'overview'"
            (click)="activeTab.set('overview')"
          >
            Tổng quan
          </button>

          <div
            class="tab-drag-zone"
            cdkDropList
            cdkDropListOrientation="horizontal"
            (cdkDropListDropped)="onCategoryDrop($event)"
          >
            @for (cat of sortedCategories(); track cat.id) {
              <button
                class="tab-btn tab-btn--draggable"
                [class.tab-btn--active]="activeTab() === cat.id"
                (click)="activeTab.set(cat.id)"
                cdkDrag
                cdkDragLockAxis="x"
              >
                <mat-icon class="drag-handle" cdkDragHandle
                  >drag_indicator</mat-icon
                >
                {{ cat.label }}
                <div *cdkDragPlaceholder class="tab-placeholder"></div>
              </button>
            }
          </div>

          @if (canEdit()) {
            <button
              class="add-cat-btn"
              (click)="openAddCategory()"
              matTooltip="Thêm danh mục"
            >
              <mat-icon>add</mat-icon> Danh mục
            </button>
          }

          <button
            class="tab-btn"
            [class.tab-btn--active]="activeTab() === 'nav'"
            (click)="activeTab.set('nav')"
          >
            NAV
          </button>

          <button
            class="tab-btn"
            [class.tab-btn--active]="activeTab() === 'cash-flow'"
            (click)="activeTab.set('cash-flow')"
          >
            Dòng tiền
          </button>
        </div>
        <div class="tab-bar__divider"></div>

        @if (activeTab() === 'overview') {
          <div class="tab-content">
            <app-overview-tab [categories]="sortedCategories()" />
          </div>
        }

        @for (cat of sortedCategories(); track cat.id) {
          @if (activeTab() === cat.id) {
            <div class="tab-content">
              <app-category-assets-tab
                [boardId]="boardId()"
                [category]="cat"
                (refreshed)="loadCategories()"
              />
            </div>
          }
        }

        @if (activeTab() === 'nav') {
          <div class="tab-content">
            <app-nav-tab [boardId]="boardId()" />
          </div>
        }

        @if (activeTab() === 'cash-flow') {
          <div class="tab-content">
            <app-cash-flow-tab [boardId]="boardId()" [canEdit]="canEdit()" />
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .role-badge {
        margin-left: 12px;
        padding: 2px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        color: #fff;
      }

      .page {
        padding: 0 24px 24px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .tab-bar {
        display: flex;
        align-items: stretch;
        overflow-x: auto;
        scrollbar-width: none;
      }

      .tab-bar::-webkit-scrollbar {
        display: none;
      }

      .tab-drag-zone {
        display: flex;
        align-items: stretch;
      }

      .tab-btn {
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 0 16px;
        height: 48px;
        border: none;
        border-bottom: 2px solid transparent;
        background: transparent;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        font-family: inherit;
        color: var(--mat-sys-on-surface-variant);
        white-space: nowrap;
        transition:
          color 150ms,
          background 150ms,
          border-color 150ms;
      }

      .tab-btn:hover {
        color: var(--mat-sys-on-surface);
        background: color-mix(
          in srgb,
          var(--mat-sys-on-surface) 8%,
          transparent
        );
      }

      .tab-btn--active {
        color: var(--mat-sys-primary);
        border-bottom-color: var(--mat-sys-primary);
      }

      .drag-handle {
        font-size: 16px;
        width: 16px;
        height: 16px;
        opacity: 0;
        cursor: grab;
        transition: opacity 150ms;
        color: var(--mat-sys-on-surface-variant);
      }

      .tab-btn--draggable:hover .drag-handle {
        opacity: 0.5;
      }

      .tab-bar__divider {
        height: 1px;
        background: var(--mat-sys-outline-variant);
      }

      .tab-content {
        padding: 24px 0;
      }

      .tab-placeholder {
        width: 80px;
        height: 44px;
        background: color-mix(in srgb, var(--mat-sys-primary) 12%, transparent);
        border-radius: 4px;
        border: 1px dashed var(--mat-sys-primary);
      }

      .cdk-drag-preview {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        border-radius: 4px;
        opacity: 0.9;
        background: var(--mat-sys-surface);
        color: var(--mat-sys-on-surface);
        border-bottom-color: transparent !important;
      }

      .cdk-drag-animating {
        transition: transform 150ms ease;
      }

      .tab-drag-zone.cdk-drop-list-dragging
        .tab-btn:not(.cdk-drag-placeholder) {
        transition: transform 150ms ease;
      }

      .add-cat-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 0 12px;
        height: 48px;
        border: 1px dashed var(--mat-sys-outline-variant);
        border-bottom: none;
        border-radius: 4px 4px 0 0;
        background: transparent;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        font-family: inherit;
        color: var(--mat-sys-on-surface-variant);
        white-space: nowrap;
        transition:
          color 150ms,
          background 150ms,
          border-color 150ms;
      }

      .add-cat-btn mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .add-cat-btn:hover {
        color: var(--mat-sys-primary);
        border-color: var(--mat-sys-primary);
        background: color-mix(in srgb, var(--mat-sys-primary) 8%, transparent);
      }
    `,
  ],
})
export class BoardDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(BoardApiService);
  readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  boardId = signal('');
  board = signal<BoardDto | null>(null);
  categories = signal<AssetCategoryDto[]>([]);
  loading = signal(true);
  activeTab = signal<string>('overview');
  categoryOrder = signal<string[]>([]);

  sortedCategories = computed(() => {
    const cats = this.categories();
    const order = this.categoryOrder();
    if (order.length === 0) return cats;
    const ordered = order
      .map((id) => cats.find((c) => c.id === id))
      .filter(Boolean) as AssetCategoryDto[];
    const unordered = cats.filter((c) => !order.includes(c.id));
    return [...ordered, ...unordered];
  });

  roleLabel = computed(() => {
    const r = this.board()?.role;
    return r === 'OWNER' ? 'Chủ sở hữu' : r === 'EDITOR' ? 'Chỉnh sửa' : 'Xem';
  });
  roleColor = computed(() => {
    const r = this.board()?.role;
    return r === 'OWNER' ? '#7c3aed' : r === 'EDITOR' ? '#1d4ed8' : '#6b7280';
  });
  canEdit = computed(() => {
    const r = this.board()?.role;
    return r === 'OWNER' || r === 'EDITOR';
  });
  isOwner = computed(() => this.board()?.role === 'OWNER');

  ngOnInit() {
    this.boardId.set(this.route.snapshot.paramMap.get('id') ?? '');
    this.restoreOrder();
    this.loadAll();
  }

  private orderKey() {
    return `cat-order-${this.boardId()}`;
  }

  private restoreOrder() {
    const stored = localStorage.getItem(this.orderKey());
    if (stored) {
      try {
        this.categoryOrder.set(JSON.parse(stored));
      } catch {
        /* ignore malformed storage */
      }
    }
  }

  private persistOrder(ids: string[]) {
    localStorage.setItem(this.orderKey(), JSON.stringify(ids));
    this.categoryOrder.set(ids);
  }

  onCategoryDrop(event: CdkDragDrop<AssetCategoryDto[]>) {
    if (event.previousIndex === event.currentIndex) return;
    const sorted = [...this.sortedCategories()];
    moveItemInArray(sorted, event.previousIndex, event.currentIndex);
    this.persistOrder(sorted.map((c) => c.id));
  }

  loadAll() {
    this.loading.set(true);
    this.api.getBoard(this.boardId()).subscribe({
      next: (b) => {
        this.board.set(b);
        this.loadCategories();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadCategories() {
    this.api.getCategories(this.boardId()).subscribe((cats) => {
      this.categories.set(cats);
      const currentOrder = this.categoryOrder();
      const newIds = cats
        .map((c) => c.id)
        .filter((id) => !currentOrder.includes(id));
      if (newIds.length > 0) {
        this.persistOrder([...currentOrder, ...newIds]);
      }
      // Guard: if active category tab was deleted, fall back to overview
      const catIds = new Set(cats.map((c) => c.id));
      if (!STATIC_TABS.has(this.activeTab()) && !catIds.has(this.activeTab())) {
        this.activeTab.set('overview');
      }
    });
  }

  openShare() {
    const ref = this.dialog.open(ShareBoardDialogComponent, {
      width: '480px',
      data: { board: this.board() },
    });
    ref.afterClosed().subscribe(() => this.loadAll());
  }

  openRename() {
    const ref = this.dialog.open(RenameBoardDialogComponent, {
      width: '360px',
      data: { name: this.board()?.name ?? '' },
    });
    ref.afterClosed().subscribe((newName: string | undefined) => {
      if (newName) {
        this.api
          .updateBoard(this.boardId(), { name: newName })
          .subscribe((b) =>
            this.board.update((prev) =>
              prev ? { ...prev, name: b.name } : prev,
            ),
          );
      }
    });
  }

  openAddCategory() {
    const usedTypes = this.categories().map((c) => c.type);
    const ref = this.dialog.open(AddCategoryDialogComponent, {
      width: '360px',
      data: { usedTypes },
    });
    ref.afterClosed().subscribe((type: CategoryType | undefined) => {
      if (type) {
        const dto: CreateCategoryDto = { type };
        this.api
          .createCategory(this.boardId(), dto)
          .subscribe(() => this.loadCategories());
      }
    });
  }

  deleteBoard() {
    const name = this.board()?.name ?? 'bảng này';
    if (!confirm(`Xóa "${name}"? Thao tác không thể hoàn tác.`)) return;
    this.api.deleteBoard(this.boardId()).subscribe(() => {
      this.router.navigate(['/boards']);
    });
  }
}
