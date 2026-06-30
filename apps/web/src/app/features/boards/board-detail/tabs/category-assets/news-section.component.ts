import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { CategoryType, NewsItemDto } from '@nhabibap-myportfolio/shared-types';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-news-section',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    TranslateModule,
  ],
  template: `
    <section class="news">
      <div class="news__head">
        <h3 class="news__title">
          <mat-icon>article</mat-icon>
          {{ 'NEWS.TITLE' | translate }}
        </h3>
        <button
          mat-icon-button
          class="news__refresh"
          [disabled]="news.isLoading()"
          (click)="news.reload()"
          [attr.aria-label]="'NEWS.REFRESH' | translate"
        >
          <mat-icon>refresh</mat-icon>
        </button>
      </div>

      @if (news.isLoading()) {
        <mat-progress-bar mode="indeterminate" />
        <p class="news__hint">{{ 'NEWS.LOADING' | translate }}</p>
      } @else if (news.error()) {
        <p class="news__hint news__hint--error">
          {{ 'NEWS.ERROR' | translate }}
        </p>
      } @else if (news.value().length === 0) {
        <p class="news__hint">{{ 'NEWS.EMPTY' | translate }}</p>
      } @else {
        <ul class="news__list">
          @for (item of news.value(); track item.url) {
            <li class="news__item">
              <a
                class="news__link"
                [href]="item.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ item.title }}
              </a>
              <span class="news__meta">
                {{ item.source }}
                @if (item.publishedAt) {
                  · {{ item.publishedAt | date: 'short' }}
                }
              </span>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [
    `
      .news {
        margin-top: 32px;
        padding-top: 20px;
        border-top: 1px solid var(--mat-sys-outline-variant);
      }
      .news__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .news__title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
      }
      .news__title mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--mat-sys-primary);
      }
      .news__hint {
        color: var(--mat-sys-on-surface-variant);
        font-size: 14px;
        margin: 8px 0;
      }
      .news__hint--error {
        color: #ef4444;
      }
      .news__list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .news__item {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 10px 12px;
        border-radius: 8px;
        transition: background 150ms;
      }
      .news__item:hover {
        background: var(--mat-sys-surface-container-low);
      }
      .news__link {
        font-size: 14px;
        font-weight: 500;
        color: var(--mat-sys-on-surface);
        text-decoration: none;
      }
      .news__link:hover {
        color: var(--mat-sys-primary);
        text-decoration: underline;
      }
      .news__meta {
        font-size: 12px;
        color: var(--mat-sys-on-surface-variant);
      }
    `,
  ],
})
export class NewsSectionComponent {
  type = input.required<CategoryType>();

  protected readonly news = httpResource<NewsItemDto[]>(
    () => ({ url: '/api/news', params: { type: this.type() } }),
    { defaultValue: [] },
  );
}
