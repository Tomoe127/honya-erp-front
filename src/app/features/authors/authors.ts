import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { CatalogTabs } from '../../shared/components/catalog-tabs/catalog-tabs';
import { Author } from './data/author.model';
import { AuthorService } from './data/author.service';

@Component({
  selector: 'app-authors',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatTableModule,
    CatalogTabs,
  ],
  template: `
    <app-catalog-tabs />

    <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-wrap gap-2 items-start mb-4">
      <mat-form-field appearance="outline">
        <mat-label>Nombre</mat-label>
        <input matInput formControlName="name" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="flex-1 min-w-[200px]">
        <mat-label>Biografía</mat-label>
        <input matInput formControlName="bio" />
      </mat-form-field>

      <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
        {{ editingId() ? 'Actualizar' : 'Crear' }}
      </button>
      @if (editingId()) {
        <button mat-button type="button" (click)="cancelEdit()">Cancelar</button>
      }
    </form>

    @if (errorMessage()) {
      <p class="text-red-600 text-sm mb-2">{{ errorMessage() }}</p>
    }

    <table mat-table [dataSource]="authors()" class="w-full">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Nombre</th>
        <td mat-cell *matCellDef="let author">{{ author.name }}</td>
      </ng-container>

      <ng-container matColumnDef="bio">
        <th mat-header-cell *matHeaderCellDef>Biografía</th>
        <td mat-cell *matCellDef="let author">{{ author.bio }}</td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let author">
          <button mat-button (click)="edit(author)">Editar</button>
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
  `,
})
export class Authors {
  private readonly fb = inject(FormBuilder);
  private readonly authorService = inject(AuthorService);

  protected readonly columns = ['name', 'bio', 'actions'];
  protected readonly authors = signal<Author[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly editingId = signal<number | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    bio: [''],
  });

  constructor() {
    this.load();
  }

  private load(): void {
    this.authorService.list(this.pageIndex(), this.pageSize()).subscribe({
      next: (response) => {
        const page = response.data;
        if (page) {
          this.authors.set(page.content);
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

  protected edit(author: Author): void {
    this.editingId.set(author.id);
    this.form.setValue({ name: author.name, bio: author.bio ?? '' });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', bio: '' });
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.errorMessage.set(null);
    const request = this.form.getRawValue();
    const id = this.editingId();

    const operation = id ? this.authorService.update(id, request) : this.authorService.create(request);

    operation.subscribe({
      next: () => {
        this.cancelEdit();
        this.load();
      },
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }
}
