import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { BoardListComponent } from './board-list.component';
import { BoardApiService } from '../../../core/board-api.service';

let api: {
  listBoards: ReturnType<typeof vi.fn>;
  createBoard: ReturnType<typeof vi.fn>;
};
let dialogOpenSpy: ReturnType<typeof vi.fn>;

function setup(
  apiOverrides: Partial<typeof api> = {},
  closedValue: string | undefined = undefined,
): {
  fixture: ComponentFixture<BoardListComponent>;
  component: BoardListComponent;
} {
  api = {
    listBoards: vi.fn().mockReturnValue(of([])),
    createBoard: vi.fn().mockReturnValue(of({})),
    ...apiOverrides,
  };

  dialogOpenSpy = vi.fn().mockReturnValue({
    afterClosed: () => of(closedValue),
  } as MatDialogRef<unknown>);
  vi.spyOn(MatDialog.prototype, 'open').mockImplementation(
    dialogOpenSpy as never,
  );

  TestBed.configureTestingModule({
    imports: [BoardListComponent],
    providers: [
      provideRouter([]),
      provideAnimationsAsync(),
      provideTranslateService(),
      { provide: BoardApiService, useValue: api },
    ],
  });

  const fixture = TestBed.createComponent(BoardListComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('BoardListComponent', () => {
  describe('load', () => {
    it('populates boards signal on success', () => {
      const boards = [
        {
          id: 'b1',
          name: 'Board',
          role: 'OWNER',
          ownerName: 'me',
          totalCapital: 100,
          totalValue: 120,
          profitPct: 20,
        },
      ];
      const { component } = setup({
        listBoards: vi.fn().mockReturnValue(of(boards)),
      });
      expect(component.boards()).toEqual(boards);
      expect(component.loading()).toBe(false);
    });

    it('clears loading on error', () => {
      const { component } = setup({
        listBoards: vi.fn().mockReturnValue(throwError(() => new Error('x'))),
      });
      expect(component.loading()).toBe(false);
      expect(component.boards()).toEqual([]);
    });
  });

  describe('openCreate', () => {
    it('opens dialog and skips create when no name returned', () => {
      const { component } = setup({}, undefined);
      component.openCreate();
      expect(dialogOpenSpy).toHaveBeenCalled();
      expect(api.createBoard).not.toHaveBeenCalled();
    });

    it('creates board then reloads when dialog returns name', () => {
      const { component } = setup({}, 'New Board');
      api.listBoards.mockClear();

      component.openCreate();

      expect(api.createBoard).toHaveBeenCalledWith({ name: 'New Board' });
      expect(api.listBoards).toHaveBeenCalled();
    });
  });
});
