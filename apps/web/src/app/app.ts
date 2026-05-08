import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  selector: 'app-root',
  template: '<router-outlet />',
  styleUrl: './app.scss',
})
export class App {
  private readonly _theme = inject(ThemeService);
}
