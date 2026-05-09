import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { AssetCategoryDto, AssetDto } from '@nhabibap-myportfolio/shared-types';
import { BoardApiService } from '../../../../../core/board-api.service';
import { VndCurrencyPipe } from '../../../../../shared/pipes/vnd-currency.pipe';
import { StatCardComponent } from '../../../../../shared/components/stat-card/stat-card.component';
import { GoldBuyDialogComponent } from './gold-buy-dialog.component';
import { CryptoBuyDialogComponent } from './crypto-buy-dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-category-assets-tab',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatTooltipModule,
    VndCurrencyPipe,
    StatCardComponent,
    TranslateModule,
  ],
  template: `
    <div class="cat-tab">
      <div class="cat-tab__stats">
        @if (!isCash()) {
          <app-stat-card
            [label]="'STATS.TOTAL_CAPITAL' | translate"
            [value]="category().totalCapital"
          />
        }
        <app-stat-card
          [label]="'STATS.TOTAL_VALUE' | translate"
          [value]="category().totalValue"
        />
        @if (!isCash()) {
          <app-stat-card
            [label]="'STATS.PROFIT_PCT_COL' | translate"
            [value]="category().profitPct"
            [isPercent]="true"
            [valueClass]="
              (category().profitPct ?? 0) >= 0 ? 'positive' : 'negative'
            "
          />
        }
      </div>

      <div class="cat-tab__toolbar">
        <button mat-flat-button (click)="showAddForm.set(!showAddForm())">
          <mat-icon>add</mat-icon> {{ 'ASSETS.ADD' | translate }}
        </button>
      </div>

      @if (showAddForm()) {
        <form [formGroup]="addForm" (ngSubmit)="addAsset()" class="add-form">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'COMMON.NAME' | translate }}</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>
          @if (!isCash()) {
            <mat-form-field appearance="outline">
              <mat-label>{{ 'ASSETS.CAPITAL_VND' | translate }}</mat-label>
              <input matInput type="number" formControlName="capital" />
            </mat-form-field>
          }
          <button mat-flat-button type="submit" [disabled]="addForm.invalid">
            {{ 'COMMON.ADD' | translate }}
          </button>
          <button mat-button type="button" (click)="showAddForm.set(false)">
            {{ 'COMMON.CANCEL' | translate }}
          </button>
        </form>
      }

      <table class="assets-table">
        <thead>
          <tr>
            <th>{{ 'COMMON.NAME' | translate }}</th>
            @if (!isCash()) {
              <th>{{ 'ASSETS.CAPITAL' | translate }}</th>
            }
            <th>{{ 'STATS.TOTAL_VALUE' | translate }}</th>
            @if (!isCash()) {
              <th>{{ 'STATS.PROFIT' | translate }}</th>
              <th>{{ 'STATS.PCT' | translate }}</th>
            }
            <th>{{ 'ASSETS.LAST_UPDATED' | translate }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (asset of category().assets; track asset.id) {
            @if (editingAssetId() === asset.id) {
              <tr>
                <td>
                  <input
                    class="inline-input"
                    [formControl]="editForm.controls.name"
                    [placeholder]="'COMMON.NAME' | translate"
                  />
                </td>
                @if (!isCash()) {
                  <td>
                    @if (
                      category().type !== 'GOLD' && category().type !== 'CRYPTO'
                    ) {
                      <input
                        class="inline-input"
                        type="number"
                        [formControl]="editForm.controls.capital"
                        [placeholder]="'ASSETS.CAPITAL' | translate"
                      />
                    } @else {
                      {{ editForm.controls.capital.value | vnd }}
                    }
                  </td>
                }
                <td>{{ asset.currentValue | vnd }}</td>
                @if (!isCash()) {
                  <td>{{ asset.profit | vnd }}</td>
                  <td>
                    {{
                      asset.profitPct !== null
                        ? (asset.profitPct | number: '1.2-2') + '%'
                        : '—'
                    }}
                  </td>
                }
                <td>{{ asset.lastEntryDate ?? '—' }}</td>
                <td style="white-space:nowrap">
                  <button
                    mat-icon-button
                    color="primary"
                    [disabled]="editForm.invalid || saving()"
                    (click)="saveAssetEdit()"
                  >
                    <mat-icon>check</mat-icon>
                  </button>
                  <button mat-icon-button (click)="editingAssetId.set(null)">
                    <mat-icon>close</mat-icon>
                  </button>
                </td>
              </tr>
            } @else {
              <tr>
                <td>{{ asset.name }}</td>
                @if (!isCash()) {
                  <td>{{ asset.capital | vnd }}</td>
                }
                <td>{{ asset.currentValue | vnd }}</td>
                @if (!isCash()) {
                  <td
                    [style.color]="
                      (asset.profit ?? 0) >= 0 ? '#22c55e' : '#ef4444'
                    "
                  >
                    {{ asset.profit | vnd }}
                  </td>
                  <td
                    [style.color]="
                      (asset.profitPct ?? 0) >= 0 ? '#22c55e' : '#ef4444'
                    "
                  >
                    {{
                      asset.profitPct !== null
                        ? (asset.profitPct | number: '1.2-2') + '%'
                        : '—'
                    }}
                  </td>
                }
                <td>{{ asset.lastEntryDate ?? '—' }}</td>
                <td style="white-space:nowrap">
                  @if (category().type === 'GOLD') {
                    <button
                      mat-icon-button
                      [matTooltip]="'GOLD.BUY_HISTORY' | translate"
                      (click)="openGoldBuys(asset)"
                    >
                      <mat-icon>shopping_cart</mat-icon>
                    </button>
                  }
                  @if (category().type === 'CRYPTO') {
                    <button
                      mat-icon-button
                      [matTooltip]="'CRYPTO.DEPOSIT_HISTORY' | translate"
                      (click)="openCryptoBuys(asset)"
                    >
                      <mat-icon>account_balance_wallet</mat-icon>
                    </button>
                  }
                  <button
                    mat-icon-button
                    [matTooltip]="'COMMON.EDIT' | translate"
                    (click)="startEditAsset(asset)"
                  >
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    color="warn"
                    (click)="deleteAsset(asset)"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </tr>
            }
          }
          @if (category().assets.length === 0) {
            <tr>
              <td
                [attr.colspan]="isCash() ? 4 : 7"
                style="text-align:center; color:var(--mat-sys-on-surface-variant); padding:20px"
              >
                {{ 'ASSETS.EMPTY' | translate }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      .cat-tab__stats {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 20px;
      }
      .cat-tab__toolbar {
        margin-bottom: 16px;
      }
      .add-form {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: 16px;
        padding: 16px;
        background: var(--mat-sys-surface-container-low);
        border-radius: 12px;
      }
      .add-form mat-form-field {
        flex: 1;
        min-width: 160px;
      }
      .assets-table {
        width: 100%;
        border-collapse: collapse;
      }
      .assets-table th,
      .assets-table td {
        padding: 10px 12px;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
        font-size: 14px;
      }
      .assets-table th {
        font-weight: 600;
        color: var(--mat-sys-on-surface-variant);
      }
      .assets-table td:not(:first-child) {
        text-align: right;
      }
      .assets-table th:not(:first-child) {
        text-align: right;
      }
      .inline-input {
        width: 100%;
        background: transparent;
        border: none;
        border-bottom: 1px solid var(--mat-sys-primary);
        outline: none;
        font-size: 14px;
        color: inherit;
        padding: 2px 0;
        text-align: inherit;
      }
    `,
  ],
})
export class CategoryAssetsTabComponent {
  boardId = input.required<string>();
  category = input.required<AssetCategoryDto>();
  refreshed = output<void>();

