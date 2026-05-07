import { Component, Input, OnInit, ViewChild, AfterViewInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { ScrollingModule } from '@angular/cdk/scrolling';

export interface TableColumn {
  label: string;
  key: string;
}

@Component({
  selector: 'app-custom-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule, ScrollingModule],
  templateUrl: './custom-table.html',
  styleUrl: './custom-table.scss',
})
export class CustomTable <T> implements OnInit, AfterViewInit {

  @Input() columns: TableColumn[] = [];
  @Input() viewportHeight: string = '400px';
  
  @Input() set data(value: T[]) {
    this.dataSource.data = value ?? [];
  }

  @Output() edit = new EventEmitter<T>();
  @Output() delete = new EventEmitter<T>();

  public dataSource = new MatTableDataSource<T>([]);
  public displayedColumns: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
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
