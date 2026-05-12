import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  CashFlowEntryDto,
  FlowType,
} from '@nhabibap-myportfolio/shared-types';
import { CashFlowTabComponent } from './cash-flow-tab.component';
import { BoardApiService } from '../../../../../core/board-api.service';

function makeEntry(overrides: Partial<CashFlowEntryDto> = {}): CashFlowEntryDto {
  return {
    id: 'cf1',
    boardId: 'b1',
    entryDate: '2026-01-01',
    label: 'salary',
    amount: 1000,
    flowType: FlowType.INCOME,
    ...overrides,
  };
}

let api: {
  listCashFlow: ReturnType<typeof vi.fn>;
  createCashFlow: ReturnType<typeof vi.fn>;
  updateCashFlow: ReturnType<typeof vi.fn>;
  deleteCashFlow: ReturnType<typeof vi.fn>;
};

function setup(
  entries: CashFlowEntryDto[] = [],
  overrides: Partial<typeof api> = {},
): {
  fixture: ComponentFixture<CashFlowTabComponent>;
  component: CashFlowTabComponent;
} {
  api = {
    listCashFlow: vi.fn().mockReturnValue(of(entries)),
    createCashFlow: vi.fn().mockReturnValue(of(makeEntry())),
    updateCashFlow: vi.fn().mockReturnValue(of(makeEntry())),
    deleteCashFlow: vi.fn().mockReturnValue(of(null)),
    ...overrides,
  };

  TestBed.configureTestingModule({
    imports: [CashFlowTabComponent],
    providers: [
      provideAnimationsAsync(),
      provideTranslateService(),
      { provide: BoardApiService, useValue: api },
    ],
  });
  const fixture = TestBed.createComponent(CashFlowTabComponent);
  fixture.componentRef.setInput('boardId', 'b1');
  fixture.componentRef.setInput('canEdit', true);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('CashFlowTabComponent', () => {
  describe('computed totals', () => {
    it('separates income vs expense entries', () => {
      const { component } = setup([
        makeEntry({ id: '1', flowType: FlowType.INCOME, amount: 100 }),
        makeEntry({ id: '2', flowType: FlowType.EXPENSE, amount: 50 }),
        makeEntry({ id: '3', flowType: FlowType.INCOME, amount: 200 }),
      ]);
      expect(component.incomeEntries().length).toBe(2);
      expect(component.expenseEntries().length).toBe(1);
    });

    it('totalIncome sums income amounts', () => {
      const { component } = setup([
        makeEntry({ id: '1', flowType: FlowType.INCOME, amount: 100 }),
        makeEntry({ id: '2', flowType: FlowType.INCOME, amount: 200 }),
      ]);
      expect(component.totalIncome()).toBe(300);
    });

    it('totalExpense sums expense amounts', () => {
      const { component } = setup([
        makeEntry({ id: '1', flowType: FlowType.EXPENSE, amount: 50 }),
        makeEntry({ id: '2', flowType: FlowType.EXPENSE, amount: 75 }),
      ]);
      expect(component.totalExpense()).toBe(125);
    });

    it('net = totalIncome − totalExpense', () => {
      const { component } = setup([
        makeEntry({ id: '1', flowType: FlowType.INCOME, amount: 1000 }),
        makeEntry({ id: '2', flowType: FlowType.EXPENSE, amount: 300 }),
      ]);
      expect(component.net()).toBe(700);
    });

    it('net is negative when expenses exceed income', () => {
      const { component } = setup([
        makeEntry({ id: '1', flowType: FlowType.INCOME, amount: 100 }),
        makeEntry({ id: '2', flowType: FlowType.EXPENSE, amount: 500 }),
      ]);
      expect(component.net()).toBe(-400);
    });
  });

  describe('openAddForm', () => {
    it('sets flowType + shows form', () => {
      const { component } = setup();
      component.openAddForm(FlowType.EXPENSE);
      expect(component.formFlowType()).toBe(FlowType.EXPENSE);
      expect(component.showForm()).toBe(true);
      expect(component.form.value.flowType).toBe(FlowType.EXPENSE);
    });
  });

  describe('add', () => {
    it('skips when form invalid', () => {
      const { component } = setup();
      component.add();
      expect(api.createCashFlow).not.toHaveBeenCalled();
    });

    it('creates entry with current date + form values', () => {
      const { component } = setup();
      component.form.setValue({
        label: 'rent',
        amount: 1000,
        flowType: FlowType.EXPENSE,
      });

      component.add();

      expect(api.createCashFlow).toHaveBeenCalledWith(
        'b1',
        expect.objectContaining({
          label: 'rent',
          amount: 1000,
          flowType: FlowType.EXPENSE,
          entryDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
      );
    });

    it('hides form + reloads on success', () => {
      const { component } = setup();
      api.listCashFlow.mockClear();
      component.form.setValue({
        label: 'rent',
        amount: 1000,
        flowType: FlowType.EXPENSE,
      });
      component.showForm.set(true);

      component.add();

      expect(component.showForm()).toBe(false);
      expect(api.listCashFlow).toHaveBeenCalled();
    });
  });

  describe('startEdit / saveEdit', () => {
    it('startEdit populates editForm + editingId', () => {
      const entry = makeEntry({
        id: 'e1',
        label: 'salary',
        amount: 5000,
        flowType: FlowType.INCOME,
      });
      const { component } = setup([entry]);
      component.startEdit(entry);
      expect(component.editingId()).toBe('e1');
      expect(component.editForm.value).toEqual({
        label: 'salary',
        amount: 5000,
        flowType: FlowType.INCOME,
      });
    });

    it('saveEdit calls updateCashFlow + clears editingId', () => {
      const entry = makeEntry({ id: 'e1' });
      const { component } = setup([entry]);
      component.startEdit(entry);
      component.editForm.patchValue({ amount: 9999 });

      component.saveEdit(entry);

      expect(api.updateCashFlow).toHaveBeenCalledWith(
        'b1',
        'e1',
        expect.objectContaining({ amount: 9999 }),
      );
      expect(component.editingId()).toBeNull();
    });

    it('saveEdit skips when form invalid', () => {
      const { component } = setup();
      component.editForm.setValue({
        label: '',
        amount: 0,
        flowType: FlowType.INCOME,
      });
      component.saveEdit(makeEntry({ id: 'x' }));
      expect(api.updateCashFlow).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('calls deleteCashFlow then reloads', () => {
      const entry = makeEntry({ id: 'e1' });
      const { component } = setup([entry]);
      api.listCashFlow.mockClear();
      component.remove(entry);
      expect(api.deleteCashFlow).toHaveBeenCalledWith('b1', 'e1');
      expect(api.listCashFlow).toHaveBeenCalled();
    });
  });
});
