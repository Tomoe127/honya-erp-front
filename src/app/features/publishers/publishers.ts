import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { CatalogTabs } from '../../shared/components/catalog-tabs/catalog-tabs';
import { Publisher } from './data/publisher.model';
import { PublisherService } from './data/publisher.service';

@Component({
  selector: 'app-publishers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatButtonModule, MatPaginatorModule, MatTableModule, CatalogTabs],
  template: `
    <h1 class="font-serif text-2xl font-semibold tracking-tight text-ink mb-1">Editoriales</h1>
    <p class="text-sm text-ink-muted mb-6">Proveedores editoriales del catálogo.</p>

    <app-catalog-tabs />

    <div class="rounded-lg border border-line bg-paper p-5 mb-6" [class.spine]="!!editingId()">
      <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-3">
        {{ editingId() ? 'Editar editorial' : 'Nueva editorial' }}
      </h2>
      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-wrap gap-3 items-end">
        <div class="flex flex-col gap-1.5 min-w-[200px]">
          <label for="pub-name" class="field-label">Nombre</label>
          <input id="pub-name" formControlName="name" class="field" />
        </div>

        <div class="flex flex-col gap-1.5 min-w-[200px]">
          <label for="pub-email" class="field-label">Email</label>
          <input id="pub-email" formControlName="contactEmail" class="field" />
        </div>

        <div class="flex flex-col gap-1.5 min-w-[160px]">
          <label for="pub-phone" class="field-label">Teléfono</label>
          <input id="pub-phone" formControlName="contactPhone" class="field" />
        </div>

        <div class="flex flex-col gap-1.5 flex-1 min-w-[220px]">
          <label for="pub-address" class="field-label">Dirección</label>
          <input id="pub-address" formControlName="address" class="field" />
        </div>

        <div class="flex gap-2">
          <button
            mat-flat-button
            type="submit"
            style="background-color: var(--color-brand); color: white;"
            [disabled]="form.invalid"
          >
            {{ editingId() ? 'Actualizar' : 'Crear' }}
          </button>
          @if (editingId()) {
            <button mat-button type="button" (click)="cancelEdit()">Cancelar</button>
          }
        </div>
      </form>

      @if (errorMessage()) {
        <p class="text-sm text-danger mt-2">{{ errorMessage() }}</p>
      }
    </div>

    <div class="rounded-lg border border-line bg-paper overflow-hidden">
      <table mat-table [dataSource]="publishers()" class="w-full">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Nombre</th>
          <td mat-cell *matCellDef="let publisher">{{ publisher.name }}</td>
        </ng-container>

        <ng-container matColumnDef="contactEmail">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let publisher">{{ publisher.contactEmail }}</td>
        </ng-container>

        <ng-container matColumnDef="contactPhone">
          <th mat-header-cell *matHeaderCellDef>Teléfono</th>
          <td mat-cell *matCellDef="let publisher">{{ publisher.contactPhone }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let publisher" class="text-right">
            <button
              type="button"
              class="text-sm font-medium text-brand hover:underline"
              (click)="edit(publisher)"
            >
              Editar
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>

      <mat-paginator
        [length]="totalElements()"
        [pageSize]="pageSize()"
        [pageIndex]="pageIndex()"
        [pageSizeOptions]="[10, 20, 50]"
        (page)="onPageChange($event)"
      />
    </div>
  `,
})
export class Publishers {
  private readonly fb = inject(FormBuilder);
  private readonly publisherService = inject(PublisherService);

  protected readonly columns = ['name', 'contactEmail', 'contactPhone', 'actions'];
  protected readonly publishers = signal<Publisher[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly editingId = signal<number | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    contactEmail: [''],
    contactPhone: [''],
    address: [''],
  });

  constructor() {
    this.load();
  }

  private load(): void {
    this.publisherService.list(this.pageIndex(), this.pageSize()).subscribe({
      next: (response) => {
        const page = response.data;
        if (page) {
          this.publishers.set(page.content);
          this.totalElements.set(page.totalElements);
        }
      },
    });
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  protected edit(publisher: Publisher): void {
    this.editingId.set(publisher.id);
    this.form.setValue({
      name: publisher.name,
      contactEmail: publisher.contactEmail ?? '',
      contactPhone: publisher.contactPhone ?? '',
      address: publisher.address ?? '',
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', contactEmail: '', contactPhone: '', address: '' });
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.errorMessage.set(null);
    const request = this.form.getRawValue();
    const id = this.editingId();

    const operation = id ? this.publisherService.update(id, request) : this.publisherService.create(request);

    operation.subscribe({
      next: () => {
        this.cancelEdit();
        this.load();
      },
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }
}
