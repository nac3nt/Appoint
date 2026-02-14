import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-alert-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-modal.component.html',
  styleUrl: './alert-modal.component.css'
})
export class AlertModalComponent {
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() type: 'success' | 'error' | 'info' = 'info';
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }
}
