import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeFormat',
  standalone: true
})
export class TimeFormatPipe implements PipeTransform {
  transform(time: string | undefined): string {
    if (!time) return '';
    
    const parts = time.split(':');
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      
      return `${hours}:${minutes} ${period}`;
    }
    
    return time;
  }
}