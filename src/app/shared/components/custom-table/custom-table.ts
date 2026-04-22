import { Component, Input, OnInit, ViewChild, AfterViewInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';

export interface TableColumn {
  label: string; // Título de la columna (ej: 'Descripción')
  key: string;   // Propiedad del objeto (ej: 'description')
}

@Component({
  selector: 'app-custom-table',
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule],
  templateUrl: './custom-table.html',
  styleUrl: './custom-table.scss',
})
export class CustomTable <T> implements OnInit, AfterViewInit {

  @Input() columns: TableColumn[] = [];
  
  // Usamos un setter para actualizar el DataSource automáticamente cuando cambien los datos
  @Input() set data(value: T[]) {
    this.dataSource.data = value;
  }

  @Output() edit = new EventEmitter<T>();
  @Output() delete = new EventEmitter<T>();

  public dataSource = new MatTableDataSource<T>([]);
  public displayedColumns: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    // this.displayedColumns = this.columns.map(col => col.key);
    this.displayedColumns = [...this.columns.map(col => col.key), 'actions'];
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onEdit(item: T) {
    this.edit.emit(item);
  }

  onDelete(item: T) {
    this.delete.emit(item);
  }
}
