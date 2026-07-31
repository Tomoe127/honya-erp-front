import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <router-outlet />
    </div>
  `,
})
export class AuthLayout {}