  private readonly api = inject(BoardApiService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);

  isCash = computed(() => this.category().type === 'CASH');

  showAddForm = signal(false);
  editingAssetId = signal<string | null>(null);
  saving = signal(false);

  addForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    capital: [0, [Validators.required, Validators.min(0)]],
  });

  editForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    capital: [0, [Validators.required, Validators.min(0)]],
  });

  addAsset() {
    if (this.addForm.invalid) return;
    const { name, capital } = this.addForm.getRawValue();
    const dto = this.isCash() ? { name } : { name, capital };
    this.api
      .createAsset(this.boardId(), this.category().id, dto)
      .subscribe(() => {
        this.addForm.reset({ name: '', capital: 0 });
        this.showAddForm.set(false);
        this.refreshed.emit();
      });
  }

  private get capitalManagedByHistory(): boolean {
    const t = this.category().type;
    return t === 'GOLD' || t === 'CRYPTO';
  }

  startEditAsset(asset: AssetDto) {
    this.editForm.setValue({ name: asset.name, capital: asset.capital ?? 0 });
    if (this.capitalManagedByHistory || this.isCash()) {
      this.editForm.controls.capital.disable();
    } else {
      this.editForm.controls.capital.enable();
    }
    this.editingAssetId.set(asset.id);
  }

  saveAssetEdit() {
    if (this.editForm.invalid) return;
    const id = this.editingAssetId();
    if (!id) return;
    const { name } = this.editForm.getRawValue();
    const dto =
      this.capitalManagedByHistory || this.isCash()
        ? { name }
        : { name, capital: this.editForm.controls.capital.value };
    this.saving.set(true);
    this.api
      .updateAsset(this.boardId(), this.category().id, id, dto)
      .subscribe({
        next: () => {
          this.editingAssetId.set(null);
          this.saving.set(false);
          this.refreshed.emit();
        },
        error: () => this.saving.set(false),
      });
  }

  deleteAsset(asset: AssetDto) {
    this.api
      .deleteAsset(this.boardId(), this.category().id, asset.id)
      .subscribe(() => this.refreshed.emit());
  }

  openCryptoBuys(asset: AssetDto) {
    const ref = this.dialog.open(CryptoBuyDialogComponent, {
      width: '520px',
      data: {
        boardId: this.boardId(),
        catId: this.category().id,
        asset,
      },
    });
    ref.afterClosed().subscribe((changed: boolean) => {
      if (changed) this.refreshed.emit();
    });
  }

  openGoldBuys(asset: AssetDto) {
    const ref = this.dialog.open(GoldBuyDialogComponent, {
      width: '600px',
      data: {
        boardId: this.boardId(),
        catId: this.category().id,
        asset,
      },
    });
    ref.afterClosed().subscribe((changed: boolean) => {
      if (changed) this.refreshed.emit();
    });
  }
}
